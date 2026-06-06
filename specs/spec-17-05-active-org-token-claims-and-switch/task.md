# Task List: spec-17-05

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-17-05-active-org-token-claims-and-switch` (phase-17에서 분기)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: JWT 클레임 + ProvisionService 리턴 타입 변경

**대상 파일**:
- `packages/nestjs/auth/src/auth.guard.ts` (MODIFY)
- `apps/api/src/provision/provision.service.ts` (MODIFY)
- `apps/api/src/provision/provision.service.test.ts` (MODIFY)
- `apps/api/src/auth/signup.service.ts` (MODIFY)
- `apps/api/src/auth/signup.service.test.ts` (MODIFY)

### 2-1. 구현

- [ ] `auth.guard.ts` — `AuthenticatedUser.orgId: string | null` 추가, guard에서 orgId 추출
- [ ] `provision.service.ts` — 리턴 `void → { orgId: string; orgRole: string }`
- [ ] `provision.service.test.ts` — 리턴값 검증 테스트 추가
- [ ] `signup.service.ts` — provisionUser 결과 → `activeOrgId`, `orgRole` 클레임
- [ ] `signup.service.test.ts` — 토큰 클레임 검증 테스트 추가 (mock 수정)

### 2-2. 검증

- [ ] 관련 테스트 PASS
- [ ] `pnpm turbo run typecheck --filter=@repo/nestjs-auth` PASS
- [ ] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [ ] Commit: `feat(spec-17-05): add activeOrgId + orgRole JWT claims on signup`

---

## Task 3: Org Switch 서비스 + 라우트

**대상 파일**:
- `apps/api/src/auth/org-switch.service.ts` (NEW)
- `apps/api/src/auth/org-switch.service.test.ts` (NEW)
- `apps/api/src/auth/auth.controller.ts` (MODIFY)
- `apps/api/src/auth/auth.module.ts` (MODIFY)

### 3-1. TDD Red

- [ ] `org-switch.service.test.ts` 작성 — mock DB, 멤버십 없음 → ForbiddenException, 멤버십 있음 → accessToken 발급
- [ ] 테스트 실행 → Fail 확인

### 3-2. TDD Green

- [ ] `org-switch.service.ts` 구현
- [ ] `auth.controller.ts` — `POST /auth/org/switch` 라우트 추가
- [ ] `auth.module.ts` — `OrgSwitchService` 등록
- [ ] 테스트 PASS
- [ ] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [ ] Commit: `feat(spec-17-05): add POST /auth/org/switch endpoint`

---

## Task 4: Tenant ALS + withTenantContext + 전역 인터셉터

**대상 파일**:
- `apps/api/src/infra/tenant.ts` (NEW)
- `apps/api/src/infra/tenant.interceptor.ts` (NEW)
- `apps/api/src/app.module.ts` (MODIFY)

### 4-1. TDD Red

- [ ] `apps/api/src/infra/tenant.test.ts` — `withTenantContext` 동작 검증 (mock Drizzle tx)
- [ ] `apps/api/src/infra/tenant.interceptor.test.ts` — ALS 저장 검증

### 4-2. TDD Green

- [ ] `tenant.ts` 구현
- [ ] `tenant.interceptor.ts` 구현
- [ ] `app.module.ts` — `TENANT_ALS` provider + `APP_INTERCEPTOR` 전역 등록
- [ ] 테스트 PASS
- [ ] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [ ] Commit: `feat(spec-17-05): add tenant ALS + withTenantContext + global interceptor`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **typecheck**: `pnpm turbo run typecheck`
- [ ] **lint**: `pnpm turbo run lint --filter=@apps/api`

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-17-05): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-05-active-org-token-claims-and-switch`
- [ ] **PR 생성**: `gh pr create --base phase-17`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (+ Ship) |
| **예상 commit 수** | 3 (T2+T3+T4) + Ship |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-06 |
