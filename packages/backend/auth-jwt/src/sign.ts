import type { JwtClaims, KeyStore } from "./keystore.js";

/**
 * `signAccessToken` 호출자 입력.
 *
 * - `sub` 필수 (token 의 subject — 보통 userId).
 * - 추가 custom claim 은 본 spec scope 밖 — RBAC 등은 별 spec. PII 금지 (ADR-0013 Decision 3).
 */
export interface SignAccessTokenPayload {
  readonly sub: string;
}

export interface SignAccessTokenOptions {
  /** `iss` claim — 본 토큰 발행 주체. ADR-0013 Decision 3 필수. */
  readonly issuer: string;
  /** `aud` claim — 본 토큰 사용 대상. ADR-0013 Decision 3 필수. */
  readonly audience: string;
  /** TTL. 기본 `"15m"` (ADR-0013 Decision 1 상한). jose `setExpirationTime` 호환 형식. */
  readonly expiresIn?: string | number;
  /** `jti` claim — 생략 시 `crypto.randomUUID()` 자동 발급. */
  readonly jti?: string;
}

/**
 * `signAccessToken(payload, store, opts)` — EdDSA Ed25519 서명, 15분 TTL 기본.
 *
 * 호출자는 `payload.sub` + `opts.issuer`/`opts.audience` 만 필수로 채워주면 됨.
 * `iat`/`exp`/`jti` 는 본 함수가 자동 부여. JWT header 의 `kid` 는 store 의 활성 키에서 채움.
 */
export const signAccessToken = async (
  _payload: SignAccessTokenPayload,
  _store: KeyStore,
  _opts: SignAccessTokenOptions,
): Promise<string> => {
  // Red 단계 stub — Green commit 에서 jose.SignJWT 박음.
  throw new Error("not implemented");
};

/** 디코딩 후 검증된 claims (verify 단계 결과와 같은 shape). */
export type SignedClaims = JwtClaims;
