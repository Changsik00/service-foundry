# feat(spec-05-03): @repo/backend-auth-jwt — EdDSA JWT + JWKS

## 📋 Summary

### 배경 및 목적

phase-05 의 *backend-only* auth 모듈 중 *access token* 영역 박음. `auth-session` (spec-05-02) 의 opaque refresh token 과 짝을 이루는 *stateless JWT* 발급/검증 + JWKS endpoint helper. ADR-0013 Decision 1/2/3/7 구현.

### 주요 변경 사항

- [x] `@repo/backend-auth-jwt` 패키지 신규 (`packages/backend/auth-jwt`)
- [x] `KeyStore` interface (Repository 패턴, `auth-session` 답습)
- [x] `createInMemoryKeyStore` — Ed25519 keypair + UUID kid 자동 발급
- [x] `signAccessToken` — jose v6 + EdDSA + 15분 TTL 기본 + kid header
- [x] `verifyAccessToken` — `Result<JwtClaims, AppError>` 반환 + jose 에러 매핑 (TOKEN_EXPIRED / TOKEN_INVALID / TOKEN_KEY_NOT_FOUND / TOKEN_CLAIM_MISMATCH)
- [x] `toJwks` — RFC 7517 JWKS payload (kty=OKP/crv=Ed25519/alg=EdDSA/kid/use=sig)
- [x] jose `^6.2.0` 카탈로그 등록 (`pnpm-workspace.yaml`)
- [x] 단위 테스트 25/25 PASS (5 files)

### Phase 컨텍스트

- **Phase**: `phase-05` (Auth Core + Security)
- **본 SPEC 의 역할**: ADR-0013 Decision 1/2/3/7 (Access JWT + Algorithm + Claims + Key Rotation interface) 구현. Decision 4/5/6/8 은 spec-05-02 (`auth-session`) 가 처리. 본 spec 후 `auth-session` + `auth-jwt` 가 signin/refresh flow 의 양 축으로 완성.

## 🎯 Key Review Points

