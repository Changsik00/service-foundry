import { createHmac, timingSafeEqual } from "node:crypto";

import { AppError } from "@repo/errors";

const TOKEN_LENGTH = 32;

/**
 * CSRF token — HMAC-SHA256(secret, id) → base64url 32 byte truncate.
 *
 * **바인딩 = per-client `csrf_id` (session 비의존, ADR-0021).** 아래 `sessionId` 파라미터는
 * 실제로는 `csrf_id` 쿠키 값이다 (이름은 역사적 잔재). session 에 묶지 않으므로 미인증
 * endpoint(password-reset, mfa verify 등)도 동일 메커니즘으로 보호된다. trade-off: session
 * revoke 가 CSRF 토큰을 자동 무효화하지는 않는다 (double-submit 은 cookie↔header 일치로 성립).
 *
 * - deterministic: 같은 id + secret → 같은 token (double-submit 패턴 친화)
 * - timing-safe verify (Node `timingSafeEqual`)
 *
 * 사용 패턴 (double-submit cookie):
 * - 서버: `GET /auth/csrf`(또는 signin rotate) 시 `issueCsrfToken(secret, csrfId)` → *csrf_id 쿠키 + 응답 body* 둘 다 박음
 * - 클라: 상태 변경 요청 시 토큰을 `X-Csrf-Token` header 에 동반 (csrf_id 쿠키는 자동 전송)
 * - 서버: `verifyCsrfToken(secret, csrfId, presented)` 로 쿠키↔헤더 일치 검증
 */
export const issueCsrfToken = (secret: string, sessionId: string): string => {
  if (secret.length === 0) {
    throw new AppError({
      code: "INTERNAL",
      message: "issueCsrfToken: secret must be non-empty",
      statusCode: 500,
    });
  }
  if (sessionId.length === 0) {
    throw new AppError({
      code: "INTERNAL",
      message: "issueCsrfToken: sessionId must be non-empty",
      statusCode: 500,
    });
  }
  const mac = createHmac("sha256", secret).update(sessionId).digest();
  return mac.subarray(0, TOKEN_LENGTH).toString("base64url");
};

/**
 * `verifyCsrfToken(secret, sessionId, presented)` — timing-safe compare.
 *
 * 빈 input / 형식 깨짐 / mismatch 모두 false. *throw 안 함* (jwt verify 와 다른 정책 —
 * CSRF 의 실패 분기는 *모두 reject 자연*).
 */
export const verifyCsrfToken = (secret: string, sessionId: string, presented: string): boolean => {
  if (secret.length === 0 || sessionId.length === 0 || presented.length === 0) {
    return false;
  }
  let expected: Buffer;
  try {
    expected = Buffer.from(issueCsrfToken(secret, sessionId), "base64url");
  } catch {
    return false;
  }
  let actual: Buffer;
  try {
    actual = Buffer.from(presented, "base64url");
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
};
