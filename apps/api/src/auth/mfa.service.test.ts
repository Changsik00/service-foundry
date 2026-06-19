import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JwtService } from "../jwt/jwt.service.js";
import { MfaService } from "./mfa.service.js";

vi.mock("@repo/backend-auth-mfa", () => ({
  generateSecret: vi.fn(() => "SECRET32"),
  generateTotpUri: vi.fn(() => "otpauth://totp/test"),
  generateBackupCodes: vi.fn(() => ["bc1", "bc2"]),
  hashBackupCodes: vi.fn(async () => ["h1", "h2"]),
  verifyBackupCode: vi.fn(async () => -1),
  verifyTotp: vi.fn(() => false),
}));

vi.mock("@repo/backend-auth-session", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@repo/backend-auth-session")>();
  return { ...mod, createSession: vi.fn(async () => ({ refreshToken: "rt" })) };
});

import { verifyBackupCode, verifyTotp } from "@repo/backend-auth-mfa";

type Cfg = { secret: string; enabled: boolean; backupCodeHashes: string[] } | null;

function makeService(config: Cfg) {
  const mfaStore = {
    upsert: vi.fn(async () => {}),
    findByUserId: vi.fn(async () => config),
    updateEnabled: vi.fn(async () => {}),
    deleteByUserId: vi.fn(async () => {}),
  };
  const jwtService = new JwtService();
  const service = new MfaService(
    mfaStore as never,
    {} as never,
    { findById: vi.fn(async () => ({ id: "u", role: "user" })) } as never,
    jwtService,
    { issuer: "http://localhost:3000", audience: "http://localhost:3000" },
  );
  return { service, mfaStore, jwtService };
}

const USER = "00000000-0000-0000-0000-000000000001";

describe("MfaService", () => {
  beforeEach(() => {
    vi.mocked(verifyTotp).mockReturnValue(false);
  });

  it("enroll → secret upsert + totpUri 반환", async () => {
    const { service, mfaStore } = makeService(null);
    const res = await service.enroll(USER);
    expect(mfaStore.upsert).toHaveBeenCalledWith(USER, "SECRET32");
    expect(res.totpUri).toBe("otpauth://totp/test");
  });

  it("confirmEnroll — 미등록 config → Unauthorized", async () => {
    const { service } = makeService(null);
    await expect(service.confirmEnroll(USER, "123456")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("confirmEnroll — 잘못된 TOTP → Unauthorized", async () => {
    const { service } = makeService({ secret: "S", enabled: false, backupCodeHashes: [] });
    vi.mocked(verifyTotp).mockReturnValue(false);
    await expect(service.confirmEnroll(USER, "000000")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("confirmEnroll — 유효 TOTP → enabled 갱신 + backupCodes 반환", async () => {
    const { service, mfaStore } = makeService({
      secret: "S",
      enabled: false,
      backupCodeHashes: [],
    });
    vi.mocked(verifyTotp).mockReturnValue(true);
    const res = await service.confirmEnroll(USER, "123456");
    expect(mfaStore.updateEnabled).toHaveBeenCalledWith(USER, true, ["h1", "h2"]);
    expect(res.backupCodes).toEqual(["bc1", "bc2"]);
  });

  it("isMfaEnabled — config.enabled 반영", async () => {
    expect(
      await makeService({ secret: "S", enabled: true, backupCodeHashes: [] }).service.isMfaEnabled(
        USER,
      ),
    ).toBe(true);
    expect(await makeService(null).service.isMfaEnabled(USER)).toBe(false);
  });

  it("disable — MFA 비활성 상태 → Unauthorized", async () => {
    const { service } = makeService({ secret: "S", enabled: false, backupCodeHashes: [] });
    await expect(service.disable(USER, "123456")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("verifyMfa — 잘못된 challenge 토큰 → Unauthorized", async () => {
    const { service, jwtService } = makeService({
      secret: "S",
      enabled: true,
      backupCodeHashes: [],
    });
    await jwtService.onModuleInit();
    await expect(service.verifyMfa("garbage.token.value", "123456")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("verifyMfa — 유효 challenge + 잘못된 TOTP·backup → Unauthorized", async () => {
    const { service, jwtService } = makeService({
      secret: "S",
      enabled: true,
      backupCodeHashes: ["h1"],
    });
    await jwtService.onModuleInit();
    vi.mocked(verifyTotp).mockReturnValue(false);
    vi.mocked(verifyBackupCode).mockResolvedValue(-1);
    const token = await service.signMfaChallengeToken(USER);
    await expect(service.verifyMfa(token, "000000")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("verifyMfa — 유효 backup code → 소모(updateEnabled) + accessToken", async () => {
    const { service, jwtService, mfaStore } = makeService({
      secret: "S",
      enabled: true,
      backupCodeHashes: ["h1", "h2"],
    });
    await jwtService.onModuleInit();
    vi.mocked(verifyTotp).mockReturnValue(false);
    vi.mocked(verifyBackupCode).mockResolvedValue(0); // index 0 유효 → 소모
    const token = await service.signMfaChallengeToken(USER);
    const res = await service.verifyMfa(token, "backup-1");
    expect(mfaStore.updateEnabled).toHaveBeenCalledWith(USER, true, ["h2"]); // h1 소모됨
    expect(res.accessToken).toBeTruthy();
  });
});
