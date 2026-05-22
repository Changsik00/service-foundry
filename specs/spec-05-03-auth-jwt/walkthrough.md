# Walkthrough: spec-05-03 auth-jwt

## 1. 본 spec 의 목표

`@repo/backend-auth-jwt` — *framework-agnostic* access token 발급/검증 + JWKS endpoint helper.

- EdDSA (Ed25519) JWT 발급 (`signAccessToken`)
- jose 기반 stateless 검증 (`verifyAccessToken` → `Result<Claims, AppError>`)
- RFC 7517 JWKS payload 생성 (`toJwks`)
- `KeyStore` interface (Repository 패턴) + in-memory 프로덕션 구현 (`createInMemoryKeyStore`)
- ADR-0013 Decision 1/2/3/7 구현 — Decision 4/5/6/8 은 `auth-session` (spec-05-02) 영역

## 2. 코드 투어 (호출자 관점)

### 2-1. signin flow (auth-session 과 합성)

```ts
import { createSession } from "@repo/backend-auth-session";
import { createInMemoryKeyStore, signAccessToken } from "@repo/backend-auth-jwt";

const keystore = await createInMemoryKeyStore();  // 부트 1회
const sessionStore = drizzleSessionStore(db);

// signin endpoint:
const { session, refreshToken } = await createSession(sessionStore, { userId });
const access = await signAccessToken(
  { sub: userId },
  keystore,
  { issuer: "https://auth.example.com", audience: "service-foundry.api" },
);
// → client: { access, refresh } 발급
```

### 2-2. verify flow (Result 매칭)

```ts
import { verifyAccessToken, JwtErrorCode } from "@repo/backend-auth-jwt";
import { isOk } from "@repo/utils";
import { match } from "ts-pattern";

const result = await verifyAccessToken(token, keystore, {
  issuer: ISS,
  audience: AUD,
});
if (isOk(result)) {
  // result.value: { sub, iss, aud, jti, iat, exp }
} else {
  match(result.error.code)
    .with(JwtErrorCode.TOKEN_EXPIRED, () => /* 401, refresh 유도 */)
    .with(JwtErrorCode.TOKEN_INVALID, () => /* 401, 재인증 */)
    .with(JwtErrorCode.TOKEN_KEY_NOT_FOUND, () => /* JWKS rotation 직후 가능 */)
    .with(JwtErrorCode.TOKEN_CLAIM_MISMATCH, () => /* iss/aud 불일치 */)
    .otherwise(() => /* fallback */);
}
```

### 2-3. JWKS endpoint payload

```ts
import { toJwks } from "@repo/backend-auth-jwt";

// apps/api 의 GET /.well-known/jwks.json 핸들러:
const jwks = await toJwks(keystore);
return jwks; // { keys: [{ kty:"OKP", crv:"Ed25519", alg:"EdDSA", kid, use:"sig", x }, ...] }
```

## 3. 핵심 설계 결정

### 3-1. `KeyStore` interface — `auth-session` 의 `SessionStore` 답습

도메인 함수 (`signAccessToken` / `verifyAccessToken` / `toJwks`) 는 *interface 만 의존*. 본 spec 의 `createInMemoryKeyStore` 외, phase-10 의 file / KMS / Redis keystore 도 *같은 interface 구현* 으로 swap. 단위 테스트는 `createFakeKeyStore` (Map 기반, crypto 생성 비용 0) 박음.

### 3-2. jose v6 채택 — Web Crypto API + `CryptoKey`

ADR-0013 Decision 1 의 jose 라이브러리. plan 작성 시점에 ^5.10 으로 적었지만 실 latest 는 **^6.2.0**. v6 는 *Web Crypto API* (`CryptoKey`) 표준화 — Node + Edge runtime 둘 다 호환. `KeyObject` (Node-only) 대신 `import type { CryptoKey } from "jose"` 사용 — Edge 환경 (Cloudflare Workers / Vercel Edge) 에서도 그대로 동작.

### 3-3. `verifyAccessToken` 만 Result 반환 — `signAccessToken` 은 throw

ADR-0008 Result 원칙의 *선별 적용*:
- `verifyAccessToken` 의 실패 분기 (expired / invalid / key not found / claim mismatch) 는 *모두 예상 가능한 사용자 흐름* → `Result<JwtClaims, AppError>` 반환.
- `signAccessToken` 의 실패 (빈 sub) 는 *프로그래밍 오류* → throw.

