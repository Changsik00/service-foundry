import type { CryptoKey } from "jose";

/**
 * JWT 알고리즘 — ADR-0013 Decision 2 (EdDSA Ed25519).
 *
 * 향후 ES256 / RS256 등 확장 여지를 위해 별 타입으로 둠. 현 spec 은 EdDSA 단일.
 */
export type Alg = "EdDSA";

/**
 * signing 시 사용되는 *private + public* 쌍 (kid + alg 포함).
 *
 * `CryptoKey` 는 Web Crypto API 타입 — Node + Edge 둘 다 호환 (jose v6 표준).
 */
export interface KeyMaterial {
  readonly kid: string;
  readonly alg: Alg;
  readonly privateKey: CryptoKey;
  readonly publicKey: CryptoKey;
}

/** verification / JWKS 출력 시 사용되는 *public 만* (private 격리). */
export interface PublicKeyMaterial {
  readonly kid: string;
  readonly alg: Alg;
  readonly publicKey: CryptoKey;
}

/**
 * Repository 패턴 (Persistence Ignorance) — `auth-session` 의 `SessionStore` 답습.
 *
 * 도메인 함수 (`signAccessToken` / `verifyAccessToken` / `toJwks`) 는 본 interface 만 의존.
 * 본 spec 의 in-memory 구현 외, phase-10 에서 file / KMS / Redis 등 *같은 interface 구현* 으로 swap.
 *
 * - `getActiveSigningKey`: 현 발급용 키 (`signAccessToken` 사용)
 * - `getVerificationKey`: kid 로 검증 키 lookup (`verifyAccessToken` 사용). 활성 / verify-only 모두 포함.
 * - `listActivePublicKeys`: JWKS endpoint 노출용 (`toJwks` 사용). private key 미노출.
 */
export interface KeyStore {
  getActiveSigningKey(): Promise<KeyMaterial>;
  getVerificationKey(kid: string): Promise<PublicKeyMaterial | null>;
  listActivePublicKeys(): Promise<PublicKeyMaterial[]>;
}

/**
 * Access token 의 표준 claims — ADR-0013 Decision 3.
 *
 * - 필수: sub / iat / exp / iss / aud
 * - 권장: jti (revocation 용 deny list 키)
 * - 금지: PII (이름/주소/전화). roles/perm 등은 별 spec.
 */
export interface JwtClaims {
  readonly sub: string;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
  readonly jti: string;
  /**
   * 검증된 커스텀 claim (role 등). 서명·iss·aud·exp 검증을 통과한 payload 에서만 보존된다.
   * 호출자는 이 값을 *검증된 소스* 로 신뢰할 수 있다 (decodeJwt 등 미검증 우회 금지).
   */
  readonly [key: string]: unknown;
}
