refactor(spec-24-05): extract RLS tenant infra into backend/nestjs packages

## 📋 Summary

### 배경 및 목적
phase-23 감사 §E1. RLS 테넌트 인프라(`apps/api/src/infra/tenant.*`)가 앱-로컬이라 worker 등 타 앱이 재사용 불가, core 가 어댑터 pkg(`@repo/nestjs-database`)를 타입 의존(레이어 역전). ADR-0015/0016 경계로 2 패키지 분리.

### 주요 변경 사항
- [x] **`@repo/backend-tenant`** (core) 신규 — `TenantAls`/`createTenantDb`/`runWithSystemTenant`/`TenantContext`/`TENANT_ALS`. `NodePgDatabase` 는 `drizzle-orm/node-postgres` 직접. framework 비의존.
- [x] **`@repo/nestjs-tenant`** (adapter) 신규 — `TenantContextInterceptor`+`TenantModule`+`tenantAls`. 요청 user 타입 인라인(nestjs-auth 비의존).
- [x] apps/api 재배선(app.module + 4 서비스 + 3 테스트) + `infra/tenant.*` 5 파일 삭제.

### Phase 컨텍스트
- **Phase**: `phase-24` (E1). worker 재사용은 패키지 경계로 *가능케만* 함(배선은 Out of Scope).

## 🎯 Key Review Points

1. **격리 보존(보안 핵심)**: 실 HTTP 격리 e2e(spec-17-08) **6/6 PASS** — 이관 후 RLS 테넌트 격리 회귀 0.
2. **레이어 경계**: core 는 drizzle 만 의존(framework-agnostic), adapter 가 NestJS/nestjs-database 의존.
3. **순수 이관**: 로직 무변경, import 경로만 교체 + 파일 위치 이동.

## 🧪 Verification

```bash
turbo run lint typecheck test    # 로컬 5434 DB
npx vitest run tenant-isolation  # 격리 e2e
```
**결과**: ✅ 148/148 task. backend-tenant 6 + nestjs-tenant 2 + apps/api 237 단위 + e2e, 격리 6/6. 회귀 0.

## 📦 Files Changed

### 🆕 New
- `packages/backend/tenant/**` (core 패키지)
- `packages/nestjs/tenant/**` (adapter 패키지)

### 🛠 Modified
- `apps/api/src/app.module.ts` (import 교체)
- `apps/api/src/auth/{org-list,org-invite,provider-org-switch}.service.ts` + `admin/admin.service.ts` + 3 테스트 (import 경로)
- `apps/api/package.json` (두 패키지 deps 추가)

### 🗑 Deleted
- `apps/api/src/infra/tenant.ts` / `tenant.interceptor.ts` / `tenant.module.ts` + 두 테스트 (패키지로 이동)

## ✅ Definition of Done

- [x] backend-tenant + nestjs-tenant 생성, 테스트 이관 PASS
- [x] apps/api 재배선, infra/tenant.* 삭제
- [x] 격리 e2e + 전체 회귀 0, lint/typecheck PASS
- [x] walkthrough / pr_description ship commit

## 🔗 관련 자료
- ADR-0015/0016 (패키지/어댑터 경계), ADR-0024 (tenant isolation)
- Phase: `backlog/phase-24.md`