### 3-4. AppError code 카탈로그 (`JwtErrorCode`) — ADR-0012 답습

`@repo/errors` 는 *open registry* — enum 확장 불요. 본 spec 에서 `JwtErrorCode` 카탈로그 박고 `new AppError({code, statusCode: 401, ...})` 직접 발급. flat code 일관성 유지.

| code | jose error 매핑 |
|---|---|
| `TOKEN_EXPIRED` | `joseErrors.JWTExpired` |
| `TOKEN_CLAIM_MISMATCH` | `joseErrors.JWTClaimValidationFailed` (iss/aud) |
| `TOKEN_KEY_NOT_FOUND` | getKey 콜백 내부 marker (jose 에러 외) |
| `TOKEN_INVALID` | `JWSSignatureVerificationFailed` / `JWSInvalid` / `JWTInvalid` / 기타 |

### 3-5. kid lookup 실패 처리 — Symbol marker 패턴

jose 의 `jwtVerify(token, getKey, opts)` 에서 `getKey` 콜백이 throw 하면 jose 가 *internal error* 로 wrap 하는 경우가 있음. 본 spec 은 `Symbol("auth-jwt:key-not-found")` marker 를 thrown error 에 부착 → 외부 `catch` 에서 marker 검사 → `TOKEN_KEY_NOT_FOUND` 매핑. jose 의 wrap 동작이 v6 에서 바뀌어도 marker 기반이라 안정.

### 3-6. JWKS — private (`d`) 필드 noop guard

`jose.exportJWK(publicKey)` 는 *public CryptoKey* 입력 시 `d` 미포함이 정상. 만약 future jose 버전이 동작을 바꾸거나 private key 가 *실수로* 들어오면 `d` 노출 가능 — 본 spec 의 `toJwks` 는 *항상* `d` 필드 삭제하는 noop guard 박음. 테스트로 보장.

### 3-7. TDD 패턴 — `auth-session` 답습 (interface + stub 박은 Red commit)

매 task 가 Red commit (interface + stub throw) + Green commit (실 구현). pre-commit hook 의 `typecheck` 가 모듈 미존재를 막으므로, *interface 와 stub 함수는 Red commit 에 포함*. Test 가 stub throw 로 fail = Red 명확.

## 4. 검증 결과

### 4-1. 단위 테스트

```bash
pnpm --filter @repo/backend-auth-jwt test
```

- ✅ `src/keystore.test.ts` (5 tests) — contract: active signing / null on unknown / multi-key list / private 미노출
- ✅ `src/memory-store.test.ts` (5 tests) — Ed25519 keypair / UUID kid / verify-only 멀티
- ✅ `src/sign.test.ts` (5 tests) — EdDSA header + kid / claims / expiresIn / explicit jti / 빈 sub 거부
- ✅ `src/verify.test.ts` (7 tests) — round-trip / expired / signature tamper / malformed / iss mismatch / aud mismatch / kid not found
- ✅ `src/jwks.test.ts` (3 tests) — JWKS shape / private 차단 / multi-kid

**총 25/25 PASS** (실행시간 1.7s).

### 4-2. 정적 분석

```bash
pnpm --filter @repo/backend-auth-jwt lint     # biome — 15 files clean
pnpm --filter @repo/backend-auth-jwt typecheck # tsc --noEmit — pass
pnpm typecheck                                  # root turbo — 28 packages 모두 PASS
```

### 4-3. depcruise

```bash
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (156 modules, 241 dependencies cruised)
```

`packages-no-app-imports` / `no-circular` / framework adapter 규칙 (ADR-0015) 모두 그린.

## 5. 본 spec 의 *scope 밖*

- **NestJS adapter** (Guard / Module / `JwtAuthGuard`) → phase-06 `@repo/nestjs-auth-jwt`
- **JWKS endpoint 라우트 mount** (apps/api `/.well-known/jwks.json`) → endpoint 진입 spec (spec-05-05 password-reset 또는 별 spec)
- **File / KMS / Redis keystore** → phase-10 ops tooling
- **자동 90일 rotation cron** → phase-10
- **jti deny list** (즉시 revocation) → phase-10 (ADR-0013 Decision 7 Option B)
- **`roles` / `permissions` claims** → RBAC 별 spec
- **Refresh token 흐름** → `@repo/backend-auth-session` (spec-05-02 완료)

