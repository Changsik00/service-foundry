# Task List: spec-08-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new auth-supabase`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 백로그 업데이트 (phase-08.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + auth-supabase 패키지 스캐폴딩

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-08-02-auth-supabase` (from `phase-08-provider-adapters`)

### 1-2. catalog 및 패키지 초기화
- [ ] `pnpm-workspace.yaml` catalog에 `@supabase/supabase-js: "^2.0.0"` 추가
- [ ] `packages/frontend/auth-supabase/` 디렉토리 + `package.json` / `tsconfig.json` / `vitest.config.ts` 생성
- [ ] `packages/frontend/auth-supabase/src/index.ts` — `export {};` placeholder (TS18003 방지)
- [ ] `pnpm install --ignore-scripts`
- [ ] Commit: `chore(spec-08-02): auth-supabase 패키지 스캐폴딩`

---

## Task 2: SupabaseAuthError 정규화 (TDD)

### 2-1. normalize.test.ts 작성 → Fail
- [ ] `packages/frontend/auth-supabase/src/normalize.test.ts` 작성
  - `"Invalid login credentials"` → `{ success: false, reason: "invalid_credentials" }`
  - `"Email not confirmed"` → `{ success: false, reason: "unverified_email" }`
  - `"Email rate limit exceeded"` → `{ success: false, reason: "rate_limited" }`
  - `"User already registered"` → `AppError` throw (code: "CONFLICT")
  - 기타 AuthApiError → re-throw
  - 비-Supabase 에러 → re-throw
- [ ] `pnpm --filter frontend-auth-supabase test` → Fail 확인

### 2-2. normalize.ts 구현 → Pass
- [ ] `packages/frontend/auth-supabase/src/normalize.ts` 구현
- [ ] `pnpm --filter frontend-auth-supabase test` → PASS
- [ ] Commit: `feat(spec-08-02): SupabaseAuthError 정규화 (normalize.ts)`

---

## Task 3: createSupabaseAuthSDK 구현 (TDD)

### 3-1. index.test.ts 작성 → Fail
- [ ] `packages/frontend/auth-supabase/src/index.test.ts` 작성
  - `vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))` 설정
  - `signIn` 성공 경로 — `AuthResult { success: true }`
  - `signIn` 실패 — `"Invalid login credentials"` → `AuthResult { success: false, reason: "invalid_credentials" }`
  - `signUp` 성공 경로
  - `signUp` email 중복 — `AppError` throw
  - `signOut` 위임
  - `getCurrentUser` null / 유저 있음
  - `refresh` null / Session 반환
  - `supabase.rls` — createClient 반환값 노출 확인
- [ ] `pnpm --filter frontend-auth-supabase test` → Fail 확인

### 3-2. index.ts 구현 → Pass
- [ ] `packages/frontend/auth-supabase/src/index.ts` 구현
  - `SupabaseConfig`, `SupabaseExtensions` 타입
  - `createSupabaseAuthSDK(config)` — `CoreAuthSDK & { supabase: SupabaseExtensions }` 반환
- [ ] `pnpm --filter frontend-auth-supabase test` → PASS
- [ ] `pnpm -r typecheck` → PASS (전체 패키지)
- [ ] Commit: `feat(spec-08-02): createSupabaseAuthSDK — CoreAuthSDK 구현`

---

## Task 4: Ship

- [ ] `pnpm --filter frontend-auth-supabase test` → 전체 PASS
- [ ] `pnpm -r typecheck` → PASS
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-08-02): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-08-02-auth-supabase`
- [ ] **PR 생성** (base: `phase-08-provider-adapters`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
