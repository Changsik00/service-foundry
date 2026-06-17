# spec-x-dev-rls-app-runtime: dev·web-e2e 런타임을 app_runtime role 로 전환 (RLS 활성)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-dev-rls-app-runtime` |
| **Branch** | `spec-x-dev-rls-app-runtime` |
| **상태** | Planning |
| **타입** | fix |
| **작성일** | 2026-06-17 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

RLS 테넌트 격리(spec-17-07)는 **비-슈퍼유저 `app_runtime` role** 로 접속할 때만 적용된다(슈퍼유저는 RLS 우회). 그런데:
- **로컬 dev**: `env.sample:23` `DATABASE_URL=postgresql://postgres:postgres@...` → **superuser** 런타임 → RLS 통째 비활성.
- **web e2e**(`.github/workflows/e2e.yml`): migrate·runtime 모두 `postgres` superuser → RLS 비활성.
- `apps/web/e2e/org.spec.ts:46` 주석: *"dev/CI 의 DATABASE_URL 이 superuser 라 RLS 미적용 — 타 org 행도 보일 수 있음"* (이슈 명시적 인지).

반면 **api e2e**(`verify.yml`)는 이미 올바름: 런타임 `app_runtime` + 마이그레이션 `postgres` 분리 + role 사전 프로비저닝. **본보기가 이미 있다.**

### 문제점

dev·web 화면 개발/e2e 가 superuser 로 돌아 RLS가 꺼져 있어, **격리 버그(타 org 데이터 노출)를 개발 중에 못 잡는다**. 운영(k8s, spec-22)은 app_runtime 인데 dev 만 superuser라 환경 불일치 + defense-in-depth 공백.

### 해결 방안

dev·web-e2e 의 **런타임 접속을 `app_runtime` 로 전환**(마이그레이션만 superuser 유지)해 `verify.yml`/k8s 와 동일한 RLS 활성 경로로 맞춘다. compose initdb 가 이미 app_runtime role 을 만들고, migration 0012 가 GRANT 를 적용하므로 배선은 env/CI 만 조정하면 된다.

## 요구사항

1. **dev (`env.sample`)**: `DATABASE_URL` → `app_runtime`, `DATABASE_MIGRATE_URL`(superuser) 추가 + 의도 주석.
2. **web e2e (`e2e.yml`)**: app_runtime role 사전 프로비저닝 + `DATABASE_MIGRATE_URL`(superuser, migrate) / `DATABASE_URL`(app_runtime, runtime) 분리 (verify.yml 패턴 미러).
3. **org.spec.ts**: stale 주석 갱신(RLS 적용됨). 가능하면 격리 단언 강화(타 org 행 비노출) — 단, 기존 시나리오 깨지지 않는 선.
4. 회귀 없음: web e2e 가 app_runtime 로도 **자기 org 시나리오는 그대로 통과**(앱이 RLS 하에서 정상 동작).

## Out of Scope

- RLS 정책 자체 변경 (이미 spec-17-07/08 에서 정의·검증).
- 운영 DB 풀 사이징 (별 Icebox 항목).
- compose 파일 변경 — 이미 app_runtime role 생성(initdb) + APP_RUNTIME_PASSWORD 제공하므로 무변경 예상(검증만).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **dev env** | DATABASE_URL=app_runtime + DATABASE_MIGRATE_URL=postgres | 런타임 RLS 적용, 마이그레이션은 owner 권한 필요 |
| **web e2e CI** | role 프로비저닝 + URL 분리 (verify.yml 미러) | 검증된 본보기 재사용, 일관성 |
| **검증** | PR 의 e2e CI | app_runtime 하에서 web e2e 통과 = RLS 활성 + 앱 정상 동시 입증 |

## Proposed Changes

#### [MODIFY] `env.sample`
```
DATABASE_URL=postgresql://app_runtime:app_runtime_dev@localhost:5432/service_foundry_dev   # 런타임=비-슈퍼유저(RLS 적용)
DATABASE_MIGRATE_URL=postgresql://postgres:postgres@localhost:5432/service_foundry_dev      # 마이그레이션=owner
```
+ 주석으로 "런타임 app_runtime / 마이그레이션 superuser" 의도 명시.

#### [MODIFY] `.github/workflows/e2e.yml`
- `Provision app_runtime role (login)` 스텝 추가 (verify.yml 동일).
- migrate 스텝: `DATABASE_MIGRATE_URL`(superuser) 사용.
- test:e2e 스텝: `DATABASE_URL`(app_runtime) 로 런타임 api 기동.

#### [MODIFY] `apps/web/e2e/org.spec.ts`
- `:46` stale 주석 갱신 (RLS 적용됨). 가능 시 타 org 비노출 단언 보강.

## 검증 계획

```bash
# 로컬: compose 기동 → app_runtime 로 dev 서버 동작 확인 (선택)
# 핵심 검증: PR 의 e2e CI — app_runtime 런타임으로 web e2e 통과
```

수동 검증 시나리오:
1. e2e CI: app_runtime role 프로비저닝 → migrate(superuser) → api(app_runtime) 기동 → web e2e PASS
2. (선택) 로컬 dev: `DATABASE_URL=app_runtime` 로 api 기동 + 화면 정상

## ✅ Definition of Done

- [ ] env.sample dev 런타임 app_runtime 전환 + MIGRATE_URL 분리
- [ ] e2e.yml app_runtime role 프로비저닝 + URL 분리
- [ ] org.spec.ts stale 주석 갱신
- [ ] PR e2e CI 그린 (app_runtime 하에서 web e2e 통과)
- [ ] `spec-x-dev-rls-app-runtime` 브랜치 push + PR
