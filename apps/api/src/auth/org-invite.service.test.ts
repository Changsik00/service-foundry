import {
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from "@nestjs/common";
import { createInMemoryKeyStore } from "@repo/backend-auth-jwt";
import { TenantAls } from "@repo/backend-tenant";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { JwtService } from "../jwt/jwt.service.js";
import { OrgInviteService } from "./org-invite.service.js";

// 실제 export(sessions 테이블 등)는 보존하고 토큰 함수만 stub — @repo/backend-schema barrel 이
// 같은 패키지의 sessions 를 재export 하므로 부분 mock 필수 (spec-24-06).
vi.mock("@repo/backend-auth-session", async (orig) => ({
  ...(await orig<typeof import("@repo/backend-auth-session")>()),
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
      new TenantAls(),
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

  it("admin → 초대 성공", async () => {
    const { service, mocks } = makeInviteService("admin");
    await service.invite(USER_ID, ORG_ID, "invitee@test.com", "member");
    expect(mocks.mockInsert).toHaveBeenCalledOnce();
    expect(mocks.mockSendEmail).toHaveBeenCalledOnce();
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
    email: string;
    role: "admin" | "member";
    expiresAt: Date;
    acceptedAt: Date | null;
  };

  const INVITEE_EMAIL = "invitee@test.com";
  const validInvitation: InvitationFixture = {
    id: INVITATION_ID,
    orgId: ORG_ID,
    email: INVITEE_EMAIL,
    role: "member",
    expiresAt: new Date(Date.now() + 3600_000),
    acceptedAt: null,
  };

  /**
   * accept 의 select 순서: 1) invitations, 2) users(email), 3) memberships(dedup).
   * `userEmail`/`existingMembership` 로 C-5(email 바인딩·중복) 경로를 제어한다.
   */
  function makeAcceptService(
    invitationRow: InvitationFixture | null,
    opts: { userEmail?: string; existingMembership?: boolean } = {},
  ) {
    const userEmail = opts.userEmail ?? invitationRow?.email ?? INVITEE_EMAIL;
    let n = 0;
    const mockSelect = vi.fn().mockImplementation(() => {
      n++;
      const rows =
        n === 1
          ? invitationRow
            ? [invitationRow]
            : []
          : n === 2
            ? [{ email: userEmail }]
            : opts.existingMembership
              ? [{ id: "existing-m" }]
              : [];
      return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(rows) }) };
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
      new TenantAls(),
    );

    return { service, mocks: { mockInsert, mockUpdate } };
  }

  it("유효 토큰 + email 일치 → memberships 삽입 + acceptedAt 업데이트 + accessToken 반환", async () => {
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

  it("email 불일치 → ForbiddenException (C-5 토큰-이메일 바인딩)", async () => {
    const { service, mocks } = makeAcceptService(validInvitation, {
      userEmail: "someone-else@test.com",
    });
    await expect(service.accept(INVITEE_ID, INVITE_TOKEN)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it("이미 멤버 → ConflictException (C-5 중복 거부)", async () => {
    const { service, mocks } = makeAcceptService(validInvitation, { existingMembership: true });
    await expect(service.accept(INVITEE_ID, INVITE_TOKEN)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });
});

describe("OrgInviteService.acceptForProvider (sub 정규화 후 userId 직접, spec-x-auth-sub-normalize)", () => {
  const USER_ID = INVITEE_ID; // sub=내부 id (providerUid resolve 제거)
  const futureDate = new Date(Date.now() + 86_400_000);

  function makeProviderAcceptService() {
    // select 순서(acceptCore): 1) invitations 2) users(email·role) 3) memberships(중복) + 4) org publicId
    const responses = [
      [
        {
          id: INVITATION_ID,
          orgId: ORG_ID,
          email: "invitee@example.com",
          role: "member",
          tokenHash: `hash:${INVITE_TOKEN}`,
          expiresAt: futureDate,
          acceptedAt: null,
        },
      ],
      [{ email: "invitee@example.com", role: "user" }],
      [],
      [{ publicId: "org_PUBLICAAAAAAAAAAAAAAAA01" }],
    ];
    let n = 0;
    const mockSelect = vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(responses[n++] ?? []) }),
    }));
    const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
    const usersOrgIdWhere = vi.fn().mockResolvedValue(undefined);
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: usersOrgIdWhere }),
    });
    const database = { db: { select: mockSelect, insert: mockInsert, update: mockUpdate } };
    const als = { getStore: () => undefined } as unknown as TenantAls;
    const service = new OrgInviteService(
      database as never,
      { getKeyStore: () => null } as never,
      jwtOpts as never,
      { send: vi.fn() } as never,
      "http://localhost:2027",
      als,
    );
    return { service, mocks: { mockInsert, mockUpdate } };
  }

  it("수락 → 멤버십 생성 + users.orgId 전환 + { orgId=public_id } 반환 (토큰 재발급 없음)", async () => {
    const { service, mocks } = makeProviderAcceptService();

    const result = await service.acceptForProvider(USER_ID, INVITE_TOKEN);

    expect(result).toEqual({ orgId: "org_PUBLICAAAAAAAAAAAAAAAA01" });
    expect(mocks.mockInsert).toHaveBeenCalled(); // 멤버십
    expect(mocks.mockUpdate).toHaveBeenCalledTimes(2); // invitations.acceptedAt + users.orgId
  });
});
