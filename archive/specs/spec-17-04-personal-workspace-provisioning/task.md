# Task List: spec-17-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-17.md SPEC 표 자동 갱신됨)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-17-04-personal-workspace-provisioning` (phase-17에서 분기)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: ProvisionService 구현 + 단위 테스트

**대상 파일**:
- `apps/api/src/provision/provision.service.ts` (NEW)
- `apps/api/src/provision/provision.service.test.ts` (NEW)

### 2-1. TDD Red

- [x] `provision.service.test.ts` 작성 — mock DB transaction, 3 쿼리 순서 검증
- [x] 테스트 실행 → Fail 확인

### 2-2. TDD Green

- [x] `provision.service.ts` 구현 — `provisionUser(userId, email)`
  - db.transaction: org INSERT → membership INSERT → user UPDATE
  - slug: `randomUUID()`, name: `email.split('@')[0]`
- [x] 테스트 실행 → PASS 확인
- [x] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [x] Commit: `feat(spec-17-04): implement ProvisionService with personal org + owner membership`

---

## Task 3: SignupService 연동 + auth.module 등록

**대상 파일**:
- `apps/api/src/auth/signup.service.ts` (MODIFY)
- `apps/api/src/auth/signup.service.test.ts` (MODIFY)
- `apps/api/src/auth/auth.module.ts` (MODIFY)
- `apps/api/src/infra/schema/users.ts` (MODIFY — @deprecated 주석)

### 3-1. 구현

- [x] `signup.service.ts` — `ProvisionService` inject, `signUp()` 마지막에 `provisionUser()` 호출
- [x] `signup.service.test.ts` — `ProvisionService` mock 추가, `provisionUser` 호출 검증
- [x] `auth.module.ts` — `ProvisionService` provider 등록
- [x] `users.ts` — `role` 필드에 `@deprecated` 주석 추가

### 3-2. 검증

- [x] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [x] Commit: `feat(spec-17-04): wire ProvisionService into SignupService + auth.module`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [x] **typecheck**: `pnpm turbo run typecheck --filter=@apps/api`
- [x] **lint**: `pnpm turbo run lint --filter=@apps/api`

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-17-04): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-04-personal-workspace-provisioning`
- [ ] **PR 생성**: `gh pr create --base phase-17`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (+ Ship) |
| **예상 commit 수** | 2 (T2+T3) + Ship |
| **현재 단계** | Ship |
| **마지막 업데이트** | 2026-06-06 |
