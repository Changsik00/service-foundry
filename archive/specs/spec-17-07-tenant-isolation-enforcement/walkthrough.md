# Walkthrough: spec-17-07

> 테넌트 격리 실효화 — phase-17 spine 의 핵심 보장(성공 기준 3)을 실제로 닫는다.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 슈퍼유저 RLS 우회 | 단일 role / role 분리 | **비-슈퍼유저 `app_runtime` 분리** | 슈퍼유저·owner 는 ENABLE/FORCE 무관하게 RLS 우회(실측). 비-owner 비-슈퍼유저만 격리됨 |
| role 비밀번호 처리 | 마이그레이션 일체형 / 인프라 소유 / **하이브리드** | **하이브리드** (사용자 결정) | role+GRANT 는 마이그레이션(이식성), 비밀번호는 환경별 주입(VCS 노출 0) |
| 컨텍스트 주입 메커니즘 | 미들웨어 SET / 커넥션 pin / **요청 tx proxy** | **요청 스코프 tx + ALS proxy** | tx-local `set_config` 자동 해제(풀 오염 0) + 서비스 코드 무변경("모든 쿼리 자동 적용") |
| 쓰기 강제(WITH CHECK) | 본 spec 포함 / **후속 분리** | **후속(17-08 후보)** | invite-accept/provision 의 정당한 cross-org 쓰기와 충돌 → 읽기 격리(기준 3)에 집중 |
| 0011 정책 `IS NULL` 가드 | 유지 / **NULLIF** | **NULLIF(...,'')** | 커스텀 GUC reset 값이 NULL 이 아닌 `''` → 캐스팅 에러(실 결함). 빈문자열도 무컨텍스트 처리 |

### ADR 승격 가이드
- [x] ADR 승격 대상 있음 → 후보 `tenant-isolation-runtime-role-and-als-tx` (type: invariant). phase-17 결정 기록의 "커넥션 훅" 을 실제 메커니즘으로 확정. **phase ship 시점에 작성 예정** (cross-spec·long-lived).

## 💬 사용자 협의

- **주제**: app_runtime role 프로비저닝 / 비밀번호
  - **사용자 의견**: 하이브리드(권장) 선택
  - **합의**: 마이그레이션은 role(NOLOGIN)+GRANT 만, LOGIN 비밀번호는 환경별(CI/compose=dev, 운영=시크릿) 주입
- **주제**: ship 전 검증에서 격리 부재 발견 → 후속 처리 방식
  - **합의**: phase ship 보류, **spec-17-07 로 격리 배선 먼저** 후 phase ship (사용자 NO-GO 1번 선택)

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 + 통합 (Integration Test Required = yes)
- **명령**: `DATABASE_URL=<app_runtime> DATABASE_MIGRATE_URL=<owner> pnpm --filter @apps/api test`
- **결과**: ✅ Passed (137 tests / 22 files, fresh DB)
- **핵심**: `tenant-isolation.e2e.test.ts` (격리 DB-level), `tenant.test.ts`(proxy 4), `tenant.interceptor.test.ts`(2), `settings.test.ts`(가드 3)

#### 전체 게이트 (CI 조건 — fresh DB)
- **명령**: `pnpm turbo run knip depcruise lint typecheck test build`
- **결과**: ✅ **137 tasks successful** (knip/depcruise/lint/typecheck/test/build 전부 GREEN)

### 2. 수동 검증 (실 PG)

1. **Before(결함 재현)**: 런타임=`postgres`(슈퍼유저), context=org A → `SELECT` 시 org B row **노출** (격리 0). → Red 테스트로 고정.
2. **슈퍼유저 우회 실측**: `ENABLE` 및 `FORCE ROW LEVEL SECURITY` 둘 다 슈퍼유저는 우회(2 row 반환) 확인 → role 분리 불가피.
3. **After**: 런타임=`app_runtime`(비-슈퍼유저) + interceptor tx `set_config` → context=org A 에서 org B **차단**, context=NULL 은 전체 허용(회귀 0).
4. **role 전환 회귀 점검**: app_runtime 으로 전체 137 테스트 GREEN — GRANT 충분, 기존 흐름 무회귀.
5. **compose initdb 검증**: throwaway 컨테이너에서 `app_runtime` LOGIN 생성 확인.

## 🔍 발견 사항

- **0011 RLS 정책 잠재 버그**: 커스텀 GUC reset 값이 `''`(빈문자열) → `IS NULL` 가드 통과 못 해 `'' = uuid` 캐스팅 에러. 풀 커넥션 재사용 시 미인증 요청이 깨질 수 있는 실 결함. 0012 에서 `NULLIF` 로 수정.
- **요청-스코프 tx 의 커넥션 압력**: 인증 요청이 tx 로 커넥션을 점유 → 병렬 e2e 파일 × 풀 합산이 Postgres `max_connections` 를 압박(간헐 429/500). 테스트 풀 축소(3)로 해소. **운영 시사점**: 동시 인증 요청 수가 풀 크기에 제한 → 운영은 풀 상향 + 커넥션 풀러(pgbouncer tx 모드) 권장.
- **turbo env 누락**: `test` 태스크에 DB URL 미선언 시 turbo 가 미전달 → isolation 이 슈퍼유저로 떨어짐. `env` 선언으로 캐시 정합성까지 해결.
- 반복 실행 시 `lockouts`/`failed_logins` 상태 누적으로 rerun 이 깨질 수 있음(테스트 격리 특성, CI fresh DB 는 무관).

## 🚧 이월 항목

- **쓰기 경로 RLS 강제(WITH CHECK org_id 일치)** → `backlog/queue.md` 추가 (spec-17-08 후보). invite-accept/provision cross-org 쓰기 seam 설계 동반.
- **ADR `tenant-isolation-runtime-role-and-als-tx`** 작성 → phase-17 ship 시점.
- **운영 풀 사이징 / pgbouncer 가이드** → 인프라 phase(22) 후보.

## 🔗 관련 문서 (Related)

- 관련 spec: [[spec-17-03]] (퍼미시브 RLS 도입), [[spec-17-05]] (ALS/interceptor 도입 — 본 spec 이 완성)
- 관련 ADR: `docs/adr/0022-multi-tenancy-strategy.md`
- 관련 phase: `backlog/phase-17.md` 성공 기준 3 / 시나리오 3

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-07 |
| **최종 commit** | (ship 시 갱신) |
