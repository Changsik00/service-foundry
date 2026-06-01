import { AppError } from "@repo/errors";
import { err, ok, type Result } from "@repo/utils";
import { type CryptoKey, type JWTPayload, errors as joseErrors, jwtVerify } from "jose";

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

const authError = (code: JwtErrorCode, message: string, cause?: unknown): AppError =>
  new AppError({
    code,
    message,
    statusCode: 401,
    ...(cause !== undefined ? { cause } : {}),
  });

const KEY_NOT_FOUND_MARKER = Symbol("auth-jwt:key-not-found");

const narrowClaims = (payload: JWTPayload): JwtClaims | null => {
  if (
    typeof payload.sub !== "string" ||
    typeof payload.iss !== "string" ||
    typeof payload.aud !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.iat !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }
  // 검증된 payload 의 커스텀 claim(role 등)을 보존 — 6개 필수는 narrow 한 타입으로 덮어쓴다.
  return {
    ...payload,
    sub: payload.sub,
    iss: payload.iss,
    aud: payload.aud,
    jti: payload.jti,
    iat: payload.iat,
    exp: payload.exp,
  };
};

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
  token: string,
  store: KeyStore,
  opts: VerifyAccessTokenOptions,
): Promise<Result<JwtClaims, AppError>> => {
  let keyNotFoundKid: string | null = null;

  const getKey = async (header: { kid?: string; alg?: string }): Promise<CryptoKey> => {
    if (!header.kid) {
      // kid 없는 토큰은 본 구현에서 verify 불가 — 위조/잘못된 발급자.
      throw new joseErrors.JWTInvalid("missing kid in protected header");
    }
    const found = await store.getVerificationKey(header.kid);
    if (!found) {
      keyNotFoundKid = header.kid;
      // jose 내부 흐름은 통상 JOSEError 만 처리 — marker 로 분기.
      const e = new Error("auth-jwt: key not found") as Error & {
        [KEY_NOT_FOUND_MARKER]: true;
      };
      e[KEY_NOT_FOUND_MARKER] = true;
      throw e;
    }
    return found.publicKey;
  };

  try {
    const verifyOpts: {
      issuer: string;
      audience: string;
      clockTolerance?: number | string;
    } = { issuer: opts.issuer, audience: opts.audience };
    if (opts.clockTolerance !== undefined) verifyOpts.clockTolerance = opts.clockTolerance;

    const { payload } = await jwtVerify(token, getKey, verifyOpts);
    const claims = narrowClaims(payload);
    if (!claims) {
      return err(authError(JwtErrorCode.TOKEN_INVALID, "token payload missing required claims"));
    }
    return ok(claims);
  } catch (e) {
    if (
      typeof e === "object" &&
      e !== null &&
      (e as Record<symbol, unknown>)[KEY_NOT_FOUND_MARKER] === true
    ) {
      return err(
        authError(
          JwtErrorCode.TOKEN_KEY_NOT_FOUND,
          `unknown signing key (kid=${keyNotFoundKid ?? "<missing>"})`,
        ),
      );
    }
    if (e instanceof joseErrors.JWTExpired) {
      return err(authError(JwtErrorCode.TOKEN_EXPIRED, "access token expired", e));
    }
    if (e instanceof joseErrors.JWTClaimValidationFailed) {
      return err(
        authError(JwtErrorCode.TOKEN_CLAIM_MISMATCH, `claim validation failed: ${e.claim}`, e),
      );
    }
    // JWSSignatureVerificationFailed / JWSInvalid / JWTInvalid / 기타 → INVALID
    if (e instanceof joseErrors.JOSEError) {
      return err(authError(JwtErrorCode.TOKEN_INVALID, e.message, e));
    }
    return err(authError(JwtErrorCode.TOKEN_INVALID, "token verification failed", e));
  }
};
