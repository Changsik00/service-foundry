# fix(spec-17-07): 테넌트 격리 실효화 (RLS 강제 배선)

## 📋 Summary

### 배경 및 목적

phase-17 spine 은 테넌트 격리를 Postgres RLS 로 보장하도록 설계됐으나, ship 전 검증에서 **격리 체인이 완전히 끊겨 실효 격리가 0** 임을 실 DB 로 확인했다(임의 인증 사용자가 타 org 데이터 전체 접근 가능). 3중 결함:

1. `TenantContextInterceptor` 가 ALS 에 orgId 를 넣지만 **DB 에 주입하는 소비자가 없음**.
2. SET 을 발행하는 `withTenantContext` 가 **사장**(어디서도 호출 안 됨) → RLS context 항상 NULL → 전체 허용.
3. 앱이 `postgres` **슈퍼유저**로 접속 → RLS 우회(FORCE 도 슈퍼유저엔 무력, 실측).

본 spec 은 이 체인을 실제로 연결하여 **읽기 격리(phase-17 성공 기준 3)** 를 닫는다.

### 주요 변경 사항
- [x] 비-슈퍼유저 런타임 role `app_runtime` 분리 — RLS 가 실제 적용되는 주체 (마이그레이션은 owner 유지)
- [x] 요청 스코프 트랜잭션 + `set_config('app.current_org', …, true)` + `DATABASE` ALS 라우팅 proxy → 서비스 코드 무변경으로 모든 쿼리에 RLS 컨텍스트 자동 적용
- [x] 실 DB 2-org 격리 e2e (DB-level 차단 증명) + 0011 정책 빈문자열 GUC 버그 수정(NULLIF)
- [x] production 부팅 가드(런타임이 슈퍼유저면 거부) + CI/compose role 프로비저닝

### Phase 컨텍스트
- **Phase**: `phase-17` (멀티테넌시 spine)
- **본 SPEC 의 역할**: spine 의 핵심 불변식(테넌트 격리)을 실효화 — phase-18~21 이 이 격리를 신뢰하고 쌓이므로 ship 전 필수.

## 🎯 Key Review Points

1. **슈퍼유저 우회 / role 분리** (`0012_app_runtime_role.sql`, `settings.ts`, `verify.yml`): 격리는 비-슈퍼유저 role 로만 강제됨. 마이그레이션=owner / 런타임=app_runtime 분리.
2. **ALS tx proxy** (`tenant.ts` `createTenantDb`, `nestjs-database` `wrapDb`, `tenant.interceptor.ts`): 호출 시점 ALS 상태로 tx/pool 동적 라우팅. 인증 요청만 tx 로 감싼다(무-org 요청은 기존 경로).
3. **범위 한정**: 읽기 격리까지. 쓰기 강제(`WITH CHECK`)는 정당한 cross-org 쓰기와 충돌 → 정책에 `WITH CHECK(true)` 명시 + 후속 spec 으로 분리.
4. **0011 GUC 빈문자열 버그**: reset 값이 NULL 아닌 `''` → 캐스팅 에러. `NULLIF(...,'')` 로 수정.

## 🧪 Verification

### 자동 테스트 (실 PG 필요)
```bash
DATABASE_URL=postgres://app_runtime:test@localhost:5434/test \
DATABASE_MIGRATE_URL=postgres://postgres:test@localhost:5434/test \
pnpm turbo run knip depcruise lint typecheck test build
```

**결과 요약** (fresh DB):
- ✅ 전체 게이트 **137 tasks successful**
- ✅ `@apps/api` 137 tests / 22 files (격리 e2e 포함)

### 수동 검증 시나리오
1. **Before**: 슈퍼유저 + context=A → org B row 노출(격리 0) → Red 고정
2. **After**: app_runtime + context=A → org B **차단**, context=NULL → 전체 허용(회귀 0)
3. **role 전환 회귀**: app_runtime 으로 전체 137 GREEN

## 📦 Files Changed

### 🆕 New Files
- `apps/api/drizzle/0012_app_runtime_role.sql`: app_runtime role + GRANT + 정책 재생성(NULLIF, WITH CHECK)
- `apps/api/src/infra/tenant-isolation.e2e.test.ts`: 실 DB 2-org 격리 검증
- `tooling/docker/initdb/01-app-runtime-role.sh`: 로컬 compose role 프로비저닝

### 🛠 Modified Files
- `apps/api/src/infra/tenant.ts`: `createTenantDb` proxy + `tx` 컨텍스트 (사장 `withTenantContext` 제거)
- `apps/api/src/infra/tenant.interceptor.ts`: 요청 tx + set_config 발행
- `packages/nestjs/database/src/index.ts`: `forRoot` `wrapDb` 훅 + factory 값 re-export
- `apps/api/src/app.module.ts`: ALS proxy 배선 + 테스트 풀 축소
- `apps/api/src/settings.ts` / `drizzle.config.ts`: 이중 connection + 슈퍼유저 가드
- `.github/workflows/verify.yml` / `tooling/docker/compose.yaml` / `env.example`: role 프로비저닝
- `turbo.json`: test 태스크에 DB URL env 선언
- 테스트: `tenant.test.ts` / `tenant.interceptor.test.ts` / `settings.test.ts`

**Total**: 22 files changed (+773 / -130), 8 commits

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과
- [x] 통합 테스트(격리 e2e) 통과 + 기존 e2e 무회귀
- [x] `walkthrough.md` / `pr_description.md` ship commit
- [x] lint / type check 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-17.md` (성공 기준 3 / 시나리오 3)
- Walkthrough: `specs/spec-17-07-tenant-isolation-enforcement/walkthrough.md`
- 관련 ADR: `docs/adr/0022-multi-tenancy-strategy.md` · 후속 ADR `tenant-isolation-runtime-role-and-als-tx`(phase ship 시)
- **PR base**: `phase-17` (base 브랜치 모드)
