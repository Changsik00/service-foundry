# Task List: spec-17-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-17.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-17-02-multi-tenancy-entity-schema` (phase-17 에서 분기)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: Drizzle 스키마 추가 + migration 생성

**단위 테스트 없음** — 순수 스키마 정의. typecheck 로 검증.

**대상 파일**:
- `apps/api/src/infra/schema/organizations.ts` (NEW)
- `apps/api/src/infra/schema/memberships.ts` (NEW)
- `apps/api/src/infra/schema/invitations.ts` (NEW)
- `apps/api/src/infra/schema/index.ts` (MODIFY)
- `apps/api/src/infra/schema/local.ts` (MODIFY)
- `apps/api/drizzle/0009_*.sql` (GENERATED)

### 2-1. 스키마 파일 작성
- [x] `organizations.ts` 생성 (id·name·slug·is_personal·owner_id·created_at)
- [x] `memberships.ts` 생성 (`orgRoleEnum` + id·user_id·org_id·role·created_at, UNIQUE)
- [x] `invitations.ts` 생성 (`inviteRoleEnum` + id·org_id·email·token_hash·role·invited_by·expires_at·accepted_at·created_at)
- [x] `index.ts` 에 3개 테이블 + Row/Insert 타입 + `appSchema` 등록
- [x] `local.ts` 에 3개 테이블 + enum export

### 2-2. Migration 생성 + typecheck
- [x] `pnpm --filter ./apps/api exec drizzle-kit generate` 실행
- [x] 생성된 SQL 에 CREATE TYPE + 3개 CREATE TABLE + FK + UNIQUE 포함 확인
- [x] `pnpm turbo run typecheck --filter=@apps/api` PASS
- [x] Commit: `feat(spec-17-02): add organizations/memberships/invitations schema + migration`

---

## Task 3: auth-contracts OrgRole 타입 추가

**대상 파일**: `packages/shared/auth-contracts/src/index.ts`

### 3-1. Zod 타입 추가
- [x] `OrgRole = z.enum(["owner", "admin", "member"])` 추가
- [x] `InviteRole = z.enum(["admin", "member"])` 추가
- [x] `Organization`, `Membership`, `InvitationRow` Zod 스키마 추가
- [x] `pnpm turbo run typecheck --filter=@repo/auth-contracts` PASS
- [x] Commit: `feat(spec-17-02): add OrgRole/Organization/Membership/InvitationRow contracts`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] **typecheck**: `pnpm turbo run typecheck --filter=@repo/auth-contracts --filter=@apps/api`
- [ ] **lint**: `pnpm turbo run lint --filter=@repo/auth-contracts --filter=@apps/api`

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (템플릿 준수)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-17-02): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-02-multi-tenancy-entity-schema`
- [ ] **PR 생성**: `gh pr create --base phase-17`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (+ Ship) |
| **예상 commit 수** | 3 (T2+T3+Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-06 |
