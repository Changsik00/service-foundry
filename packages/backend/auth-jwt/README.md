# @repo/backend-auth-jwt

Framework-agnostic JWT (EdDSA Ed25519) + JWKS — ADR-0013 Decision 1/2/3/7 구현.

`auth-session` 의 *opaque random refresh token* 과 짝을 이루는 *stateless access token* 발급/검증 모듈. domain 함수는 `KeyStore` interface 만 의존 — in-memory / file / KMS 어느 keystore 도 같은 interface 구현이면 동작.

## 부트 가이드 (수동 검증)

```bash
# typecheck + 단위 테스트
pnpm --filter @repo/backend-auth-jwt typecheck
pnpm --filter @repo/backend-auth-jwt test
```

본 패키지는 *pure crypto* — 실 DB / 외부 서비스 없이 단위 테스트만으로 검증 완료.

## API

```ts
import {
  createInMemoryKeyStore,
  signAccessToken,
  verifyAccessToken,
  toJwks,
  JwtErrorCode,
} from "@repo/backend-auth-jwt";
import { isOk } from "@repo/utils";
import { match } from "ts-pattern";

// 1. KeyStore 부트 (in-memory — 단일 인스턴스 한정)
const store = await createInMemoryKeyStore();

// 2. signin → access token 발급
const access = await signAccessToken(
  { sub: userId },
  store,
  { issuer: "https://auth.example.com", audience: "service-foundry.api" },
);
// → expires in 15m by default. `expiresIn: "5m"` 등으로 override.

// 3. verify → Result<JwtClaims, AppError>
const result = await verifyAccessToken(access, store, {
  issuer: "https://auth.example.com",
  audience: "service-foundry.api",
});
if (isOk(result)) {
  // result.value: { sub, iss, aud, jti, iat, exp }
} else {
  // result.error: AppError (code = JwtErrorCode.*, statusCode = 401)
  match(result.error.code)
    .with(JwtErrorCode.TOKEN_EXPIRED, () => /* 401 + refresh 유도 */)
    .with(JwtErrorCode.TOKEN_INVALID, () => /* 401 + 재인증 */)
    .with(JwtErrorCode.TOKEN_KEY_NOT_FOUND, () => /* JWKS rotation 직후 가능 — 재시도 */)
    .with(JwtErrorCode.TOKEN_CLAIM_MISMATCH, () => /* 잘못된 audience/issuer */)
    .otherwise(() => /* fallback */);
}

// 4. JWKS endpoint payload
const jwks = await toJwks(store);
// → { keys: [{ kty: "OKP", crv: "Ed25519", alg: "EdDSA", kid, use: "sig", x }, ...] }
// apps/api 의 GET /.well-known/jwks.json 라우트에서 그대로 반환 (mount 는 별 spec)
```

## 핵심 설계 결정

| 항목 | 채택 | 이유 |
|---|---|---|
| **알고리즘** | EdDSA (Ed25519) | ADR-0013 Decision 2 — 빠르고 키 짧고 안전. HS256/RS256 비채택. |
| **TTL 기본** | 15분 | ADR-0013 Decision 1 의 5~15분 중 상한. signin endpoint 진입 시점에 환경별 조정. |
| **Claims** | sub/iss/aud/iat/exp/jti | ADR-0013 Decision 3. PII 금지. RBAC roles 는 별 spec. |
| **JWKS 노출** | `kty=OKP` / `crv=Ed25519` / `alg=EdDSA` / `kid` / `use=sig` | RFC 7517 + RFC 8037. private (`d`) 노출 차단. |
| **Refresh token** | *본 패키지 scope 밖* | ADR-0013 Decision 4 — opaque random + DB hash (`@repo/backend-auth-session`). |
| **Result 반환** | `verifyAccessToken` 만 Result, `signAccessToken` 은 throw | ADR-0008 — verify 는 *예상 실패 분기* 가 많음, sign 은 *프로그래밍 오류* 만 throw. |
| **에러 매핑** | `@repo/errors` `AppError` (code + statusCode=401) | ADR-0012 — open registry, flat code 일관. |
| **KeyStore 패턴** | Repository (`auth-session` 의 `SessionStore` 답습) | 도메인 함수가 *키 보관 메커니즘* 모름. in-memory/file/KMS swap 자연. |

## Key Rotation 정공법 (미래 검토 — *지금은 minimal*)

본 spec 은 *KeyStore interface + in-memory 구현* 만 박았음. *full 정공법* (ADR-0013 Decision 7 의 90일 rotation) 은 후속.

### 본 spec 에 *박힘* (minimal)

| 항목 | 동작 |
|---|---|
| Active key 1개 + verify-only key N개 분리 | `getActiveSigningKey` / `getVerificationKey(kid)` / `addVerificationOnlyKey` |
| kid 자동 부여 (UUID) | `createInMemoryKeyStore()` |
| JWKS 출력 (multi-kid grace) | `toJwks()` 는 active + verify-only 모두 노출 |
| verify 단계 kid lookup → `TOKEN_KEY_NOT_FOUND` | unknown kid 검증 거부 |

### 본 spec 에 *없음* (미래 검토)

| 항목 | 의미 | 박는 시점 후보 |
|---|---|---|
| **자동 90일 rotation** | cron / scheduler 가 신규 키 생성 + 이전 키 verify-only 강등 | phase-10 ops tooling |
| **File / KMS keystore** | 다중 인스턴스 / 프로덕션 배포에서 *모두 같은 키* 공유 | phase-10 — `createFileKeyStore` / `createAwsKmsKeyStore` 추가 |
| **jti deny list** | 즉시 revocation (Redis 기반, ADR-0013 Decision 7 Option B) | phase-10 admin tool 시점 |
| **Remote JWKS 검증** | 다른 마이크로서비스가 본 서비스 JWKS endpoint 로 검증 | 외부 서비스 도입 시점 |
| **Audit log** | 발급 / verify 실패 모든 event 기록 | phase-10 observability |
| **GeoIP / device 매칭** | claims 외 risk signal 매칭 | ADR-0013 Session model 의 `geo` 컬럼은 *별 spec* 에서 활용 |

**현재 정책 요약**: minimal — in-memory single-instance keystore + KeyStore interface 만. 다중 인스턴스 / 프로덕션은 phase-10 의 file/KMS keystore 로 swap 필수.

## 본 패키지 scope 밖 (별 spec / phase)

- NestJS adapter (Guard / Module) → phase-06 (`@repo/nestjs-auth-jwt`)
- JWKS endpoint *라우트 mount* (apps/api `/.well-known/jwks.json`) → endpoint 진입 spec (spec-05-05 또는 별 spec)
- File / KMS / Redis keystore → phase-10
- 자동 키 rotation cron → phase-10
- jti deny list (즉시 revocation) → phase-10
- `roles` / `permissions` claims → RBAC 별 spec
- Refresh token → `@repo/backend-auth-session` (spec-05-02)
