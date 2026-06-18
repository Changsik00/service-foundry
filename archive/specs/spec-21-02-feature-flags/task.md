# Task List: spec-21-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: DB 스키마 + 마이그레이션

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-21-02-feature-flags`

### 1-2. 스키마 + 마이그레이션 생성
- [ ] `apps/api/src/infra/schema/feature-flags.ts` 작성 (featureFlags 테이블)
- [ ] `apps/api/src/infra/schema/local.ts` — feature-flags export 추가
- [ ] `apps/api/src/infra/schema/index.ts` — featureFlags + 타입 + appSchema 추가
- [ ] `pnpm --filter @apps/api db:generate` 실행 → `drizzle/0020_feature_flags.sql` 자동 생성
- [ ] `pnpm turbo typecheck` → PASS
- [ ] Commit: `feat(spec-21-02): feature_flags 테이블 스키마 + 마이그레이션`

---

## Task 2: FeatureFlagService TDD

### 2-1. 타입 스텁 + 테스트 작성 (TDD Red)
- [ ] `apps/api/src/admin/feature-flag.service.ts` 스텁 작성 (인터페이스만)
- [ ] `apps/api/src/admin/feature-flag.service.test.ts` 작성
  - `list()`: 전체 플래그 반환
  - `isEnabled("key")`: enabled=true → true, enabled=false → false, 없는 키 → false
  - `create(key, description)`: insert 호출
  - `update(key, enabled)`: update 호출
  - `remove(key)`: delete 호출
- [ ] 테스트 → FAIL
- [ ] Commit: `test(spec-21-02): feature-flag service 단위 테스트 (red)`

### 2-2. 구현 (TDD Green)
- [ ] `FeatureFlagService` 전체 구현 (`@Inject(DATABASE)`)
- [ ] 테스트 → PASS
- [ ] Commit: `feat(spec-21-02): feature-flag service 구현`

---

## Task 3: FeatureFlagGuard + Decorator + AdminController 확장 TDD

### 3-1. 구현 + 테스트
- [ ] `apps/api/src/admin/feature-flag.decorator.ts` 작성
- [ ] `apps/api/src/admin/feature-flag.guard.ts` 작성
- [ ] `apps/api/src/admin/admin.controller.ts` — CRUD 4개 엔드포인트 추가
- [ ] `apps/api/src/auth/auth.module.ts` — FeatureFlagService, FeatureFlagGuard provider 추가
- [ ] `apps/api/src/auth/provider-auth.module.ts` — 동일
- [ ] `apps/api/src/admin/feature-flag.controller.e2e.test.ts` 작성
  - CRUD 각 200/201
  - `FeatureFlagGuard`: 꺼진 플래그 엔드포인트 → 403
  - `FeatureFlagGuard`: 켜진 플래그 → 통과
- [ ] 테스트 → PASS
- [ ] `pnpm turbo typecheck` → PASS
- [ ] Commit: `feat(spec-21-02): feature-flag guard + decorator + admin CRUD 엔드포인트`

---

## Task 4: 프론트엔드 피처플래그 관리 UI

### 4-1. 구현 + 테스트 (단일 커밋)
- [ ] `apps/web/src/features/admin/FeatureFlagTable.tsx` — 목록 + 토글 버튼 + 생성 폼
- [ ] `apps/web/src/features/admin/FeatureFlagTable.test.tsx` (최소 3개 테스트)
- [ ] `apps/web/src/app/(console)/admin/feature-flags/page.tsx`
- [ ] 테스트 → PASS
- [ ] Commit: `feat(spec-21-02): 피처플래그 관리 UI`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] `pnpm turbo test` → 전체 PASS
- [ ] `pnpm turbo typecheck` → PASS

### 📝 산출물 작성
- [ ] `specs/spec-21-02-feature-flags/walkthrough.md` 작성
- [ ] `specs/spec-21-02-feature-flags/pr_description.md` 작성
- [ ] Commit: `docs(spec-21-02): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-21-02-feature-flags`
- [ ] PR 생성 (base: `phase-21-admin-billing`)
- [ ] 머지 후 post-merge sync commit
