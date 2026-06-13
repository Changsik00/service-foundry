# Task List: spec-19-05 RBAC 배선

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: `packages/backend/authz` 신규 — policy 순수 함수

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-05-rbac-wiring`

### 1-2. 테스트 작성 (TDD Red)
- [ ] `packages/backend/authz/src/policy.test.ts` 작성
- [ ] 테스트 실행 → Fail 확인
- [ ] Commit: `test(spec-19-05): authz policy 단위 테스트 (Red)`

### 1-3. 구현 (TDD Green)
- [ ] `packages/backend/authz/src/policy.ts` 구현
- [ ] `packages/backend/authz/src/index.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts` 작성
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-19-05): @repo/backend-authz canInviteMember·canManageOrg`

---

## Task 2: `AuthenticatedUser.orgRole` 추출 + `OrgRolesGuard`

### 2-1. 테스트 작성 (TDD Red)
- [ ] `packages/nestjs/auth/src/auth.guard.test.ts` — orgRole 추출 테스트 추가
- [ ] `packages/nestjs/auth/src/org-roles.guard.test.ts` 신규
- [ ] 테스트 실행 → Fail 확인
- [ ] Commit: `test(spec-19-05): AuthenticatedUser orgRole + OrgRolesGuard 단위 테스트 (Red)`

### 2-2. 구현 (TDD Green)
- [ ] `verifier.ts` — `VerifiedIdentity.orgRole` 추가 + `NativeVerifier` 추출 로직
- [ ] `auth.guard.ts` — `AuthenticatedUser.orgRole` 추가 + `req.user` 세팅
- [ ] `org-roles.guard.ts` 신규
- [ ] `decorators.ts` — `@OrgRoles` 추가
- [ ] `index.ts` — export 추가
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-19-05): OrgRolesGuard + @OrgRoles + AuthenticatedUser.orgRole`

---

## Task 3: 라우트 배선 + e2e

### 3-1. e2e 테스트 작성 (TDD Red)
- [ ] `apps/api/src/auth/rbac.e2e.test.ts` 신규 (3 시나리오)
- [ ] `auth.controller.test.ts` mock orgRole 추가
- [ ] 테스트 실행 → Fail 확인
- [ ] Commit: `test(spec-19-05): rbac e2e — member 403, admin/owner 200 (Red)`

### 3-2. 구현 (TDD Green)
- [ ] `auth.controller.ts` — `@OrgRoles("admin", "owner")` + `OrgRolesGuard` 배선
- [ ] `auth.module.ts` — `OrgRolesGuard` provider 추가
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-19-05): POST /auth/org/invite OrgRolesGuard 배선 (admin+ only)`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] `pnpm --filter @repo/backend-authz exec vitest run` → PASS
- [ ] `pnpm --filter @repo/nestjs-auth exec vitest run` → PASS
- [ ] `pnpm --filter @apps/api exec vitest run` → PASS

### 📝 산출물 작성

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit: `docs(spec-19-05): walkthrough·pr_description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-19-05-rbac-wiring`
- [ ] PR 생성 (base: `phase-19-account-authz`)
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 6 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-13 |
