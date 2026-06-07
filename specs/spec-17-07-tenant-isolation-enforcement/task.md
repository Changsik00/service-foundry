# Task List: spec-17-07

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-17.md SPEC 표 갱신 + 상태 정정)
- [ ] 사용자 Plan Accept

---

## Task 1: 격리 e2e (TDD Red)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-17-07-tenant-isolation-enforcement` (시작점 `phase-17`)
- [ ] Commit: 없음 (브랜치 생성만)

### 1-2. 격리 e2e 작성 (Red)
- [ ] `apps/api/src/infra/tenant-isolation.e2e.test.ts`: 2-org 시드(owner) + `app_runtime` 접속 + context 전환 SELECT 격리 케이스
- [ ] 실행 → **Fail 확인**(현재 미배선/슈퍼유저 → 타 org row 반환)
- [ ] Commit: `test(spec-17-07): add failing real-PG tenant isolation e2e`

---

## Task 2: 런타임 DB role 분리 + RLS 적용 보장

### 2-1. role 마이그레이션
- [ ] `apps/api/drizzle/0012_app_runtime_role.sql`(수동) + `_journal.json` 등록: `app_runtime` role + GRANT + default privileges. RLS ENABLE 누락 테이블 점검/보완
- [ ] owner 커넥션으로 migrate 적용 확인
- [ ] Commit: `feat(spec-17-07): add non-superuser app_runtime role + grants migration`

### 2-2. 이중 connection string 배선
- [ ] `apps/api/src/settings.ts` + `drizzle.config.ts`: `DATABASE_MIGRATE_URL`(owner) 추가, 런타임은 `DATABASE_URL`(app_runtime). (선택) 런타임 URL 슈퍼유저 경고 가드
- [ ] 단위 테스트(settings) 업데이트 → Pass
- [ ] Commit: `feat(spec-17-07): split migrate(owner) vs runtime(app_runtime) connections`

### 2-3. CI / compose role 프로비저닝
- [ ] `.github/workflows/verify.yml`: `DATABASE_URL`/`DATABASE_MIGRATE_URL` 분리 + role 생성 step
- [ ] `tooling/docker/compose.yaml`: init SQL 또는 위임으로 `app_runtime` 생성
- [ ] Commit: `ci(spec-17-07): provision app_runtime role in CI + local compose`

---

## Task 3: ALS→DB 런타임 배선 (TDD Green)

### 3-1. DATABASE proxy + ALS tx
- [ ] `tenant.ts`: `TenantContext` 에 `tx` 추가 + ALS tx 헬퍼. `DATABASE` proxy(ALS tx 우선 라우팅) 구현
- [ ] proxy 단위 테스트(ALS tx 있으면 tx, 없으면 pool) → Pass
- [ ] Commit: `feat(spec-17-07): route DATABASE queries through ALS-bound tx proxy`

### 3-2. interceptor tx 배선
- [ ] `tenant.interceptor.ts`: orgId 있으면 요청을 tx 로 감싸 `set_config('app.current_org', orgId, true)` 발행 + `als.run({orgId, tx})`. orgId 없으면 기존 경로
- [ ] interceptor 단위 테스트 갱신(set_config 발행 + tx 바인딩) → Pass
- [ ] **Task 1 의 격리 e2e 재실행 → Green 전환 확인**
- [ ] Commit: `feat(spec-17-07): wire per-request SET app.current_org in tenant interceptor`

### 3-3. dead code 정리
- [ ] 미사용 격리 잔재 제거/흡수, knip GREEN
- [ ] Commit: `refactor(spec-17-07): remove dead tenant-context helper after wiring`

---

## Task N: Ship (필수)

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

### 🚦 Pre-Push Quality Gate (push 전 필수)

- [ ] **코드 품질 점검**: `pnpm turbo run lint typecheck`
- [ ] **전체 테스트**: `pnpm turbo run knip depcruise test build` → 모두 PASS (실 PG + app_runtime)
- [ ] **통합 테스트**(Integration Test Required = yes): 격리 e2e + 기존 e2e 전체 GREEN
- [ ] phase.md 성공 기준 3 / 시나리오 3 충족 로그 확보

### 📝 산출물 작성

- [ ] **walkthrough.md 작성** (격리 Before/After 증거 로그 포함)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-17-07): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-17-07-tenant-isolation-enforcement`
- [ ] **PR 생성**: `gh pr create --base phase-17` (base = phase-17, **main 아님**)
- [ ] **사용자 알림**: 푸시 완료 + PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (작업) + Ship |
| **예상 commit 수** | 8 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-07 |
