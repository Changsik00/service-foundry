import { Test } from "@nestjs/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SENTINEL = "SENTINEL-TOKEN-do-not-log-1234567890abcdef";

// generateRefreshToken 을 sentinel 로 고정 — 토큰이 어디로 가는지 결정론적으로 검증.
vi.mock("@repo/backend-auth-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@repo/backend-auth-session")>();
  return { ...actual, generateRefreshToken: () => SENTINEL };
});

import { NOTIFIER } from "../notification/notifier.provider.js";
import { EmailVerifyService } from "./email-verify.service.js";
import { EMAIL_VERIFY_TOKEN_STORE } from "./email-verify.stores.js";
import { PasswordResetService } from "./password-reset.service.js";
import { PASSWORD_RESET_TOKEN_STORE, USER_STORE } from "./password-reset.stores.js";

const makeUser = () => ({
  id: "uid-1",
  email: "alice@example.com",
  passwordHash: "hash",
  emailVerified: false,
  createdAt: new Date(),
});

const userStore = {
  findByEmail: vi.fn(),
  updatePasswordHash: vi.fn(),
  updateEmailVerified: vi.fn(),
};
const tokenStore = { insert: vi.fn(), findByHash: vi.fn(), markUsed: vi.fn() };
const notifier = { sendEmail: vi.fn() };

const loggedText = (spy: ReturnType<typeof vi.spyOn>): string =>
  spy.mock.calls.flat().map(String).join(" ");

const sentText = (): string =>
  notifier.sendEmail.mock.calls
    .flat()
    .map((m) => JSON.stringify(m))
    .join(" ");

async function runReset(): Promise<void> {
  const m = await Test.createTestingModule({
    providers: [
      PasswordResetService,
      { provide: USER_STORE, useValue: userStore },
      { provide: PASSWORD_RESET_TOKEN_STORE, useValue: tokenStore },
      { provide: NOTIFIER, useValue: notifier },
    ],
  }).compile();
  await m.get(PasswordResetService).request("alice@example.com");
}

async function runVerify(): Promise<void> {
  const m = await Test.createTestingModule({
    providers: [
      EmailVerifyService,
      { provide: USER_STORE, useValue: userStore },
      { provide: EMAIL_VERIFY_TOKEN_STORE, useValue: tokenStore },
      { provide: NOTIFIER, useValue: notifier },
    ],
  }).compile();
  await m.get(EmailVerifyService).request("alice@example.com");
}

describe("reset/verify 토큰 — notification 포트 위임 (직접 로깅 금지)", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    userStore.findByEmail.mockResolvedValue(makeUser());
    tokenStore.insert.mockResolvedValue(undefined);
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => infoSpy.mockRestore());

  it("password-reset: 토큰을 console 에 직접 찍지 않고 notifier 로 전달", async () => {
    await runReset();
    expect(loggedText(infoSpy)).not.toContain(SENTINEL);
    expect(notifier.sendEmail).toHaveBeenCalledOnce();
    expect(sentText()).toContain(SENTINEL);
  });

  it("email-verify: 토큰을 console 에 직접 찍지 않고 notifier 로 전달", async () => {
    await runVerify();
    expect(loggedText(infoSpy)).not.toContain(SENTINEL);
    expect(notifier.sendEmail).toHaveBeenCalledOnce();
    expect(sentText()).toContain(SENTINEL);
  });
});
