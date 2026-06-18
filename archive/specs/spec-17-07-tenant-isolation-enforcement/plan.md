# Implementation Plan: spec-17-07

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-07-tenant-isolation-enforcement` (브랜치 이름 = spec 디렉토리 이름, `feature/` prefix 없음)
- 시작 지점: **`phase-17`** (base 브랜치 모드 — `main` 아님)
- PR base: **`phase-17`** (spec PR 은 phase 브랜치로 머지)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요 (User Review Required)

> 본 Plan 을 Accept 하기 전에 사용자가 명시적으로 확인해야 할 항목들.

> [!IMPORTANT]
> - [ ] **런타임 role 분리**: 앱은 비-슈퍼유저 `app_runtime` 로 접속, 마이그레이션은 `postgres`(owner) 유지. → `apps/api` 가 **두 개의 connection 환경변수**(`DATABASE_URL` = 런타임/app_runtime, `DATABASE_MIGRATE_URL` = owner/postgres)를 갖게 된다. (대안: 단일 URL 유지 시 슈퍼유저 우회로 격리 불가 — 채택 불가)
> - [ ] **격리 메커니즘 = 요청 스코프 트랜잭션 proxy**: orgId 있는 요청을 tx 로 감싸 `set_config('app.current_org', orgId, true)` 발행 + `DATABASE` 를 ALS-tx 우선 라우팅 proxy 로 교체. (대안: 커넥션 pin+RESET — 누수 위험·복잡도 higher, 비채택)
> - [ ] **읽기 격리로 범위 한정**: 본 spec 은 SELECT 격리(성공 기준 3)까지. 쓰기 강제(`WITH CHECK`)는 invite-accept/provision cross-org 쓰기와 충돌 → 후속 spec-17-08 로 분리.

> [!WARNING]
> - [ ] **동작 변경**: 인증된(org 보유) 요청이 이제 DB 트랜잭션 안에서 실행된다(요청 종료까지 커넥션 1개 점유). 미인증/무-org 요청은 기존 풀 경로 유지.
> - [ ] **인프라 변경**: `verify.yml`(CI) 와 로컬 `tooling/docker/compose.yaml` 에 `app_runtime` role 생성 + GRANT 가 추가된다. CI 서비스 컨테이너 초기화 SQL 또는 마이그레이션으로 role 을 만든다.
> - [ ] **운영 영향**: 배포 환경의 DB 프로비저닝에 `app_runtime` role + 비밀번호 + GRANT 가 필요(런북/시크릿). 본 spec 은 보일러플레이트 기본값까지만, 실 배포 시크릿은 운영 몫.

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트

```mermaid
sequenceDiagram
  participant C as Client
  participant I as TenantContextInterceptor
  participant A as TenantAls
  participant D as DATABASE(proxy)
  participant PG as Postgres(app_runtime)
  C->>I: 요청 (JWT → user.orgId)
  alt orgId 존재
    I->>D: db.transaction(tx => …)
    D->>PG: BEGIN
    I->>PG: SELECT set_config('app.current_org', orgId, true)
    I->>A: als.run({ tx }, () => next())
    Note over D,PG: 핸들러의 모든 db.* 쿼리 → ALS tx 로 라우팅 → RLS 적용
    I->>PG: COMMIT (응답 성공 시)
  else orgId 없음
    I->>A: als.run({ tx: null }, () => next())
    Note over D,PG: 기존 pool 경로, context=NULL → 퍼미시브
  end
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **DB role** | 런타임=`app_runtime`(비-슈퍼유저, 비-owner) / 마이그레이션=`postgres`(owner) | 슈퍼유저·owner 는 RLS 우회. 비-owner 비-슈퍼유저만 `ENABLE RLS` 로 격리됨 (FORCE 불필요) |
| **컨텍스트 주입** | 요청 스코프 tx + `set_config(…, true)`(tx-local) | 풀 오염 없음·자동 해제. `SET`(비-LOCAL)은 풀 커넥션에 잔존 → 누수 |
| **db 라우팅** | `DATABASE` 를 Proxy 로 교체: ALS 에 tx 있으면 tx, 없으면 pool db | 서비스 코드 무수정으로 "모든 쿼리 자동 적용"(결정 기록 부합) |
| **tx 진입 조건** | `user.orgId` 있을 때만 | blast radius 한정, 무-org 경로 회귀 차단 |
| **격리 증명** | `app_runtime` 커넥션 + 2-org 시드 + context 전환 SELECT e2e | 메커니즘 mock 아닌 실 DB row 차단 검증 |

### 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → `tenant-isolation-runtime-role-and-als-tx` (type: invariant). 머지 시점 작성.
- [ ] 없음

## 📂 Proposed Changes

### 1. 격리 e2e (TDD Red — 먼저)

