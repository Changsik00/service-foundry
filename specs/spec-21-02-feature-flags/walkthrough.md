# Walkthrough: spec-21-02 피처플래그

## 구현 요약

5개 커밋으로 피처플래그 전체 사이클 구현 완료.

### 변경 파일

| 파일 | 타입 | 설명 |
|---|---|---|
| `apps/api/src/infra/schema/feature-flags.ts` | NEW | `feature_flags` 테이블 Drizzle 스키마 |
| `apps/api/drizzle/0020_cloudy_stick.sql` | NEW | 자동 생성 마이그레이션 |
| `apps/api/src/admin/feature-flag.service.ts` | NEW | CRUD + isEnabled 서비스 |
| `apps/api/src/admin/feature-flag.decorator.ts` | NEW | `@FeatureFlag("key")` SetMetadata 데코레이터 |
| `apps/api/src/admin/feature-flag.guard.ts` | NEW | `FeatureFlagGuard` — DB 조회 후 꺼진 플래그 → 403 |
| `apps/api/src/admin/admin.controller.ts` | MODIFY | CRUD 4개 엔드포인트 추가 |
| `apps/api/src/auth/auth.module.ts` | MODIFY | `FeatureFlagService`, `FeatureFlagGuard` provider 추가 |
| `apps/api/src/auth/provider-auth.module.ts` | MODIFY | 동일 |
| `apps/api/src/admin/feature-flag.service.test.ts` | NEW | 단위 테스트 9개 (TDD Red→Green) |
| `apps/api/src/admin/feature-flag.e2e.test.ts` | NEW | e2e 테스트 7개 (CRUD + guard) |
| `apps/web/src/features/admin/queries.ts` | MODIFY | featureFlagQueries 추가 |
| `apps/web/src/features/admin/FeatureFlagTable.tsx` | NEW | 목록 + 토글 + 생성 폼 UI |
| `apps/web/src/features/admin/FeatureFlagTable.test.tsx` | NEW | UI 테스트 5개 |
| `apps/web/src/app/(console)/admin/feature-flags/page.tsx` | NEW | `/admin/feature-flags` 라우트 |

### 핵심 설계 결정

**feature_flags 테이블 전역 스코프**: `runWithSystemTenant` 없이 DATABASE 직접 사용. 이 테이블은 RLS 정책 대상이 아님 (테넌트 스코프 없는 플랫폼 전역 설정).

**FeatureFlagGuard 캐싱 없음**: 매 요청마다 DB 조회. 트래픽이 적은 어드민 API 대상이고 플래그 변경이 즉시 반영되어야 하므로 캐시 없이 구현. 후속 spec에서 캐시 레이어 추가 가능.

**AdminController에 CRUD 추가**: `@Roles("admin")` 이 이미 컨트롤러 레벨에 적용되어 있어 별도 모듈 불필요. spec-21-01의 패턴 재사용.

**biome import type 오탐**: `FeatureFlagGuard`의 `Reflector`, `FeatureFlagService` 의존성을 Biome가 `import type`으로 변환 → NestJS DI 실패. `// biome-ignore lint/style/useImportType` 주석으로 해결.

### 테스트 결과

- API 단위 테스트: 9/9 PASS
- API e2e (mock) 테스트: 7/7 PASS
- 웹 UI 테스트: 5/5 PASS
- 전체 typecheck: PASS
