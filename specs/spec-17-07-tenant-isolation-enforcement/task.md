# Task List: spec-17-07

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-17.md SPEC 표 갱신 + 상태 정정)
- [x] 사용자 Plan Accept

---

## Task 1: 격리 e2e (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-17-07-tenant-isolation-enforcement` (시작점 `phase-17`)
- [x] Commit: 없음 (브랜치 생성만)

### 1-2. 격리 e2e 작성 (Red)
- [x] `apps/api/src/infra/tenant-isolation.e2e.test.ts`: 2-org 시드(owner) + 런타임 접속 + context 전환 SELECT 격리 케이스 (failed_logins 사용 — FK 없음)
- [x] 실행 → **Fail 확인**(superuser RLS 우회 → org B row 노출)
- [x] Commit: `test(spec-17-07): add failing real-PG tenant isolation e2e`

---

## Task 2: 런타임 DB role 분리 + RLS 적용 보장

### 2-1. role 마이그레이션
- [x] `apps/api/drizzle/0012_app_runtime_role.sql` + `_journal.json` 등록: `app_runtime` role + GRANT + default privileges. 정책 재생성(WITH CHECK true + NULLIF 빈문자열 가드)
- [x] owner 커넥션으로 migrate 적용 확인 (fresh DB 전체 마이그레이션 GREEN)
- [x] Commit: `feat(spec-17-07): add non-superuser app_runtime role + RLS WITH CHECK migration`

### 2-2. 이중 connection string 배선
- [x] `settings.ts` + `drizzle.config.ts`: `DATABASE_MIGRATE_URL`(owner) 추가, 런타임 `DATABASE_URL`(app_runtime). production 슈퍼유저 가드
- [x] 단위 테스트(settings) 업데이트 + 가드 케이스 3개 → Pass
- [x] Commit: `feat(spec-17-07): split migrate(owner) vs runtime(app_runtime) connections`

### 2-3. CI / compose role 프로비저닝
- [x] `verify.yml`: `DATABASE_URL`/`DATABASE_MIGRATE_URL` 분리 + role 생성 step
- [x] `compose.yaml` + `initdb/01-app-runtime-role.sh`: `app_runtime` 생성 (검증 완료)
- [x] Commit: `ci(spec-17-07): provision app_runtime role in CI + local compose`

---

## Task 3: ALS→DB 런타임 배선 (TDD Green)

### 3-1. DATABASE proxy + ALS tx
- [x] `tenant.ts`: `TenantContext` 에 `tx` 추가 + `createTenantDb` proxy. nestjs-database `forRoot` 에 `wrapDb` 훅. app.module 배선
- [x] proxy 단위 테스트(ALS tx 있으면 tx, 없으면 pool) 4개 → Pass
- [x] 사장 `withTenantContext` 제거(3-3 흡수) — proxy/interceptor 로 대체
- [x] Commit: `feat(spec-17-07): route DATABASE queries through ALS-bound tx proxy`

### 3-2. interceptor tx 배선
- [x] `tenant.interceptor.ts`: orgId 있으면 tx 로 감싸 `set_config(...,true)` 발행 + `als.run({orgId, tx})`
- [x] interceptor 단위 테스트 재작성(핸들러가 본 ALS 컨텍스트 검증) → Pass
- [x] **격리 e2e Green 전환 확인** + 풀 스위트 5회 안정(커넥션 고갈/IP 오염 회귀 해소)
- [x] Commit: `feat(spec-17-07): wire per-request SET app.current_org in tenant interceptor`

### 3-3. dead code 정리
- [x] `withTenantContext` 제거 완료(3-1 흡수). knip 게이트로 확인.

---

## Task N: Ship (필수)

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

### 🚦 Pre-Push Quality Gate (push 전 필수)

- [x] **코드 품질 점검**: lint / typecheck GREEN
- [x] **전체 테스트**: `pnpm turbo run knip depcruise lint typecheck test build` → **137 tasks PASS** (fresh DB + app_runtime)
- [x] **통합 테스트**: 격리 e2e + 기존 e2e 전체 GREEN (137 tests)
- [x] phase.md 성공 기준 3 / 시나리오 3 충족 로그 확보 (walkthrough)

### 📝 산출물 작성

- [x] **walkthrough.md 작성** (격리 Before/After 증거 로그 포함)
- [x] **pr_description.md 작성** (템플릿 준수)
- [x] **Ship Commit**: `docs(spec-17-07): ship walkthrough and pr description`

### 🚀 Push & PR

- [x] **Push**: `git push -u origin spec-17-07-tenant-isolation-enforcement`
- [x] **PR 생성**: `gh pr create --base phase-17` (base = phase-17, **main 아님**)
- [x] **사용자 알림**: 푸시 완료 + PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (작업) + Ship |
| **예상 commit 수** | 8 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-07 |
