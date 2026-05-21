import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LENGTH = 32;

/**
 * CSRF token — HMAC-SHA256(secret, sessionId) → base64url 32 byte truncate.
 *
 * - deterministic: 같은 sessionId + secret → 같은 token (double-submit 패턴 친화)
 * - timing-safe verify (Node `timingSafeEqual`)
 * - session 동반 — session revoke = CSRF 자동 invalidate (별 저장소 불요)
 *
 * 사용 패턴 (double-submit cookie):
 * - 서버: signin 성공 시 `issueCsrfToken(secret, sessionId)` 박은 후 *cookie + 응답 body* 둘 다 박음
 * - 클라: 상태 변경 요청 시 *cookie 값* 을 `X-Csrf-Token` header 에도 박음
 * - 서버: 요청 받으면 `verifyCsrfToken(secret, sessionId, presented)` 박음
 */
export const issueCsrfToken = (secret: string, sessionId: string): string => {
  if (secret.length === 0) {
    throw new Error("issueCsrfToken: secret must be non-empty");
  }
  if (sessionId.length === 0) {
    throw new Error("issueCsrfToken: sessionId must be non-empty");
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
