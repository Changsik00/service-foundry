# phase-09: Apps + Admin Tools

> 본래 phase-04 (Apps) + Admin Tools. apps/api 확장 + apps/worker + apps/admin (또는 auth-admin 패키지) + apps/edge-api.
> 본 phase 종료 시 reference application 셋이 *완전 부트* + admin tool로 session/role/audit 관리 가능.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-09` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

- phase-03~08 완료 시 backend foundation + frontend foundation + 완전한 auth (Native JWT + OAuth + MFA + Passkey + Provider Adapters) 동작.
- 본 phase는 *조립 + admin*: apps/api에 비-auth 도메인 endpoint 추가 + apps/worker + apps/admin (session 강제 종료 / role 부여 / audit 조회 / Provider sync 상태).

### 목표 (Goal)

apps/api가 *완전한 reference backend*가 되고, apps/worker가 BullMQ 워커로 부트되며, apps/admin (또는 auth-admin) 패키지가 admin 기능 제공. apps/edge-api는 Hono 기반 *최소 데모*.

### 성공 기준 (Success Criteria) — 정량 우선

1. apps/api에 sample 도메인 endpoint(`UserProfile` CRUD 등) 추가 + JWT 인증 보호.
2. apps/worker 부트 + BullMQ sample job 처리.
3. apps/admin (또는 web-vite route) — session 검색 / 강제 종료 / role 부여 / audit log 조회 UI.
4. apps/edge-api — Hono `/health` 동작.
5. `docs/features/0001-login.md` vertical-slice 작성 (signup → signin → protected → admin force-revoke → reauth).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

### spec-09-01 — apps-api-extend

- **요점**: apps/api에 sample 도메인 endpoint (`UserProfile` CRUD) + auth-nestjs Guards 적용 + paginatedResponse 응답.
- **연관 모듈**: apps/api

### spec-09-02 — apps-worker

- **요점**: BullMQ 워커 + observability + database. sample job 1개로 부트 확인.
- **방향성**: api와 동일 settings/logger 사용.
- **연관 모듈**: apps/worker

### spec-09-03 — admin-tools (apps/admin or auth-admin)

- **요점**: session 검색 / 강제 종료 / role 부여 / audit log 조회 UI. Icebox 이슈("admin 별도 앱 vs web-vite route") 결정 결과 따름.
- **참조**: design note §Admin Tools.
- **연관 모듈**: `apps/admin` or `packages/auth-admin` (결정 따름)

### spec-09-04 — apps-edge-api

- **요점**: Hono 기반 edge / serverless 예제. Icebox 이슈("scope: /api 모방 / 다른 / CF Workers 전용") 결정 결과 따름.
- **연관 모듈**: apps/edge-api

### spec-09-05 — vertical-slice-doc

- **요점**: `docs/features/0001-login.md` — signup → signin → protected → admin force-revoke → reauth 시나리오 작성.
- **연관 모듈**: docs/features

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| apps/admin 분리 | 별도 앱 / web-vite route / `auth-admin` 패키지만 | 진입 시 결정 | UI/권한 분리 vs 코드 공유 trade-off + Provider sync 상태 표시 필요 |
| apps/edge-api scope | /api 모방 / 다른 / CF Workers 전용 | 진입 시 결정 | Hono의 차별화(edge 부트 속도) 데모 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: vertical-slice

- **Given**: 전 spec 머지됨.
- **When**: signup → signin → /users/me 호출 → admin이 force-revoke → 재인증 강제.
- **Then**: 모든 단계 예상 응답.

### 시나리오 2: worker job

- **Given**: spec-09-02 머지됨.
- **When**: API가 BullMQ로 sample job enqueue → worker 처리.
- **Then**: job DONE + observability trace 연결.

### 시나리오 3: admin force-revoke

- **Given**: spec-09-03 머지됨.
- **When**: admin이 특정 user의 모든 session 강제 종료.
- **Then**: 해당 user의 다음 protected route 호출 401 + SESSION_REVOKED 이벤트 발생.

## 🔗 의존성

- **선행 phase**: phase-04 + phase-06 + (선택) phase-07 + phase-08.
- **외부 시스템**: PostgreSQL, Redis (BullMQ).
- **연관 ADR**: 0003 / 0005 / 0006
- **연관 design note**: `docs/notes/auth-foundation-architecture.md`

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-09-01 ~ spec-09-05) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] `docs/features/0001-login.md` 작성
- [ ] 사용자 최종 승인
