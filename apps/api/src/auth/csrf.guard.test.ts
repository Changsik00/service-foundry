import { type ExecutionContext, ForbiddenException } from "@nestjs/common";
import { issueCsrfToken } from "@repo/backend-auth-rate-limit";
import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { CSRF_ID_COOKIE } from "./csrf.cookie.js";
import { CsrfGuard } from "./csrf.guard.js";

const SECRET = "test-csrf-secret";

function ctx(req: Partial<Request> & { cookies?: Record<string, string> }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function reqWith(csrfId: string | undefined, header: string | undefined): Partial<Request> {
  return {
    cookies: csrfId ? { [CSRF_ID_COOKIE]: csrfId } : {},
    headers: header ? { "x-csrf-token": header } : {},
  } as Partial<Request>;
}

describe("CsrfGuard", () => {
  const guard = new CsrfGuard(SECRET);

  it("정상: csrf_id + 일치 X-Csrf-Token → true", () => {
    const csrfId = "client-binding-id";
    const token = issueCsrfToken(SECRET, csrfId);
    expect(guard.canActivate(ctx(reqWith(csrfId, token)))).toBe(true);
  });

  it("헤더 누락 → 403", () => {
    const csrfId = "client-binding-id";
    expect(() => guard.canActivate(ctx(reqWith(csrfId, undefined)))).toThrow(ForbiddenException);
  });

  it("헤더 위조 → 403", () => {
    const csrfId = "client-binding-id";
    expect(() => guard.canActivate(ctx(reqWith(csrfId, "forged-token")))).toThrow(
      ForbiddenException,
    );
  });

  it("csrf_id 쿠키 부재 → 403", () => {
    const token = issueCsrfToken(SECRET, "client-binding-id");
    expect(() => guard.canActivate(ctx(reqWith(undefined, token)))).toThrow(ForbiddenException);
  });
});
