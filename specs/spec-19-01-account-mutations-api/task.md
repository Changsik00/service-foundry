# Task List: spec-19-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: DB 마이그레이션 + SessionStore 확장

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-19-01-account-mutations-api` (base: `phase-19-account-authz`)

### 1-2. 마이그레이션 + 스키마 수정

- [x] `apps/api/drizzle/0016_account_fields.sql` 신규 작성
- [x] `apps/api/src/infra/schema/users.ts` — `displayName`, `deletedAt` 컬럼 추가
- [x] `apps/api/src/auth/account.stores.ts` 신규 — AccountUserStore

### 1-3. SessionStore `revokeAllByUser` 추가

- [x] `packages/backend/auth-session/src/` — `revokeAllByUser(userId)` 구현

### 1-4. 검증 및 커밋

- [x] `pnpm turbo run typecheck` → PASS
- [x] Commit: `feat(spec-19-01): users 마이그레이션 + AccountUserStore + revokeAllByUser`

---

## Task 2+3: AccountService + AccountController (Red → Green)

- [x] `apps/api/src/auth/account.e2e.test.ts` 신규 — 5종 케이스 작성
- [x] `apps/api/src/auth/account.service.ts` 구현 (changePassword / updateProfile / deleteAccount)
- [x] `apps/api/src/auth/account.controller.ts` 구현 (PATCH password·profile, DELETE)
- [x] `apps/api/src/auth/auth.module.ts` — AccountService, AccountController, ACCOUNT_USER_STORE 등록
- [x] `auth.controller.ts GET /auth/me` — displayName DB 조회 추가
- [x] e2e 5종 PASS, 전체 168/168 PASS
- [x] Commit: `feat(spec-19-01): AccountService + AccountController + e2e 5종 Green`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [x] `pnpm turbo run typecheck` → PASS
- [x] e2e 5종 PASS (168/168 전체 통과)

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-19-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [x] **Push**: `git push -u origin spec-19-01-account-mutations-api`
- [x] **PR 생성**: base `phase-19-account-authz` 대상 → **PR #140**
- [x] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 (마이그레이션 + Green + Ship) |
| **현재 단계** | Done ✅ |
| **마지막 업데이트** | 2026-06-12 |
