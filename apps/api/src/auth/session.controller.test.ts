import type { AuthenticatedUser } from "@repo/nestjs-auth";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionController } from "./session.controller.js";
import type { SessionInfo } from "./session-management.service.js";

const user: AuthenticatedUser = {
  sub: "user-001",
  role: "user",
  orgId: "org-001",
  orgRole: "owner",
};

const fakeSessions: SessionInfo[] = [
  {
    id: "sess-001",
    current: true,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    expiresAt: new Date(),
    userAgent: "vitest",
    ip: "127.0.0.1",
  } as unknown as SessionInfo,
];

function makeSessionService() {
  return {
    listSessions: vi.fn().mockResolvedValue(fakeSessions),
    revokeSession: vi.fn().mockResolvedValue(undefined),
    revokeOtherSessions: vi.fn().mockResolvedValue(undefined),
  };
}

const CSRF_SECRET = "test-csrf-secret-value";

describe("SessionController", () => {
  let service: ReturnType<typeof makeSessionService>;
  let controller: SessionController;

  beforeEach(() => {
    service = makeSessionService();
    controller = new SessionController(CSRF_SECRET, service as never);
  });

  it("issueCsrf → csrf_id/csrf_token 쿠키 설정 + csrfToken 반환", () => {
    const res = { cookie: vi.fn() } as unknown as Response;
    const result = controller.issueCsrf(res);
    expect(typeof result.csrfToken).toBe("string");
    expect(result.csrfToken.length).toBeGreaterThan(0);
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it("listSessions → refresh_token 쿠키를 현재 세션 식별자로 위임", async () => {
    const req = { cookies: { refresh_token: "rt-123" } } as unknown as Request;
    const result = await controller.listSessions(user, req);
    expect(service.listSessions).toHaveBeenCalledWith("user-001", "rt-123");
    expect(result).toEqual({ sessions: fakeSessions });
  });

  it("listSessions → 쿠키 없으면 token undefined 로 위임", async () => {
    const req = { cookies: {} } as unknown as Request;
    await controller.listSessions(user, req);
    expect(service.listSessions).toHaveBeenCalledWith("user-001", undefined);
  });

  it("revokeSession → service.revokeSession(sub, id) 위임", async () => {
    const result = await controller.revokeSession("sess-001", user);
    expect(service.revokeSession).toHaveBeenCalledWith("user-001", "sess-001");
    expect(result).toEqual({ status: "ok" });
  });

  it("revokeOtherSessions → 현재 refresh_token 제외 위임", async () => {
    const req = { cookies: { refresh_token: "rt-123" } } as unknown as Request;
    const result = await controller.revokeOtherSessions(user, req);
    expect(service.revokeOtherSessions).toHaveBeenCalledWith("user-001", "rt-123");
    expect(result).toEqual({ status: "ok" });
  });
});
