# Task List: spec-17-06

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

- [x] `git checkout -b spec-17-06-org-invite-accept-flow` (phase-17 에서 분기)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: Contracts 추가

**대상 파일**:
- `packages/shared/auth-contracts/src/index.ts` (MODIFY)

### 2-1. 구현

- [ ] `OrgInviteInput = z.object({ email: Email, role: z.enum(["admin", "member"]) })`
- [ ] `OrgInviteAcceptInput = z.object({ token: Token })`
- [ ] type export 추가

### 2-2. 검증

- [ ] `pnpm turbo run typecheck --filter=@repo/auth-contracts` PASS
- [ ] Commit: `feat(spec-17-06): add OrgInviteInput and OrgInviteAcceptInput contracts`

---

## Task 3: OrgInviteService (TDD)

**대상 파일**:
- `apps/api/src/auth/org-invite.service.test.ts` (NEW)
- `apps/api/src/auth/org-invite.service.ts` (NEW)

### 3-1. TDD Red

- [ ] `org-invite.service.test.ts` 작성:
  - invite: owner → 성공 (notifier 호출 확인)
  - invite: member → ForbiddenException
  - accept: 유효 토큰 → accessToken 반환
  - accept: 토큰 없음 → NotFoundException
  - accept: 만료 → GoneException
  - accept: 이미 수락 → ConflictException
- [ ] 테스트 실행 → 전부 Fail 확인

### 3-2. TDD Green

- [ ] `org-invite.service.ts` 구현
- [ ] 테스트 PASS
- [ ] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [ ] Commit: `feat(spec-17-06): add OrgInviteService (invite + accept)`

---

## Task 4: 라우트 + 모듈 등록

**대상 파일**:
- `apps/api/src/auth/auth.controller.ts` (MODIFY)
- `apps/api/src/auth/auth.controller.test.ts` (MODIFY)
- `apps/api/src/auth/auth.module.ts` (MODIFY)

### 4-1. 구현

- [ ] `auth.controller.ts` — `POST /auth/org/invite`, `POST /auth/org/invite/accept` 추가
- [ ] `auth.controller.test.ts` — `OrgInviteService` mock 추가
- [ ] `auth.module.ts` — `OrgInviteService` providers 등록

### 4-2. 검증

- [ ] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [ ] `pnpm turbo run lint --filter=@apps/api` PASS
- [ ] Commit: `feat(spec-17-06): wire POST /auth/org/invite and /accept routes`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **typecheck**: `pnpm turbo run typecheck`
- [ ] **lint**: `pnpm turbo run lint --filter=@apps/api`

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-17-06): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-06-org-invite-accept-flow`
- [ ] **PR 생성**: `gh pr create --base phase-17`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (+ Ship) |
| **예상 commit 수** | 3 (T2+T3+T4) + Ship |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-07 |
