import { verifyCsrfToken } from "@repo/backend-auth-rate-limit";
import type { Request, Response } from "express";
import { describe, expect, it } from "vitest";
import { CSRF_ID_COOKIE, CSRF_TOKEN_COOKIE, readCsrfId, setCsrfCookies } from "./csrf.cookie.js";

interface CapturedCookie {
  value: string;
  opts: Record<string, unknown>;
}

function fakeRes() {
  const cookies: Record<string, CapturedCookie> = {};
  const res = {
    cookie(name: string, value: string, opts: Record<string, unknown>) {
      cookies[name] = { value, opts };
    },
  } as unknown as Response;
  return { res, cookies };
}

const SECRET = "test-csrf-secret";

describe("csrf.cookie", () => {
  it("setCsrfCookies: csrf_id(httpOnly) + csrf_token(readable) 발급, 반환 토큰이 쿠키와 일치", () => {
    const { res, cookies } = fakeRes();
    const { csrfId, csrfToken } = setCsrfCookies(res, SECRET);

    expect(cookies[CSRF_ID_COOKIE]?.opts.httpOnly).toBe(true);
    expect(cookies[CSRF_TOKEN_COOKIE]?.opts.httpOnly).toBe(false);
    expect(cookies[CSRF_ID_COOKIE]?.value).toBe(csrfId);
    expect(cookies[CSRF_TOKEN_COOKIE]?.value).toBe(csrfToken);
  });

  it("발급된 토큰은 csrf_id 기준으로 verify 통과, 위조는 실패", () => {
    const { res } = fakeRes();
    const { csrfId, csrfToken } = setCsrfCookies(res, SECRET);

    expect(verifyCsrfToken(SECRET, csrfId, csrfToken)).toBe(true);
    expect(verifyCsrfToken(SECRET, csrfId, "forged")).toBe(false);
  });

  it("rotate: 매 호출마다 다른 csrf_id 발급", () => {
    const a = setCsrfCookies(fakeRes().res, SECRET);
    const b = setCsrfCookies(fakeRes().res, SECRET);
    expect(a.csrfId).not.toBe(b.csrfId);
  });

  it("readCsrfId: csrf_id 쿠키 읽기 / 부재 시 undefined", () => {
    expect(readCsrfId({ cookies: { [CSRF_ID_COOKIE]: "abc" } } as unknown as Request)).toBe("abc");
    expect(readCsrfId({ cookies: {} } as unknown as Request)).toBeUndefined();
    expect(readCsrfId({} as unknown as Request)).toBeUndefined();
  });
});