## 6. 결정 기록 (Decision Log)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| jose 버전 | ^5.10.0 (plan 작성 시점) / ^6.2.0 (실 latest) | **^6.2.0** | npm latest. v6 는 Web Crypto API 표준화 — Edge runtime 호환 더 자연 (ADR-0013 NFR-2). |
| `CryptoKey` 타입 출처 | `node:crypto` 의 `webcrypto.CryptoKey` / `lib.dom` 추가 / `jose` re-export | **`jose` re-export** | jose 가 자체 type alias 노출. lib 변경 없이 사용 가능. Edge 호환. |
| sign/verify 반환 형식 | 둘 다 Result / 둘 다 throw / 분리 | **분리 (verify만 Result)** | verify 실패 분기는 *예상 사용자 흐름*, sign 실패는 *프로그래밍 오류*. ADR-0008 정신 부합. |
| kid lookup 실패 매핑 | jose error wrap 의존 / try-catch in getKey + Symbol marker | **Symbol marker** | jose 의 wrap 동작이 버전 따라 바뀔 수 있음. marker 기반이 안정. |
| AuthErrorCode 별 enum vs `@repo/errors` 직접 | 별 enum / open registry 사용 | **open registry** | `@repo/errors` (ADR-0012) 가 이미 open registry. enum 추가는 ceremony — 카탈로그 const + `new AppError` 직접 발급 충분. |
| JWKS endpoint mount 시점 | 본 spec 에서 mount / 별 spec | **별 spec** | apps/api 의 endpoint 영역은 spec-05-05 (password-reset) 의 endpoint 진입과 묶는 게 자연. 본 spec 은 helper 만. |

## 7. 사용자 협의

- **주제**: 다음 spec 선정 (spec-05-02 머지 후)
  - **사용자 의견**: "순서대로 진행해" — phase.md 본문의 spec-05-03 (auth-jwt) 채택.
  - **합의**: SDD-P 모드, phase base branch (`phase-05-auth-core-security`) 위에 `spec-05-03-auth-jwt` 브랜치.

- **주제**: harness-kit 업데이트 잔재 (0.10.0 → 0.13.1) 처리
  - **사용자 의견**: "phase-05 base 에 chore commit 박고 push" — 분리.
  - **합의**: phase-05 base 위에 `chore: harness-kit 0.10.0 -> 0.13.1 업데이트` commit + push 후 spec-05-03 rebase. 메모리의 `feedback_phase_chore_branch.md` 패턴 답습.

- **주제**: jose 버전 (plan ^5.10 → 실 latest ^6.2)
  - **사용자 의견**: (사전 통보만, 별 이견 없음)
  - **합의**: ^6.2.0 채택. 변경 사유 walkthrough §3-2 에 기록.

## 8. 발견 사항

- **jose v6 의 `CryptoKey` 타입 출처가 변경됨** — v5 는 `KeyObject | CryptoKey` union, v6 는 *CryptoKey 단일*. Edge 호환 정책. 향후 `@repo/backend-*` 의 crypto 영역 다른 패키지도 같은 방향성 (Edge first).
- **jose 의 `jwtVerify` `getKey` 콜백 throw 동작** — JOSEError 류는 정상 전파되나, plain Error 는 wrap 될 수 있음. 본 spec 은 Symbol marker 로 우회. 다른 패키지에서 jose 의 getKey 활용 시 같은 패턴 권장.
- **biome 의 export 자동 정렬** — index.ts 의 `export` 절을 *알파벳* 정렬로 자동 변경. 코드 의도는 보존되지만 commit diff 가 살짝 노이즈. 향후 README 등 *순서가 의미 있는* 영역은 신경 써야 할 수도.

## 9. 이월 항목

- 없음 — README §"Key Rotation 정공법 (미래 검토)" 표가 후속 spec/phase 의 *기억 위치* (`auth-session` 의 *Rotation 정공법 (미래 검토)* 패턴 답습).

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-20 ~ 2026-05-21 |
| **총 commit** | 13 (scaffold 1 + planning docs 1 + TDD red/green 5×2 + README 1, 검증 task 는 commit 0) |
| **테스트** | 25/25 PASS / lint clean / depcruise 0 violations |
| **PR target** | `phase-05-auth-core-security` |
