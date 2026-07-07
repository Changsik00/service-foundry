# Task List: spec-24-05

> One Task = One Commit. 매 commit 직후 체크박스 갱신.
> 안전망: spec-24-01 단위 + spec-17-08 격리 e2e. 격리 회귀는 auto 정지규칙 대상.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-24-05-tenant-infra-package` (base: `phase-24-refactor-hardening-2`)

## Task 2: `@repo/backend-tenant` (core) 생성
- [ ] `packages/backend/tenant/` 스캐폴딩(package.json/tsconfig/vitest.config) + `src/index.ts`(tenant core, `NodePgDatabase` ← drizzle 직접) + `src/index.test.ts`(tenant.test 이관)
- [ ] `pnpm install` → 워크스페이스 링크
- [ ] 실행 → backend-tenant test/typecheck PASS
- [ ] Commit: `feat(spec-24-05): add @repo/backend-tenant core package (E1)`

## Task 3: `@repo/nestjs-tenant` (adapter) 생성
- [ ] `packages/nestjs/tenant/` 스캐폴딩 + `src/index.ts`(interceptor+module, 요청 타입 인라인) + `src/index.test.ts`(interceptor.test 이관)
- [ ] `pnpm install`
- [ ] 실행 → nestjs-tenant test/typecheck PASS
- [ ] Commit: `feat(spec-24-05): add @repo/nestjs-tenant adapter package (E1)`

## Task 4: apps/api 재배선 + infra/tenant.* 삭제
- [ ] `apps/api/package.json` 에 두 패키지 추가 + `pnpm install`
- [ ] app.module + org-list/org-invite/provider-org-switch/admin 서비스 + 테스트 import 교체
- [ ] `infra/tenant.ts`/`tenant.interceptor.ts`/`tenant.module.ts` + 테스트 삭제
- [ ] 실행 → apps/api 단위 + typecheck PASS
- [ ] Commit: `refactor(spec-24-05): rewire apps/api to tenant packages, drop infra/tenant.* (E1)`

## Task 5: Ship
### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test`(로컬 5434 DB) → **격리 e2e 포함 회귀 0**
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-24-05): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-24-05-tenant-infra-package`
- [ ] PR 생성 (base: `phase-24-refactor-hardening-2`)
