# Task List: spec-19-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: DB 마이그레이션 + SessionStore 확장

### 1-1. 브랜치 생성

- [ ] `git checkout -b spec-19-01-account-mutations-api` (base: `phase-19-account-authz`)

### 1-2. 마이그레이션 + 스키마 수정

- [ ] `apps/api/src/infra/migrations/0009_account_fields.sql` 신규 작성
  - `display_name TEXT`, `deleted_at TIMESTAMPTZ` 추가
- [ ] `apps/api/src/infra/schema/users.ts` — `displayName`, `deletedAt` 컬럼 추가
- [ ] `apps/api/src/infra/user.store.ts` 신규 — `findById`, `updatePasswordHash`, `updateDisplayName`, `softDelete`

### 1-3. SessionStore `revokeAllByUser` 추가

- [ ] `packages/backend/auth-session/src/` — `revokeAllByUser(userId)` 구현

### 1-4. 검증 및 커밋

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-19-01): users 마이그레이션 + UserStore + revokeAllByUser`

---

## Task 2: AccountService + AccountController TDD Red

### 2-1. e2e 테스트 작성 (TDD Red)

- [ ] `apps/api/src/auth/account.e2e.test.ts` 신규 — 5종 케이스 작성
  1. `POST /auth/account/password` — 현재 비밀번호 틀림 → 400/401
  2. `POST /auth/account/password` — 성공 → 200 + 새 비밀번호로 로그인 성공
  3. `PATCH /auth/account/profile` — displayName 변경 → GET /auth/me 반영
  4. `DELETE /auth/account` — sole owner → 400 ACCOUNT_DELETE_BLOCKED
  5. `DELETE /auth/account` — 정상 탈퇴 → 200 + 세션 무효화

### 2-2. AccountService + AccountController stub 작성 (컴파일 가능 최소)

- [ ] `apps/api/src/auth/account.service.ts` — 메서드 stub (`throw new Error('not implemented')`)
- [ ] `apps/api/src/auth/account.controller.ts` — 라우트 선언 + stub
- [ ] `apps/api/src/auth/auth.module.ts` — AccountService, AccountController 등록

### 2-3. Red 확인 및 커밋

- [ ] `pnpm turbo run typecheck` → PASS (타입 에러 없음)
- [ ] e2e 실행 → 5종 FAIL 확인
- [ ] Commit: `test(spec-19-01): account e2e 5종 Red`

---

## Task 3: AccountService 구현 (TDD Green)

### 3-1. `changePassword` 구현

- [ ] `verifyPassword` (현재 비밀번호 검증) → `hashPassword` → `updatePasswordHash`
- [ ] 현재 비밀번호 틀리면 적절한 에러 반환

### 3-2. `updateProfile` 구현

- [ ] `updateDisplayName` 호출

### 3-3. `deleteAccount` 구현

- [ ] memberships 조회 → sole owner 검증 → `ACCOUNT_DELETE_BLOCKED` throw
- [ ] `softDelete` (email 마스킹: `<email>#deleted_<uuid>`) + `revokeAllByUser`

### 3-4. `GET /auth/me` 응답에 `displayName` 포함

- [ ] me 응답 DTO / 컨트롤러 수정

### 3-5. Green 확인 및 커밋

- [ ] e2e 5종 PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-19-01): AccountService 구현 (비밀번호·프로필·탈퇴)`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] `pnpm --filter @apps/api test:e2e -- --testPathPattern="account.e2e"` → 5종 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (커밋 이력 + 테스트 로그 증거)
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-19-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-19-01-account-mutations-api`
- [ ] **PR 생성**: base `phase-19-account-authz` 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 (마이그레이션 + Red + Green + Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-12 |
