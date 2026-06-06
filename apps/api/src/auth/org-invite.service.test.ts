import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JwtService } from "../jwt/jwt.service.js";
import { OrgInviteService } from "./org-invite.service.js";

vi.mock("@repo/backend-auth-session", () => ({
  generateRefreshToken: vi.fn().mockReturnValue("a".repeat(32)),
  hashToken: vi.fn((t: string) => `hash:${t}`),
}));

const ORG_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000002";
const INVITEE_ID = "00000000-0000-0000-0000-000000000003";
const INVITE_TOKEN = "a".repeat(32);
const INVITATION_ID = "00000000-0000-0000-0000-000000000099";

const jwtOpts = { issuer: "http://localhost:3000", audience: "http://localhost:3000" };

describe("OrgInviteService.invite", () => {
  let jwtService: JwtService;

  beforeEach(async () => {
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    jwtService = { getKeyStore: () => keyStore } as unknown as JwtService;
  });

  function makeInviteService(membershipRole: "owner" | "admin" | "member" | null) {
    const mockMembershipWhere = vi
      .fn()
      .mockResolvedValue(membershipRole ? [{ role: membershipRole }] : []);
    const mockOrgWhere = vi.fn().mockResolvedValue([{ name: "Acme" }]);

    let callCount = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      callCount++;
      return {
        from: vi.fn().mockReturnValue({
          where: callCount === 1 ? mockMembershipWhere : mockOrgWhere,
        }),
      };
    });

    const mockInsertValues = vi.fn().mockResolvedValue(undefined);
    const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

    const database = { db: { select: mockSelect, insert: mockInsert } };
    const mockSendEmail = vi.fn().mockResolvedValue(undefined);
    const notifier = { sendEmail: mockSendEmail };

    const service = new OrgInviteService(
      database as never,
      jwtService,
      jwtOpts,
      notifier as never,
      "https://app.test",
    );

    return { service, mocks: { mockInsert, mockSendEmail } };
  }

  it("owner → 초대 성공, notifier.sendEmail 호출됨", async () => {
    const { service, mocks } = makeInviteService("owner");
    await service.invite(USER_ID, ORG_ID, "invitee@test.com", "member");
    expect(mocks.mockInsert).toHaveBeenCalledOnce();
    expect(mocks.mockSendEmail).toHaveBeenCalledOnce();
    const [emailArg] = mocks.mockSendEmail.mock.calls[0] as [{ to: string }];
    expect(emailArg.to).toBe("invitee@test.com");
  });

  it("member → ForbiddenException", async () => {
    const { service } = makeInviteService("member");
    await expect(
      service.invite(USER_ID, ORG_ID, "invitee@test.com", "member"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("OrgInviteService.accept", () => {
  let jwtService: JwtService;

  beforeEach(async () => {
    const keyStore = await createInMemoryKeyStore({ kid: "test-key" });
    jwtService = { getKeyStore: () => keyStore } as unknown as JwtService;
  });

  type InvitationFixture = {
    id: string;
    orgId: string;
    role: "admin" | "member";
    expiresAt: Date;
    acceptedAt: Date | null;
  };

  const validInvitation: InvitationFixture = {
    id: INVITATION_ID,
    orgId: ORG_ID,
    role: "member",
    expiresAt: new Date(Date.now() + 3600_000),
    acceptedAt: null,
  };

  function makeAcceptService(invitationRow: InvitationFixture | null) {
    const mockWhere = vi.fn().mockResolvedValue(invitationRow ? [invitationRow] : []);
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({ where: mockWhere }),
    });
    const mockInsertValues = vi.fn().mockResolvedValue(undefined);
    const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });
    const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: mockUpdateWhere }),
    });

    const database = { db: { select: mockSelect, insert: mockInsert, update: mockUpdate } };
    const service = new OrgInviteService(
      database as never,
      jwtService,
      jwtOpts,
      { sendEmail: vi.fn() } as never,
      "https://app.test",
    );

    return { service, mocks: { mockInsert, mockUpdate } };
  }

  it("유효 토큰 → memberships 삽입 + acceptedAt 업데이트 + accessToken 반환", async () => {
    const { service, mocks } = makeAcceptService(validInvitation);
    const result = await service.accept(INVITEE_ID, INVITE_TOKEN);
    expect(result.accessToken).toBeTruthy();
    expect(mocks.mockInsert).toHaveBeenCalledOnce();
    expect(mocks.mockUpdate).toHaveBeenCalledOnce();
  });

  it("토큰 없음 → NotFoundException", async () => {
    const { service } = makeAcceptService(null);
    await expect(service.accept(INVITEE_ID, INVITE_TOKEN)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("만료 → GoneException", async () => {
    const { service } = makeAcceptService({
      ...validInvitation,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.accept(INVITEE_ID, INVITE_TOKEN)).rejects.toBeInstanceOf(GoneException);
  });

  it("이미 수락 → ConflictException", async () => {
    const { service } = makeAcceptService({
      ...validInvitation,
      acceptedAt: new Date(),
    });
    await expect(service.accept(INVITEE_ID, INVITE_TOKEN)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
