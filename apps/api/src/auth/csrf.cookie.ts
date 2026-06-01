/**
 * CSRF double-submit 쿠키 헬퍼.
 *
 * 바인딩 모델: per-client 랜덤 `csrf_id`(httpOnly) 에 토큰을 묶는다(session 아님).
 * 미인증 endpoint 도 session 없이 보호하기 위함 (spec-15-02, ADR 후보 csrf-binding-strategy).
 * - `csrf_id`    : 랜덤 binding id (httpOnly — JS 접근 차단)
 * - `csrf_token` : `issueCsrfToken(secret, csrf_id)` (비-httpOnly — 클라가 읽어 X-Csrf-Token 헤더로 echo)
 * 서버는 csrf_token 쿠키를 신뢰하지 않고 csrf_id 로 재계산해 검증한다(signed double-submit).
 */

import { randomBytes } from "node:crypto";
import { issueCsrfToken } from "@repo/backend-auth-rate-limit";
import type { Request, Response } from "express";

export const CSRF_ID_COOKIE = "csrf_id";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const cookieBase = {
  secure: process.env.NODE_ENV !== "development",
  sameSite: "lax" as const,
  path: "/",
};

export interface CsrfIssue {
  csrfId: string;
  csrfToken: string;
}

/** 새 csrf_id(랜덤) + csrf_token 쿠키를 발급(또는 rotate)하고 body 동봉용 토큰을 반환. */
export function setCsrfCookies(res: Response, secret: string): CsrfIssue {
  const csrfId = randomBytes(32).toString("base64url");
  const csrfToken = issueCsrfToken(secret, csrfId);
  res.cookie(CSRF_ID_COOKIE, csrfId, { ...cookieBase, httpOnly: true });
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, { ...cookieBase, httpOnly: false });
  return { csrfId, csrfToken };
}

/** 요청의 csrf_id 쿠키(cookie-parser 로 채워짐) 읽기. */
export function readCsrfId(req: Request): string | undefined {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.[CSRF_ID_COOKIE];
}
