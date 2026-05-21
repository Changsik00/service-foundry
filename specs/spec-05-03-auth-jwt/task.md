# Task List: spec-05-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + 패키지 scaffold

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-05-03-auth-jwt` (시작 지점: `phase-05-auth-core-security`)
- [ ] Commit: 없음 (브랜치 생성만)

### 1-2. 패키지 디렉토리 + 메타 파일
- [ ] `mkdir -p packages/backend/auth-jwt/src`
- [ ] `packages/backend/auth-jwt/package.json` 작성 (plan §2.1)
- [ ] `packages/backend/auth-jwt/tsconfig.json` 작성 (auth-session 답습)
- [ ] `packages/backend/auth-jwt/vitest.config.ts` 작성 (auth-session 답습)
- [ ] `packages/backend/auth-jwt/src/index.ts` placeholder (`export {}`)
- [ ] `pnpm-workspace.yaml` 의 catalog 에 `jose: ^5.10.0` 추가
- [ ] `pnpm install` — workspace 등록 확인
- [ ] `pnpm --filter @repo/backend-auth-jwt typecheck` 통과
- [ ] Commit: `chore(spec-05-03): scaffold @repo/backend-auth-jwt 패키지`

---

## Task 2: `KeyStore` interface + `KeyMaterial` 타입 (TDD)

### 2-1. 테스트 작성 (Red)
- [ ] `packages/backend/auth-jwt/src/keystore.test.ts` — fake keystore 박은 후 `getActiveSigningKey` / `getVerificationKey` / `listActivePublicKeys` 의 *contract* 검증 (3-4 케이스)
- [ ] 테스트 실행 → Fail (interface/모듈 미존재)
- [ ] Commit: `test(spec-05-03): KeyStore contract 테스트 추가`

### 2-2. 구현 (Green)
- [ ] `packages/backend/auth-jwt/src/keystore.ts` — `KeyStore` interface + `KeyMaterial` type + `JwtClaims` type
- [ ] `packages/backend/auth-jwt/src/fake-store.ts` (또는 test helper) — Map 기반 fake
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-03): KeyStore interface + KeyMaterial 타입`

---

## Task 3: `createInMemoryKeyStore` (TDD)

### 3-1. 테스트 작성 (Red)
- [ ] `packages/backend/auth-jwt/src/memory-store.test.ts` — Ed25519 keypair 생성 / kid 부여 / addVerificationOnlyKey 동작 (4 케이스)
- [ ] 테스트 실행 → Fail
- [ ] Commit: `test(spec-05-03): in-memory keystore 테스트 추가`

### 3-2. 구현 (Green)
- [ ] `packages/backend/auth-jwt/src/memory-store.ts` — `createInMemoryKeyStore` (`jose.generateKeyPair` 사용)
- [ ] `src/index.ts` 에서 re-export
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-03): createInMemoryKeyStore 구현`

---

## Task 4: `signAccessToken` (TDD)

### 4-1. 테스트 작성 (Red)
- [ ] `packages/backend/auth-jwt/src/sign.test.ts` — sub/iss/aud 누락 시 throw, exp/iat 자동 부여, jti 자동 UUID, EdDSA 헤더 확인 (5 케이스)
- [ ] 테스트 실행 → Fail
- [ ] Commit: `test(spec-05-03): signAccessToken 테스트 추가`

### 4-2. 구현 (Green)
- [ ] `packages/backend/auth-jwt/src/sign.ts` — `jose.SignJWT` 박음 + kid header
- [ ] `src/index.ts` 에서 re-export
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-03): signAccessToken — EdDSA + 15분 TTL 기본`

---

## Task 5: `verifyAccessToken` (TDD)

### 5-1. 테스트 작성 (Red)
- [ ] `packages/backend/auth-jwt/src/verify.test.ts` — round-trip / expired / signature tamper / iss mismatch / aud mismatch / kid mismatch / kid not found (7 케이스). Result.err 분기 모두 검증.
- [ ] 테스트 실행 → Fail
- [ ] Commit: `test(spec-05-03): verifyAccessToken 테스트 추가`

### 5-2. 구현 (Green)
- [ ] `@repo/errors` 의 AuthErrorCode 에 `TOKEN_EXPIRED` / `TOKEN_INVALID` / `TOKEN_KEY_NOT_FOUND` / `TOKEN_CLAIM_MISMATCH` 존재 여부 확인 — 없으면 추가 (ADR-0012)
- [ ] `packages/backend/auth-jwt/src/verify.ts` — `jose.jwtVerify` 박음 + jose 의 `JOSEError` 류를 AuthError 로 매핑 + `Result<Claims, AuthError>` 반환
- [ ] `src/index.ts` 에서 re-export
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-03): verifyAccessToken — Result 반환 + AuthError 매핑`

---

## Task 6: `toJwks` (TDD)

### 6-1. 테스트 작성 (Red)
- [ ] `packages/backend/auth-jwt/src/jwks.test.ts` — JWKS shape 검증 (kty=OKP/crv=Ed25519/alg=EdDSA/kid 존재), private key 노출 안 됨, 활성+verify-only 키 모두 포함 (3 케이스)
- [ ] 테스트 실행 → Fail
- [ ] Commit: `test(spec-05-03): toJwks 테스트 추가`

### 6-2. 구현 (Green)
- [ ] `packages/backend/auth-jwt/src/jwks.ts` — `jose.exportJWK` 박은 후 `kid` / `alg` 부여
- [ ] `src/index.ts` 에서 re-export
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-03): toJwks — RFC 7517 JWKS 출력`

---

## Task 7: README 작성

### 7-1. 패키지 README
- [ ] `packages/backend/auth-jwt/README.md` — auth-session 답습. 사용 예제 (signin / verify / JWKS) + Out of scope + 후속 swap (phase-10 file/KMS keystore) 안내
- [ ] Commit: `docs(spec-05-03): auth-jwt README 작성`

---

## Task 8: 최종 검증

### 8-1. 품질 게이트
- [ ] `pnpm --filter @repo/backend-auth-jwt lint` 통과
- [ ] `pnpm --filter @repo/backend-auth-jwt typecheck` 통과
- [ ] `pnpm --filter @repo/backend-auth-jwt test` 전체 PASS
- [ ] 루트 `pnpm typecheck` / `pnpm lint` 통과
- [ ] depcruise 그린 (auth-session 의 `pnpm depcruise:validate` 또는 동등 명령)
- [ ] Commit: 없음 (검증 task — 결과만 walkthrough 에 기록)

---

## Task N: Ship (필수)

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

- [ ] 코드 품질 점검 (이미 Task 8 에서 수행) — 재확인만
- [ ] **walkthrough.md 작성** (증거 로그 + 핵심 설계 결정 + 검증 결과)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-05-03): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-05-03-auth-jwt`
- [ ] **PR 생성**: `/hk-pr-gh` (target: `phase-05-auth-core-security`)
- [ ] **사용자 알림**: PR URL 보고 + 머지 대기

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 8 + Ship |
| **예상 commit 수** | 14 (scaffold 1 + TDD red/green 5×2 + README 1 + ship 1, 검증 task 는 commit 0) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-20 19:40 |
