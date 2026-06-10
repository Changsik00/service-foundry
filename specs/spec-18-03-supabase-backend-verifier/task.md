# Task List: spec-18-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-18.md SPEC 표 sdd 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 패키지 스캐폴딩 + SupabaseVerifier 스텁 (TDD Red)

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-18-03-supabase-backend-verifier` (base: `phase-18-auth-authority-mode`)

### 1-2. 패키지 파일 생성

- [x] `packages/nestjs/auth-supabase/package.json` 생성
- [x] `packages/nestjs/auth-supabase/tsconfig.json` 생성
- [x] `packages/nestjs/auth-supabase/vitest.config.ts` 생성
- [x] `packages/nestjs/auth-supabase/src/supabase-provision-port.ts` 생성:
  - `SUPABASE_PROVISION_PORT` DI 심볼
  - `SupabaseProvisionPort` 인터페이스 (`provisionFromProvider`)
- [x] `packages/nestjs/auth-supabase/src/supabase-verifier.ts` 스텁 생성:
  - `SUPABASE_JWT_OPTIONS` DI 심볼
  - `SupabaseJwtOptions` 인터페이스
  - `SupabaseVerifier` 스텁 (`throw new Error('not implemented')`)
- [x] `packages/nestjs/auth-supabase/src/supabase-auth.module.ts` 스텁:
  - `SupabaseAuthOptions` 타입
  - `NestjsSupabaseAuthModule.forRoot()` 스텁
- [x] `packages/nestjs/auth-supabase/src/index.ts` 생성 (stub exports)
- [x] `packages/nestjs/auth-supabase/src/supabase-verifier.test.ts` 작성:
  - `SignJWT` + `importSecret` 로 테스트 JWT 직접 생성 (vi.mock 불필요)
  - 5개 테스트 케이스
- [x] `pnpm install`
- [x] `pnpm --filter @repo/nestjs-auth-supabase test` → FAIL 확인 (스텁)
- [x] Commit: `test(spec-18-03): SupabaseVerifier 단위 테스트 + 패키지 스캐폴딩 (Red)`

---

## Task 2: SupabaseVerifier 구현 (TDD Green)

### 2-1. SupabaseVerifier.verify() 구현

- [x] `packages/nestjs/auth-supabase/src/supabase-verifier.ts` 구현:
  - `jwtVerify(token, new TextEncoder().encode(jwtSecret))` → `JWTPayload`
  - `payload.sub` → `sub`
  - `payload.role ?? "user"` → `role`
  - `payload[ACTIVE_ORG_CLAIM] ?? payload.app_metadata?.[ACTIVE_ORG_CLAIM] ?? null` → `orgId`
  - provisioning 경로: `provisionFromProvider(sub, email)`
- [x] `pnpm --filter @repo/nestjs-auth-supabase test` → PASS 확인
- [x] Commit: `feat(spec-18-03): SupabaseVerifier 구현 (Green)`

---

## Task 3: NestjsSupabaseAuthModule + 타입체크 + depcruise

### 3-1. 모듈 구현

- [x] `packages/nestjs/auth-supabase/src/supabase-auth.module.ts` 완성:
  - `SUPABASE_JWT_OPTIONS` provide
  - `SupabaseVerifier` provider
  - `ACCESS_TOKEN_VERIFIER → SupabaseVerifier` provide
  - exports `ACCESS_TOKEN_VERIFIER`
- [x] `packages/nestjs/auth-supabase/src/index.ts` public API 완성
- [x] `pnpm --filter @repo/nestjs-auth-supabase typecheck` → PASS
- [x] `pnpm --filter @repo/nestjs-auth-supabase lint` → PASS
- [x] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → 위반 없음
- [x] Commit: `feat(spec-18-03): NestjsSupabaseAuthModule + public API`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [x] `pnpm --filter @repo/nestjs-auth-supabase lint` → PASS
- [x] `pnpm --filter @repo/nestjs-auth-supabase typecheck` → PASS
- [x] `pnpm --filter @repo/nestjs-auth-supabase test` → PASS
- [x] `pnpm turbo run typecheck` → PASS (전체 workspace)
- [x] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → PASS

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-18-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [x] **Push**: `git push -u origin spec-18-03-supabase-backend-verifier`
- [x] **PR 생성**: `phase-18-auth-authority-mode` base branch 대상
- [x] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 (Red + Green + Module + Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-09 |
