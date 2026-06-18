# Task List: spec-21-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: AdminService TDD

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-21-01-admin-panel`

### 1-2. 타입 스텁 + 테스트 작성 (TDD Red)
- [ ] `apps/api/src/admin/admin.service.ts` — `AdminOrg`, `AdminUser`, `OrgListParams`, `OrgListResult`, `UserListParams`, `UserListResult` 인터페이스 + throwing stub
- [ ] `apps/api/src/admin/admin.service.test.ts` 작성
  - `listOrgs()`: 기본 목록, search ilike, cursor(gt), limit+1 nextCursor
  - `listUsers()`: 기본 목록, search ilike, cursor(gt), limit+1 nextCursor
  - `runWithSystemTenant` mock 검증
- [ ] `pnpm turbo typecheck` → PASS (stub 덕분)
- [ ] `pnpm --filter @apps/api test -- --testPathPattern="admin.service"` → FAIL
- [ ] Commit: `test(spec-21-01): admin service 단위 테스트 (red)`

### 1-3. 구현 (TDD Green)
- [ ] `AdminService` 전체 구현 (`@Inject(DATABASE)` + `@Inject(TENANT_ALS)`, `runWithSystemTenant` 래핑, Drizzle 쿼리)
- [ ] 테스트 → PASS
- [ ] Commit: `feat(spec-21-01): admin service listOrgs/listUsers 구현`

---

## Task 2: AdminController + Module TDD

### 2-1. 테스트 작성 (TDD Red)
- [ ] `apps/api/src/admin/admin.e2e.test.ts` 작성
  - `role="admin"` → `GET /admin/orgs` 200
  - `role="admin"` → `GET /admin/users` 200
  - `role="user"` → 403 Forbidden
  - 미인증 → 401
- [ ] 테스트 → FAIL
- [ ] Commit: `test(spec-21-01): admin controller e2e 테스트 (red)`

### 2-2. 구현 (TDD Green)
- [ ] `apps/api/src/admin/admin.controller.ts` — `@Roles("admin")` + `@UseGuards(AuthGuard, RolesGuard)`, GET orgs/users
- [ ] `apps/api/src/admin/admin.module.ts`
- [ ] `apps/api/src/app.module.ts` — `AdminModule` import 추가
- [ ] 테스트 → PASS
- [ ] Commit: `feat(spec-21-01): admin controller + module 등록`

---

## Task 3: 프론트엔드 어드민 패널

### 3-1. 구현 + 테스트 (단일 커밋)
- [ ] `apps/web/src/features/admin/queries.ts` (AdminOrgSchema, AdminUserSchema, adminQueries)
- [ ] `apps/web/src/features/admin/OrgTable.tsx` (search debounce + 더 보기)
- [ ] `apps/web/src/features/admin/UserTable.tsx`
- [ ] `apps/web/src/features/admin/OrgTable.test.tsx` (최소 3개 테스트)
- [ ] `apps/web/src/features/admin/UserTable.test.tsx` (최소 3개 테스트)
- [ ] `apps/web/src/app/(console)/admin/layout.tsx` (AdminGuard — role 체크)
- [ ] `apps/web/src/app/(console)/admin/page.tsx` (redirect → /admin/orgs)
- [ ] `apps/web/src/app/(console)/admin/orgs/page.tsx`
- [ ] `apps/web/src/app/(console)/admin/users/page.tsx`
- [ ] 테스트 → PASS
- [ ] Commit: `feat(spec-21-01): 어드민 패널 프론트엔드 (조직/유저 목록 + 가드)`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo test` → 전체 PASS
- [ ] `pnpm turbo typecheck` → PASS

### 📝 산출물 작성

- [ ] `specs/spec-21-01-admin-panel/walkthrough.md` 작성
- [ ] `specs/spec-21-01-admin-panel/pr_description.md` 작성
- [ ] Commit: `docs(spec-21-01): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `bash .harness-kit/bin/sdd spec ship`
- [ ] `git push -u origin spec-21-01-admin-panel`
- [ ] PR 생성 (base: `phase-21-admin-billing`)
- [ ] 머지 후 post-merge sync commit
