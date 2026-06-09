# Task List: spec-18-04

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

## Task 1: DB 스키마 + ProvisionService.provisionFromProvider (TDD Red)

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-18-04-provider-mode-cleanup` (base: `phase-18-auth-authority-mode`)

### 1-2. DB 스키마 변경

- [x] `apps/api/src/infra/schema/users.ts`: `providerUid: text("provider_uid").unique()` 추가
- [x] `apps/api/drizzle/0015_provider_uid.sql` 마이그레이션 파일 생성

### 1-3. FirebaseProvisionPort 인터페이스 업데이트

- [x] `packages/nestjs/auth-firebase/src/firebase-provision-port.ts`: `internalUserId: string` 반환 추가
- [x] `packages/nestjs/auth-firebase/src/firebase-verifier.ts`: `sub = internalUserId` 교체 로직 추가
- [x] `packages/nestjs/auth-firebase/src/firebase-verifier.test.ts`: provision 케이스에 `internalUserId` 추가

### 1-4. ProvisionService 테스트 스텁 (TDD Red)

- [x] `apps/api/src/provision/provision.service.test.ts` 수정:
  - `provisionFromProvider` 3 케이스 추가 (Red)
- [x] 테스트 FAIL 확인 (`provisionFromProvider is not a function`)
- [x] Commit: `test(spec-18-04): ProvisionService.provisionFromProvider 테스트 + DB 스키마 (Red)`

---

## Task 2: ProvisionService.provisionFromProvider 구현 (TDD Green) + FirebaseVerifier 업데이트

### 2-1. ProvisionService 구현

- [x] `apps/api/src/provision/provision.service.ts`: `provisionFromProvider` 구현 (provider_uid upsert)
- [x] `ProvisionService`에 `FirebaseProvisionPort` implements 추가
- [x] `pnpm --filter @apps/api test -- provision` → PASS 확인

### 2-2. FirebaseVerifier 업데이트

- [x] `firebase-verifier.ts`: provision 반환값에서 `internalUserId` 추출 → `sub` 교체
- [x] `firebase-verifier.test.ts`: 업데이트된 인터페이스에 맞게 테스트 수정
- [x] `pnpm --filter @repo/nestjs-auth-firebase test` → PASS 확인

- [x] Commit: `feat(spec-18-04): ProvisionService.provisionFromProvider + FirebaseVerifier sub 교체`

---

## Task 3: AUTH_MODE 설정 + AppModule 조건부 배선 + ProviderAuthModule

### 3-1. Settings 업데이트

- [x] `apps/api/src/settings.ts`: `AUTH_MODE`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `SUPABASE_JWT_SECRET` 추가

### 3-2. ProviderAuthModule 생성

- [x] `apps/api/src/auth/provider-auth.module.ts` 신규:
  - `AuthGuard`, `RolesGuard` + `ProvisionService` + 모드별 port binding
  - 컨트롤러 없음

### 3-3. AppModule 조건부 배선

- [x] `apps/api/src/app.module.ts`:
  - `AUTH_MODE`에 따라 verifier 모듈 + auth 모듈 조건부 import
  - `firebase`: `NestjsFirebaseAuthModule.forRoot()` + `ProviderAuthModule`
  - `supabase`: `NestjsSupabaseAuthModule.forRoot()` + `ProviderAuthModule`
  - `native`: 기존 `NestjsAuthModule.forRootAsync()` + `AuthModule`

### 3-4. 타입체크 + depcruise

- [x] `pnpm turbo run typecheck` → PASS
- [x] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → 위반 없음
- [x] Commit: `feat(spec-18-04): AUTH_MODE 조건부 배선 + ProviderAuthModule`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @apps/api lint` → PASS
- [ ] `pnpm --filter @apps/api typecheck` → PASS
- [ ] `pnpm --filter @apps/api test -- provision` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth-firebase test` → PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] `pnpm depcruise apps packages --config .dependency-cruiser.cjs` → PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-18-04): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-18-04-provider-mode-cleanup`
- [ ] **PR 생성**: `phase-18-auth-authority-mode` base branch 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 (Red + Green + Wiring + Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-09 |