#### [NEW] `apps/api/src/infra/tenant-isolation.e2e.test.ts`
- `app_runtime` role 로 직접 `pg.Pool` 접속(또는 앱 부팅 후 런타임 커넥션 사용).
- 시드(owner 커넥션으로): org A·B + 각 org 의 row(예: organizations, memberships).
- 케이스:
  1. `set_config('app.current_org', A)` → `SELECT … FROM organizations` 시 A 만 보임, B 안 보임. **(현재 실패 예상)**
  2. context=NULL → 전체 보임(퍼미시브 호환).
- 초기 실행 시 **Red**(현재 격리 미배선/슈퍼유저 → B 도 반환).

### 2. DB role 분리 + RLS 적용 보장

#### [NEW] `apps/api/drizzle/0012_app_runtime_role.sql` (수동, journal 등록)
- `CREATE ROLE app_runtime LOGIN PASSWORD '…'`(기본값, env override), `GRANT SELECT/INSERT/UPDATE/DELETE ON ALL TABLES … TO app_runtime`, `GRANT USAGE/SELECT ON ALL SEQUENCES …`, `ALTER DEFAULT PRIVILEGES …`.
- 기존 `0011_rls_policies.sql` 정책은 `app_runtime`(비-owner)에 그대로 적용됨(FORCE 불필요). 필요한 테이블 RLS ENABLE 누락분 점검.

#### [MODIFY] `apps/api/drizzle.config.ts` / `apps/api/src/settings.ts`
- `DATABASE_MIGRATE_URL`(owner) 추가. 마이그레이션은 이 URL, 런타임 부팅은 `DATABASE_URL`(app_runtime).
- production 가드: 런타임 URL 이 슈퍼유저/owner 면 경고 또는 거부(선택, 최소 경고).

#### [MODIFY] `tooling/docker/compose.yaml`, `.github/workflows/verify.yml`
- compose: postgres 초기화 시 `app_runtime` role 생성(init SQL 마운트 또는 마이그레이션 위임).
- verify.yml: `DATABASE_URL`(app_runtime) + `DATABASE_MIGRATE_URL`(postgres) 분리, migrate step 은 owner URL 사용.

### 3. ALS→DB 런타임 배선

#### [MODIFY] `apps/api/src/infra/tenant.ts`
- `TenantContext` 를 `{ orgId, tx? }` 로 확장. `withTenantContext` 를 interceptor 가 실제 사용하도록 정리(또는 흡수). ALS-tx 접근 헬퍼 추가.

#### [NEW/MODIFY] `DATABASE` provider proxy (`apps/api/src/infra/...` 또는 `packages/nestjs/database`)
- `db` 를 Proxy 로 감싸 ALS 에 tx 있으면 `tx`, 없으면 원본 pool db 로 위임. (`select/insert/update/delete/execute/query/transaction` 커버)
- 패키지 vs 앱-로컬 배치는 구현 시 결정(앱-로컬 우선 — 경계 단순).

#### [MODIFY] `apps/api/src/infra/tenant.interceptor.ts`
- orgId 있으면 `db.transaction(async tx => { set_config(…,true); return als.run({orgId, tx}, () => lastValueFrom(next.handle())) })` 패턴으로 요청을 tx 안에서 실행. orgId 없으면 기존 `als.run({orgId:null})`.

### 4. dead code 정리
- 미사용으로 남는 격리 헬퍼/`withTenantContext` 잔재 제거 또는 실배선. knip GREEN 유지.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
DATABASE_URL='postgres://app_runtime:test@localhost:5434/test' \
DATABASE_MIGRATE_URL='postgres://postgres:test@localhost:5434/test' \
pnpm --filter @apps/api test
```

### 통합 테스트 (Integration Test Required = yes)
```bash
# 격리 e2e 포함 (tenant-isolation.e2e.test.ts) — 실 PG + app_runtime role 필요
pnpm --filter @apps/api test
```

### 수동 검증 시나리오
1. `app_runtime` 로 접속 + `set_config('app.current_org', A,true)` → org B row SELECT 0건. 기대: 차단.
2. `postgres`(owner) 로 동일 시도 → 우회되어 B 보임(왜 role 분리가 필요한지 대조 증거).
3. 미인증 `GET /auth/csrf`·부트스트랩 → 정상(회귀 없음).
4. `POST /auth/signup` → 프로비저닝(무-org context) 정상 동작.

## 🔁 Rollback Plan

- 코드: 브랜치 revert. 배선은 interceptor·proxy·settings 로 국소화 → 되돌리면 기존(미배선) 동작 복귀.
- DB: `0012` 마이그레이션 down(= `DROP ROLE app_runtime` + GRANT 회수). 데이터 영향 없음(스키마/데이터 불변, role/권한만).
- 런타임 URL 을 owner 로 되돌리면 즉시 기존 동작(격리 없음)으로 복귀 가능.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
