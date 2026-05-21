# Task List: spec-05-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 자동 갱신)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + 패키지 scaffold

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-05-03-auth-jwt` (시작 지점: `phase-05-auth-core-security`)
- [x] Commit: 없음 (브랜치 생성만)

### 1-2. 패키지 디렉토리 + 메타 파일
- [x] `mkdir -p packages/backend/auth-jwt/src`
- [x] `packages/backend/auth-jwt/package.json` 작성 (plan §2.1)
- [x] `packages/backend/auth-jwt/tsconfig.json` 작성 (auth-session 답습)
- [x] `packages/backend/auth-jwt/vitest.config.ts` 작성 (auth-session 답습)
- [x] `packages/backend/auth-jwt/src/index.ts` placeholder (`export {}`)
- [x] `pnpm-workspace.yaml` 의 catalog 에 `jose: ^6.2.0` 추가 (실 latest 6.x — plan 의 5.x 정정)
- [x] `pnpm install` — workspace 등록 확인
- [x] `pnpm --filter @repo/backend-auth-jwt typecheck` 통과
- [x] Commit: `chore(spec-05-03): scaffold @repo/backend-auth-jwt 패키지`
- [x] (사전 분리) `chore: harness-kit 0.10.0 -> 0.13.1 업데이트` — phase-05 base 위 별 commit (drift 사전 정리)
- [x] (Planning 산출물) `docs(spec-05-03): spec/plan/task 작성 + phase.md 표 갱신`

---

## Task 2: `KeyStore` interface + `KeyMaterial` 타입 (TDD)

### 2-1. 테스트 작성 (Red)
- [x] `packages/backend/auth-jwt/src/keystore.test.ts` — fake keystore 박은 후 `getActiveSigningKey` / `getVerificationKey` / `listActivePublicKeys` 의 *contract* 검증 (5 케이스 — private 미노출 포함)
- [x] 테스트 실행 → Fail (5 fail — fake stub throw)
- [x] Commit: `test(spec-05-03): KeyStore contract 테스트 추가 — TDD Red (5 fail)`

### 2-2. 구현 (Green)
- [x] `packages/backend/auth-jwt/src/keystore.ts` — `KeyStore` interface + `KeyMaterial` / `PublicKeyMaterial` / `JwtClaims` type. `CryptoKey` 는 jose v6 의 `import type { CryptoKey } from "jose"` 사용 (Edge 호환)
- [x] `packages/backend/auth-jwt/src/fake-store.ts` — Map 기반 fake (`setActive` / `addVerifyOnly` + 3 method)
- [x] `src/index.ts` re-export
- [x] 테스트 PASS (5/5)
- [x] Commit: `feat(spec-05-03): KeyStore interface + fake-store — TDD Green (5 pass)`

---

## Task 3: `createInMemoryKeyStore` (TDD)

### 3-1. 테스트 작성 (Red)
- [x] `packages/backend/auth-jwt/src/memory-store.test.ts` — Ed25519 keypair 생성 / 명시 kid / 자동 UUID kid / addVerificationOnlyKey / unknown kid (5 케이스)
- [x] 테스트 실행 → Fail (5 fail)
- [x] Commit: `test(spec-05-03): in-memory keystore 테스트 추가 — TDD Red (5 fail)`

### 3-2. 구현 (Green)
- [x] `packages/backend/auth-jwt/src/memory-store.ts` — `createInMemoryKeyStore` (`jose.generateKeyPair("EdDSA", {crv:"Ed25519", extractable:true})` 사용)
- [x] `src/index.ts` re-export
- [x] 테스트 PASS (10/10 — Task 2 5 + Task 3 5)
- [x] Commit: `feat(spec-05-03): createInMemoryKeyStore 구현 — TDD Green (10 pass)`

---

## Task 4: `signAccessToken` (TDD)

### 4-1. 테스트 작성 (Red)
- [x] `packages/backend/auth-jwt/src/sign.test.ts` — EdDSA header + kid / claims (sub/iss/aud/iat/exp/jti) / 명시 expiresIn / 명시 jti / 빈 sub 거부 (5 케이스)
- [x] 테스트 실행 → Fail (5 fail)
- [x] Commit: `test(spec-05-03): signAccessToken 테스트 추가 — TDD Red (5 fail)`

### 4-2. 구현 (Green)
- [x] `packages/backend/auth-jwt/src/sign.ts` — `jose.SignJWT` + kid/typ header + setSubject/Issuer/Audience/Jti/IssuedAt/ExpirationTime chain
- [x] `src/index.ts` re-export
- [x] 테스트 PASS (15/15)
- [x] Commit: `feat(spec-05-03): signAccessToken — EdDSA + 15분 TTL 기본 (15 pass)`

---

## Task 5: `verifyAccessToken` (TDD)

### 5-1. 테스트 작성 (Red)
- [x] `packages/backend/auth-jwt/src/verify.test.ts` — round-trip / expired / signature tamper / malformed / iss mismatch / aud mismatch / kid not found (7 케이스). Result.err 분기 모두 검증.
- [x] 테스트 실행 → Fail (7 fail)
- [x] Commit: `test(spec-05-03): verifyAccessToken 테스트 추가 — TDD Red (7 fail)`

### 5-2. 구현 (Green)
- [x] `@repo/errors` 는 *open registry* — 별도 enum 추가 불요. 본 spec 에서 `JwtErrorCode` 카탈로그 박고 `new AppError({code, statusCode:401})` 발급
- [x] `packages/backend/auth-jwt/src/verify.ts` — `jose.jwtVerify` + `getKey` 콜백에서 store lookup + `joseErrors.*` 매핑 + `Result<JwtClaims, AppError>` 반환
- [x] `src/index.ts` re-export
- [x] 테스트 PASS (22/22)
- [x] Commit: `feat(spec-05-03): verifyAccessToken — Result 반환 + AppError 매핑 (22 pass)`

---

## Task 6: `toJwks` (TDD)

### 6-1. 테스트 작성 (Red)
- [x] `packages/backend/auth-jwt/src/jwks.test.ts` — JWKS shape (kty=OKP/crv=Ed25519/alg=EdDSA/kid/use=sig) / private key (`d`) 미노출 / 활성+verify-only 멀티 (3 케이스)
- [x] 테스트 실행 → Fail (3 fail)
- [x] Commit: `test(spec-05-03): toJwks 테스트 추가 — TDD Red (3 fail)`

### 6-2. 구현 (Green)
- [x] `packages/backend/auth-jwt/src/jwks.ts` — `jose.exportJWK` + kid/alg/use="sig" 부여 + 안전을 위해 `d` 필드 제거
- [x] `src/index.ts` re-export
- [x] 테스트 PASS (25/25)
- [x] Commit: `feat(spec-05-03): toJwks — RFC 7517 JWKS 출력 (25 pass)`

---

## Task 7: README 작성

### 7-1. 패키지 README
- [x] `packages/backend/auth-jwt/README.md` — auth-session 답습. 사용 예제 (signin / verify / JWKS) + 핵심 설계 결정 표 + Key Rotation 정공법 (미래 검토) + Out of scope
- [x] Commit: `docs(spec-05-03): auth-jwt README 작성`

---

## Task 8: 최종 검증

### 8-1. 품질 게이트
- [x] `pnpm --filter @repo/backend-auth-jwt lint` 통과 (15 files)
- [x] `pnpm --filter @repo/backend-auth-jwt typecheck` 통과
- [x] `pnpm --filter @repo/backend-auth-jwt test` 전체 PASS (25/25)
- [x] 루트 `pnpm typecheck` 통과 (28 packages)
- [x] depcruise 그린 (`npx depcruise --config packages/config/depcruise-config/base.cjs packages apps` — 156 modules / 241 deps / 0 violations)
- [x] Commit: 없음 (검증 task — 결과만 walkthrough 에 기록)

---

## Task N: Ship (필수)

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

- [x] 코드 품질 점검 (이미 Task 8 에서 수행) — 재확인만
- [x] **walkthrough.md 작성** (증거 로그 + 핵심 설계 결정 + 검증 결과)
- [x] **pr_description.md 작성** (템플릿 준수)
- [x] **Ship Commit**: `docs(spec-05-03): ship walkthrough and pr description`
- [x] **Push**: `git push -u origin spec-05-03-auth-jwt`
- [x] **PR 생성**: https://github.com/Changsik00/service-foundry/pull/35 (target: `phase-05-auth-core-security`)
- [x] **사용자 알림**: PR URL 보고 + 머지 대기

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 8 + Ship |
| **실 commit 수** | 13 (planning 1 + scaffold 1 + TDD red/green 5×2 + README 1) + ship 1 예정 |
| **테스트** | 25/25 PASS (5 files) |
| **품질 게이트** | lint ✓ / typecheck ✓ / depcruise ✓ |
| **현재 단계** | Ship — push 대기 |
| **마지막 업데이트** | 2026-05-21 10:25 |
