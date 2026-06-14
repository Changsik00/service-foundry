# feat(spec-21-02): 피처플래그 — 설정 API + 가드 + 관리 UI

## Summary

- `feature_flags` 테이블 추가 + Drizzle 마이그레이션 (`0020_cloudy_stick.sql`)
- `FeatureFlagService` (list/isEnabled/create/update/remove) — 전역 스코프, RLS 우회 불필요
- `@FeatureFlag("key")` 데코레이터 + `FeatureFlagGuard` — 꺼진 플래그 요청 → 403
- `AdminController` CRUD 4종 추가: `GET/POST /admin/feature-flags`, `PATCH/DELETE /admin/feature-flags/:key`
- 프론트엔드 `/admin/feature-flags` 페이지 — 목록 + 토글 + 생성 폼

## Changes

### API
- `feature_flags` DB 테이블 (key unique, description nullable, enabled boolean, createdAt)
- `FeatureFlagService`: `list()` / `isEnabled(key)` / `create(key, desc?)` / `update(key, enabled)` / `remove(key)`
- `FeatureFlagGuard`: `@FeatureFlag("key")` 데코레이터와 조합, 비활성 플래그 → `ForbiddenException`
- `AuthModule` + `ProviderAuthModule`에 `FeatureFlagService`, `FeatureFlagGuard` provider 등록

### Frontend
- `FeatureFlagTable` 컴포넌트: 목록 테이블 + 토글 버튼(켜기/끄기) + 삭제 버튼 + 인라인 생성 폼
- `/admin/feature-flags` 페이지 (AdminGuard 보호됨 — 레이아웃 공유)

## Test plan

- [x] `feature-flag.service.test.ts`: 단위 테스트 9개 PASS
- [x] `feature-flag.e2e.test.ts`: e2e 테스트 7개 PASS (CRUD 4종 + guard 3종)
- [x] `FeatureFlagTable.test.tsx`: UI 테스트 5개 PASS
- [x] `pnpm turbo typecheck` PASS
