# Task List: spec-24-06

> One Task = One Commit. 저널 정합이 핵심 — migrate 실패는 auto 정지규칙.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-24-06-drizzle-schema-package` (base: `phase-24-refactor-hardening-2`)

## Task 2: `@repo/backend-schema` 생성 + 이관 + 재배선 (원자적)
- [ ] `packages/backend/schema/` 스캐폴딩(package.json deps: drizzle-orm + @repo/backend-auth-audit/session + @repo/backend-auth-rate-limit, tsconfig, vitest.config)
- [ ] 15 스키마 파일 `git mv` → `packages/backend/schema/src/` (상호 `./X.js` import 유지)
- [ ] 소비처 18 파일 import `../infra/schema/*` → `@repo/backend-schema`
- [ ] `apps/api/package.json` 에 `@repo/backend-schema` 추가 + `apps/api/drizzle.config.ts` `schema` 경로 갱신
- [ ] `infra/schema/` 디렉토리 삭제 + `pnpm install`
- [ ] `db:generate` → **신규 마이그레이션 0** 확인 (no drift) + typecheck + 단위 PASS
- [ ] Commit: `refactor(spec-24-06): extract drizzle schema into @repo/backend-schema (E2)`

## Task 3: Ship
### 🚦 Pre-Push Quality Gate (저널 정합 필수)
- [ ] **fresh DB**: 컨테이너 재생성 → `db:migrate` 클린 적용(저널 정합 증명)
- [ ] `turbo run lint typecheck test` + e2e (로컬 5434 DB) → 회귀 0
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-24-06): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-24-06-drizzle-schema-package`
- [ ] PR 생성 (base: `phase-24-refactor-hardening-2`)