1. **jose v6 채택 + `CryptoKey` 타입 출처** (walkthrough §3-2): plan 에 ^5.10 으로 적었지만 실 latest 가 ^6.2. v6 는 Web Crypto API 표준화로 Edge runtime 호환 더 자연. `import type { CryptoKey } from "jose"` 박음 — `lib.dom` 변경 회피.
2. **`KeyStore` interface + fake / in-memory 분리** (walkthrough §3-1): 도메인 함수는 *interface 만 의존*. `createInMemoryKeyStore` 는 *프로덕션 가능* (단일 인스턴스), `createFakeKeyStore` 는 *test 친화*. phase-10 의 file/KMS keystore 도 *같은 interface 구현* 으로 swap.
3. **`verifyAccessToken` 만 Result 반환** (walkthrough §3-3): ADR-0008 의 *선별 적용*. verify 실패는 예상 사용자 흐름, sign 실패는 프로그래밍 오류.
4. **kid lookup 실패 처리 — Symbol marker** (walkthrough §3-5): jose 의 getKey 콜백 throw 동작이 버전 따라 wrap 될 수 있어서 marker 기반 우회. 안정성.
5. **AppError 매핑** (walkthrough §3-4): `@repo/errors` open registry 사용 — `JwtErrorCode` 카탈로그 const + `new AppError({code, statusCode: 401, ...})` 직접 발급. ADR-0012 flat code 일관.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter @repo/backend-auth-jwt test
```

**결과 요약**:
- ✅ `keystore.test.ts` (5 tests) — KeyStore contract
- ✅ `memory-store.test.ts` (5 tests) — in-memory keystore
- ✅ `sign.test.ts` (5 tests) — signAccessToken
- ✅ `verify.test.ts` (7 tests) — verifyAccessToken Result 분기
- ✅ `jwks.test.ts` (3 tests) — JWKS shape

**총 25/25 PASS** (1.7s).

### 정적 분석

```bash
pnpm --filter @repo/backend-auth-jwt lint     # biome — 15 files clean
pnpm typecheck                                  # turbo — 28 packages PASS
npx depcruise --config packages/config/depcruise-config/base.cjs packages apps
# ✔ no dependency violations found (156 modules, 241 dependencies cruised)
```

### 통합 테스트

본 spec 은 Integration Test Required = **no** (pure crypto + JWKS 형식 — 실 DB 불요). phase 통합 시나리오는 `phase-ship` 시점.

### 수동 검증 시나리오

1. **Round-trip**: sign → verify → ok(claims) — sub/iss/aud/jti 보존 + iat/exp 자동 부여.
2. **Expired**: `expiresIn: "1s"` 후 1.5s 대기 → verify → err(TOKEN_EXPIRED).
3. **Signature tamper**: 토큰 signature 부분 변조 → err(TOKEN_INVALID).
4. **kid mismatch**: signer / verifier 가 다른 keystore → err(TOKEN_KEY_NOT_FOUND).
5. **JWKS shape**: kty=OKP / crv=Ed25519 / alg=EdDSA / kid / use=sig 확인 + private (`d`) 필드 부재.

## 📦 Files Changed

### 🆕 New Files
- `packages/backend/auth-jwt/package.json`: 신규 패키지 메타
- `packages/backend/auth-jwt/tsconfig.json`: `@repo/typescript-config/base` extends
- `packages/backend/auth-jwt/vitest.config.ts`: `@repo/vitest-config/node` re-export
- `packages/backend/auth-jwt/README.md`: 사용 예제 + 설계 결정 + Key Rotation 정공법 (미래 검토)
- `packages/backend/auth-jwt/src/index.ts`: barrel re-export
- `packages/backend/auth-jwt/src/keystore.ts`: `KeyStore` interface + `KeyMaterial` / `PublicKeyMaterial` / `JwtClaims` types
- `packages/backend/auth-jwt/src/fake-store.ts`: `createFakeKeyStore` (Map 기반, test 친화)
- `packages/backend/auth-jwt/src/memory-store.ts`: `createInMemoryKeyStore` (jose.generateKeyPair + UUID kid)
- `packages/backend/auth-jwt/src/sign.ts`: `signAccessToken` (jose.SignJWT + EdDSA + kid header)
- `packages/backend/auth-jwt/src/verify.ts`: `verifyAccessToken` + `JwtErrorCode` 카탈로그
- `packages/backend/auth-jwt/src/jwks.ts`: `toJwks` (jose.exportJWK + private 차단)
- `packages/backend/auth-jwt/src/*.test.ts`: 5 test files, 25 cases
- `specs/spec-05-03-auth-jwt/{spec,plan,task,walkthrough}.md`: SDD 산출물

### 🛠 Modified Files
- `pnpm-workspace.yaml` (+1): `jose: ^6.2.0` catalog 추가
- `pnpm-lock.yaml` (+42): jose 의존성 추가
- `backlog/phase-05.md` (+1): sdd marker 의 spec 표 갱신 (spec-05-03 추가)
- `backlog/queue.md` (+1, -1): active spec 갱신

**Total**: 23 files changed (+1465 / -1)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (25/25)
- [x] Integration Test Required = no — 해당 없음
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / typecheck / depcruise 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- **Phase**: `backlog/phase-05.md`
- **Walkthrough**: `specs/spec-05-03-auth-jwt/walkthrough.md`
- **관련 ADR**: 
  - `docs/adr/0013-session-lifecycle.md` (Decision 1/2/3/7 구현)
  - `docs/adr/0012-auth-error-normalize.md` (`@repo/errors` 사용 패턴)
  - `docs/adr/0008-result-type.md` (`Result` 사용 정책)
- **선행 spec**: spec-05-02 (`@repo/backend-auth-session`)
- **후속 spec**: spec-05-04 (auth-security) / spec-05-05 (password-reset, JWKS endpoint mount 시점)
- **PR target**: `phase-05-auth-core-security`
