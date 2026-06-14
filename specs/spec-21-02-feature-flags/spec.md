# spec-21-02: 피처플래그 — 설정 API + 가드 + 관리 UI

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-21-02` |
| **Phase** | `phase-21` |
| **Branch** | `spec-21-02-feature-flags` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-06-14 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

spec-21-01로 수퍼어드민 패널(조직·유저 조회)이 구현됐다. 그러나 특정 기능을 켜고/끄는 수단이 없어 배포 리스크 제어나 점진적 출시(progressive rollout)가 불가능하다. 현재 `feature_flags` 테이블이 없고, DB에 플래그 개념 자체가 존재하지 않는다.

### 문제점

- 새 기능 배포 시 코드 변경 없이 on/off 할 수 있는 수단이 없다.
- 특정 엔드포인트를 플래그로 보호하는 패턴(`@FeatureFlag("key")`)이 없다.
- 운영자가 플래그 상태를 확인하고 토글할 UI가 없다.

### 해결 방안

`feature_flags` 테이블(key, description, enabled)을 신규 생성하고, `FeatureFlagService` + `FeatureFlagGuard` + `@FeatureFlag()` 데코레이터를 추가한다. 어드민 API로 플래그 CRUD를 제공하고, 프론트엔드 어드민 패널에 관리 UI를 추가한다.

## 요구사항

1. `feature_flags` 테이블: `key`(PK 대용 unique), `description`, `enabled`(boolean), `createdAt`
2. `GET /admin/feature-flags` — 전체 플래그 목록 (admin only)
3. `POST /admin/feature-flags` — 플래그 생성 (admin only)
4. `PATCH /admin/feature-flags/:key` — 플래그 활성화/비활성화 (admin only)
5. `DELETE /admin/feature-flags/:key` — 플래그 삭제 (admin only)
6. `@FeatureFlag("key")` 데코레이터 + `FeatureFlagGuard` — 플래그가 꺼진 엔드포인트 요청 시 403
7. 프론트엔드 `/admin/feature-flags` 페이지 — 플래그 목록 + 토글 + 생성 폼

## Out of Scope

- 조직별(per-org) 플래그 오버라이드 — 이후 spec 가능
- 퍼센티지 롤아웃(% rollout) — 이후 spec
- 프론트엔드 클라이언트 사이드 플래그 체크(`useFeatureFlag` 훅) — 이후

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 플래그 비활성화 시 응답: **403 Forbidden** vs **404 Not Found** 선택 필요. 403은 기능 존재를 노출하고, 404는 은폐. 현재 spec은 **403** 기본.

> [!WARNING]
> - [ ] `FeatureFlagGuard`는 매 요청마다 DB를 조회한다. 트래픽이 많으면 캐싱이 필요하지만 이 spec에서는 단순 DB 조회로 구현. 캐시 레이어는 후속 spec.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **DB** | `feature_flags` 단일 테이블 (전역 on/off) | org별 오버라이드 없이 단순하게 |
| **마이그레이션** | `pnpm db:generate` 자동 생성 | 수동 SQL + journal 함정 방지 (memory: Drizzle 마이그레이션 저널 필수) |
| **Guard** | `FeatureFlagGuard` — DB 직접 조회 | 캐시 없는 최소 구현 |
| **위치** | `apps/api/src/admin/` | AdminService와 동일 패턴, auth 모듈에 provider 등록 |
| **Admin API** | `AdminController`에 추가 | 이미 `@Roles("admin")` 가드 적용됨 |
| **프론트** | `/admin/feature-flags/page.tsx` — 목록+토글 | 어드민 패널 확장 |

## Proposed Changes

#### [NEW] `apps/api/src/infra/schema/feature-flags.ts`

```typescript
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

#### [MODIFY] `apps/api/src/infra/schema/local.ts`
`feature-flags` export 추가.

#### [MODIFY] `apps/api/src/infra/schema/index.ts`
`featureFlags`, `FeatureFlagRow`, `FeatureFlagInsert` export 추가 + `appSchema` 포함.

#### [NEW] `apps/api/drizzle/0020_feature_flags.sql` (자동 생성)
`pnpm --filter @apps/api db:generate` 로 생성.

#### [NEW] `apps/api/src/admin/feature-flag.service.ts`

```typescript
// list(): FeatureFlagRow[]
// isEnabled(key: string): Promise<boolean>
// create(key: string, description?: string): Promise<FeatureFlagRow>
// update(key: string, enabled: boolean): Promise<FeatureFlagRow>
// remove(key: string): Promise<void>
```

DATABASE 주입, RLS 우회 불필요 (feature_flags는 테넌트 스코프 없음 — 전역 테이블).

#### [NEW] `apps/api/src/admin/feature-flag.decorator.ts`

```typescript
export const FEATURE_FLAG_KEY = "admin:feature_flag";
export const FeatureFlag = (key: string) => SetMetadata(FEATURE_FLAG_KEY, key);
```

#### [NEW] `apps/api/src/admin/feature-flag.guard.ts`

```typescript
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  // Reflector로 FEATURE_FLAG_KEY 읽기
  // FeatureFlagService.isEnabled(key) → false면 ForbiddenException
}
```

#### [MODIFY] `apps/api/src/admin/admin.controller.ts`

기존 `@Roles("admin")` 컨트롤러에 추가:
- `GET /admin/feature-flags`
- `POST /admin/feature-flags` — body: `{ key, description? }`
- `PATCH /admin/feature-flags/:key` — body: `{ enabled }`
- `DELETE /admin/feature-flags/:key`

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
`FeatureFlagService`, `FeatureFlagGuard` provider 추가.

#### [MODIFY] `apps/api/src/auth/provider-auth.module.ts`
동일.

#### [NEW] `apps/api/src/admin/feature-flag.service.test.ts`
단위 테스트 (Drizzle mock): list, isEnabled(true/false), create, update, remove.

#### [NEW] `apps/api/src/admin/feature-flag.controller.e2e.test.ts`
컨트롤러 통합 테스트: CRUD + guard 동작 (flag 꺼진 엔드포인트 → 403).

#### [NEW] `apps/web/src/features/admin/FeatureFlagTable.tsx`

플래그 목록 + 토글 버튼 + 생성 폼 (인라인).

#### [NEW] `apps/web/src/features/admin/FeatureFlagTable.test.tsx`

#### [NEW] `apps/web/src/app/(console)/admin/feature-flags/page.tsx`

## 검증 계획

```bash
pnpm --filter @apps/api test -- --testPathPattern="feature-flag"
pnpm --filter @apps/web test -- --testPathPattern="FeatureFlag"
pnpm turbo typecheck
```

수동 검증:
1. `POST /admin/feature-flags` `{ key: "test", enabled: false }` → 201
2. `@FeatureFlag("test")` 엔드포인트 접근 → 403
3. `PATCH /admin/feature-flags/test` `{ enabled: true }` → 200
4. 동일 엔드포인트 재접근 → 200

## ADR 후보

- [ ] 없음 (전역 on/off 단순 구조, 결정 자체는 이미 out-of-scope 명시)

## ✅ Definition of Done

- [ ] `feature_flags` 테이블 마이그레이션 PASS (CI DB migrate)
- [ ] `FeatureFlagGuard` — 꺼진 플래그 → 403 e2e 확인
- [ ] CRUD API 단위 + e2e 테스트 PASS
- [ ] 프론트엔드 플래그 목록 + 토글 동작
- [ ] `pnpm turbo test` 전체 PASS
- [ ] `walkthrough.md`, `pr_description.md` 작성 후 ship
