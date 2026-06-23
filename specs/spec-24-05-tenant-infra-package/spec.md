# spec-24-05: RLS tenant infra 패키지 이관 (E1)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-24-05` |
| **Phase** | `phase-24` |
| **Branch** | `spec-24-05-tenant-infra-package` |
| **Base 브랜치** | `phase-24-refactor-hardening-2` |
| **상태** | Planning |
| **타입** | Refactor (아키텍처) |
| **작성일** | 2026-06-23 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

RLS 테넌트 인프라가 `apps/api/src/infra/` 에 앱-로컬로 존재한다:
- `tenant.ts` (58 LOC): `TenantContext`/`TenantAls`(ALS)/`createTenantDb`(쿼리 라우팅 Proxy)/`runWithSystemTenant`(시스템 컨텍스트 토글)/`TENANT_ALS`(DI 토큰). framework 비의존 로직.
- `tenant.interceptor.ts` (50): `TenantContextInterceptor` — NestJS, 요청을 tx 로 감싸 `SET LOCAL app.current_org` 발행.
- `tenant.module.ts` (18): `TenantModule`(@Global) + `tenantAls` 싱글톤.

소비처: app.module(interceptor/createTenantDb/module), org-list·org-invite·provider-org-switch·admin 서비스(`runWithSystemTenant`/`TENANT_ALS`).

### 문제점

- 재사용 가능한 인프라가 앱에 묶여 worker 등 다른 앱이 동일 RLS 격리를 재사용할 수 없다.
- core 로직(`tenant.ts`)이 `NodePgDatabase` 타입을 `@repo/nestjs-database`(어댑터 pkg) 경유로 import — 레이어 역전(ADR-0015 위반 소지).

### 해결 방안

ADR-0015/0016 경계로 2 패키지 분리:
- **`@repo/backend-tenant`** (core, framework-agnostic): `tenant.ts` 내용. `NodePgDatabase` 는 `drizzle-orm/node-postgres` 직접 import.
- **`@repo/nestjs-tenant`** (adapter): `TenantContextInterceptor` + `TenantModule`. core 의존. 요청 타입은 인라인(`{ user?: { orgId?: string|null } }`)으로 두어 nestjs-auth 의존 회피.

apps/api 는 두 패키지를 소비하고 `infra/tenant.*` 삭제. **격리 동작은 완전 보존** — spec-17-08 실 HTTP 격리 e2e 회귀 0.

## 요구사항

1. `@repo/backend-tenant` 신규 — core 로직 + 단위 테스트 이관, drizzle 직접 의존.
2. `@repo/nestjs-tenant` 신규 — interceptor/module + 테스트 이관, core 의존.
3. apps/api 의 모든 소비처가 신규 패키지에서 import, `infra/tenant.*` 삭제.
4. 멀티테넌트 격리 e2e(spec-17-08) + 전체 테스트 회귀 0, lint/typecheck PASS.

## Out of Scope

- worker 에 tenant 실제 배선 (worker 는 현재 tenant 미사용 — 패키지 경계로 *가능케만* 함).
- Drizzle 스키마 이관(E2) — spec-24-06.
- RLS 정책/SET LOCAL 동작 변경.

## 🛑 사용자 검토 필요

> [!WARNING]
> - [ ] 격리가 깨지면 테넌트 누수(보안). 이관 후 실 HTTP 격리 e2e 필수 — auto 모드 정지규칙(비가역/위험)에 해당하면 정지·보고.

## 핵심 전략

| 컴포넌트 | 위치 | deps |
|:---:|:---|:---|
| **backend-tenant** (core) | `packages/backend/tenant` | `drizzle-orm` |
| **nestjs-tenant** (adapter) | `packages/nestjs/tenant` | `@nestjs/common`, `@repo/backend-tenant`, `@repo/nestjs-database`, `rxjs`, `drizzle-orm` |
| apps/api | 소비 | 위 두 패키지 |

## Proposed Changes

#### [NEW] `packages/backend/tenant/` — package.json, tsconfig.json, vitest.config.ts, src/index.ts(tenant core), src/index.test.ts
#### [NEW] `packages/nestjs/tenant/` — package.json, tsconfig.json, vitest.config.ts, src/index.ts(interceptor+module), src/index.test.ts
#### [MODIFY] `apps/api/src/app.module.ts` — import 교체(backend-tenant: createTenantDb / nestjs-tenant: TenantContextInterceptor, TenantModule, tenantAls)
#### [MODIFY] org-list/org-invite/provider-org-switch/admin 서비스 + 테스트 — `runWithSystemTenant`/`TENANT_ALS`/`TenantAls` import 를 `@repo/backend-tenant` 로
#### [MODIFY] `apps/api/package.json` — `@repo/backend-tenant`, `@repo/nestjs-tenant` 추가
#### [DELETE] `apps/api/src/infra/tenant.ts`, `tenant.interceptor.ts`, `tenant.module.ts` + 그 테스트(패키지로 이동)

## 검증 계획

```bash
pnpm install            # 워크스페이스 링크
npx turbo run lint typecheck test
# 회귀(로컬 5434 DB): tenant-isolation.http.e2e + 전체 e2e (reference_local_e2e_db_recipe)
DATABASE_URL=... npx vitest run --root apps/api e2e.test
```

## 롤백 계획

- `git revert`. 패키지 신규+import 교체라 revert 로 원복. state/마이그레이션 없음.

## ADR 후보

- [x] 없음 (ADR-0015/0016 기존 경계 적용. 신규 결정 없음 — 결정 기록은 phase.md decision log)

## ✅ Definition of Done

- [ ] backend-tenant + nestjs-tenant 패키지 생성, 테스트 이관 PASS
- [ ] apps/api 소비처 import 교체, `infra/tenant.*` 삭제
- [ ] 격리 e2e(spec-17-08) + 전체 회귀 0, lint/typecheck PASS
- [ ] walkthrough/pr_description ship + 브랜치 push
