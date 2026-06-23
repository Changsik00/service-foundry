# Walkthrough: spec-24-05

> RLS tenant infra 를 앱-로컬에서 backend/nestjs 패키지로 이관 (E1). auto 모드 자율 수행.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 분할 경계 | 단일 패키지 / core+adapter 2 패키지 | **2 패키지** (backend-tenant + nestjs-tenant) | ADR-0015/0016 — core 는 framework-agnostic, adapter 가 NestJS 의존 |
| core 의 `NodePgDatabase` 출처 | `@repo/nestjs-database` 경유 / drizzle 직접 | **drizzle 직접** (`drizzle-orm/node-postgres`) | core 가 어댑터 pkg 의존 = 레이어 역전 회피 |
| adapter 의 요청 user 타입 | `@repo/nestjs-auth` AuthenticatedUser / 인라인 | **인라인** `{ orgId?: string\|null }` | interceptor 는 orgId 만 읽음 — nestjs-auth 의존 불필요 |
| worker 배선 | 포함 / 제외 | **제외** | worker 현재 tenant 미사용 — 패키지 경계로 *가능케만* (Out of Scope) |

## 💬 사용자 협의

- **주제**: 진행 모드
  - **합의**: `/hk-auto`(0.20.1 신규)로 auto 모드 전환 → E1 자율 수행. 정지규칙 전까지 비대면.

## 🧪 검증 결과

### 자동화 테스트
- **명령**: `turbo run lint typecheck test` (로컬 5434 DB)
- **결과**: ✅ 148/148 task. backend-tenant 6 + nestjs-tenant 2 단위, apps/api 237 단위 + e2e, lint/typecheck 회귀 0.

### 격리 회귀 (핵심)
- `npx vitest run tenant-isolation` (실 HTTP guard→interceptor→RLS) → **6/6 PASS**. 패키지 이관 후 테넌트 격리 보존 ([[feedback_isolation_test_real_path]]).

## 🔍 발견 사항

- core(`tenant.ts`)는 framework 비의존이라 이관이 깨끗했음 — `NodePgDatabase` import 만 drizzle 직접으로 교체.
- tenant 단위 테스트 8건(createTenantDb/runWithSystemTenant/interceptor)이 앱 → 패키지로 이동(apps/api 단위 243→237, 차액은 패키지에서 실행).
- 소비처는 core 만 의존(`runWithSystemTenant`/`TENANT_ALS`/`TenantAls`) — 4 서비스 + 3 테스트 import 경로만 교체.

## 🚧 이월 항목

- worker 에 tenant 실제 배선 — 필요 시 후속(패키지 경계는 확보됨).
- E2(Drizzle 스키마 이관) → spec-24-06.
