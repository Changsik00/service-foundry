import type { AppError } from "@repo/errors";
import type { Result } from "@repo/utils";

import type { JwtClaims, KeyStore } from "./keystore.js";

/**
 * AppError code 카탈로그 — ADR-0012 (flat code, open registry) 답습.
 *
 * verify 실패 분기를 *명시적 코드* 로 표현 — 호출자가 `error.code` switch / match 가능.
 */
export const JwtErrorCode = {
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  TOKEN_KEY_NOT_FOUND: "TOKEN_KEY_NOT_FOUND",
  TOKEN_CLAIM_MISMATCH: "TOKEN_CLAIM_MISMATCH",
} as const;

export type JwtErrorCode = (typeof JwtErrorCode)[keyof typeof JwtErrorCode];

export interface VerifyAccessTokenOptions {
  /** 기대 `iss`. 일치하지 않으면 `TOKEN_CLAIM_MISMATCH`. */
  readonly issuer: string;
  /** 기대 `aud`. 일치하지 않으면 `TOKEN_CLAIM_MISMATCH`. */
  readonly audience: string;
  /** 시계 오차 허용 (초). 기본 0. jose `clockTolerance` 전달. */
  readonly clockTolerance?: number | string;
}

/**
 * `verifyAccessToken(token, store, opts)` — 서명 + iss/aud/exp 검증 후 `Result<Claims, AppError>` 반환.
 *
 * - throw 안 함 (ADR-0008 Result 원칙). jose 의 `JOSEError` 류는 모두 `AppError` 로 매핑.
 * - kid lookup 실패 시 `TOKEN_KEY_NOT_FOUND`.
 * - 서명 위변조 / malformed token → `TOKEN_INVALID`.
 * - 만료 → `TOKEN_EXPIRED`.
 * - iss / aud 불일치 → `TOKEN_CLAIM_MISMATCH`.
 */
export const verifyAccessToken = async (
  _token: string,
  _store: KeyStore,
  _opts: VerifyAccessTokenOptions,
): Promise<Result<JwtClaims, AppError>> => {
  // Red 단계 stub — Green commit 에서 jose.jwtVerify 박음.
  throw new Error("not implemented");
};
