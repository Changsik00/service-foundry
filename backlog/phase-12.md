# phase-12: Service Foundations I · Runtime

> "어떤 서비스에도 들어가는 런타임 공통 기반" (Tier 1). notification 포트 · job queue/worker · caching · graceful shutdown.
> 보일러플레이트 품질·완성도 트랙 (2026-05-30 신설).

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-12` |
| **상태** | In Progress |
| **시작일** | 2026-05-31 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-12-runtime` |

## 🎯 배경 및 목표

### 현재 상황
phase-11 까지로 관측(trace/metric/dashboard) + 생성기가 갖춰졌으나, 거의 모든 실서비스가 쓰는 런타임 기반이 비어 있다: (1) 이메일/알림 전송 수단 부재(→ password-reset/email-verify 가 dev console 로깅 stub, spec-x 핫픽스의 임시 상태), (2) async 작업 큐/worker 부재, (3) 캐싱 추상화 부재, (4) graceful shutdown 부재.

### 목표 (Goal)
notification 포트(어댑터 교체식) + job queue/worker + caching + graceful shutdown 을 core 패키지 + apps 배선으로 제공해, 새 서비스가 이들을 즉시 활용.

### 성공 기준 (Success Criteria) — 정량 우선
1. `@repo/backend-notification` 포트 + dev 어댑터 — password-reset/email-verify 가 console stub 대신 포트로 전송(dev 어댑터는 로그, prod 어댑터는 실제 전송 가능 구조). 단위 테스트.
2. `apps/worker` 부트 + job queue 추상화 — enqueue→consume round-trip 통합 테스트.
3. `@repo/backend-cache` — cache-aside(get-or-set) + TTL, 단위 + (Redis) 통합.
4. graceful shutdown — SIGTERM 시 in-flight drain + readiness=false 전환, liveness 와 분리.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-12-01` | notification-port | P? | Merged | `specs/spec-12-01-notification-port/` |
| `spec-12-02` | queue-worker | P? | Merged | `specs/spec-12-02-queue-worker/` |
| `spec-12-03` | caching | P? | Merged | `specs/spec-12-03-caching/` |
| `spec-12-04` | graceful-shutdown | P? | Merged | `specs/spec-12-04-graceful-shutdown/` |
<!-- sdd:specs:end -->

### spec-12-01 — notification-port

- **요점**: `@repo/backend-notification` — 이메일/알림 포트 인터페이스 + dev(로그) 어댑터 (+ Resend/SES 어댑터는 옵션/후속). password-reset/email-verify 가 포트로 전송.
- **방향성**: core 포트(framework-agnostic) + apps/api 배선. spec-x 토큰 로깅을 포트 dev 어댑터로 대체(여전히 dev 가시성 유지, prod 는 실제 전송 경로).
- **연관 모듈**: `packages/backend/notification/` + `apps/api/src/auth/*`

### spec-12-02 — job-queue-worker

- **요점**: `apps/worker` + 큐 추상화(enqueue/consumer). 기술: pg-boss(postgres 재사용) 또는 BullMQ(redis) — 진입 시 결정.
- **연관 모듈**: `apps/worker/` + `packages/backend/queue/`

### spec-12-03 — caching

- **요점**: `@repo/backend-cache` — cache-aside(get-or-set) + TTL, Redis 어댑터 + in-memory(테스트).
- **연관 모듈**: `packages/backend/cache/`

### spec-12-04 — graceful-shutdown

- **요점**: SIGTERM drain + readiness≠liveness. apps/api lifecycle 훅.
- **연관 모듈**: `packages/backend/lifecycle/`(또는 nestjs 어댑터) + `apps/api`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| queue 기술 | pg-boss / BullMQ | spec-12-02 진입 시 | postgres 재사용 vs redis 성숙도 |
| notification provider | Resend / SES / dev only | spec-12-01 진입 시 | dev 우선, prod 어댑터는 인터페이스 뒤 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: notification 포트 전송
- **Given**: spec-12-01 머지.
- **When**: password-reset 요청 → notification 포트(dev 어댑터) 호출.
- **Then**: 토큰이 평문 로그 아닌 포트 경로로 전달 + 어댑터 호출 검증.
- **연관 SPEC**: spec-12-01

### 시나리오 2: queue round-trip
- **Given**: spec-12-02 머지.
- **When**: enqueue → worker consume.
- **Then**: 작업 1회 처리 확인.
- **연관 SPEC**: spec-12-02

## 🔗 의존성
- **선행 phase**: phase-10 (docker: postgres/redis), phase-11 (observability).
- **외부 시스템**: postgres / redis (compose).
- **연관 ADR**: ADR-0015 (core/adapter).

## 📝 위험 요소 및 완화
| 위험 | 영향 | 완화책 |
|---|---|---|
| notification prod 어댑터 미검증 | prod 전송 불확실 | dev 어댑터 + 인터페이스 우선, prod 어댑터는 후속 옵션 |
| queue 기술 선택 번복 | 재작업 | 큐 추상화로 어댑터 교체 가능하게 |

## 🏁 Phase Done 조건
- [ ] 모든 SPEC 이 `phase-12-runtime` → main merge
- [ ] 통합 시나리오 PASS
- [ ] 성공 기준 측정 결과 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
