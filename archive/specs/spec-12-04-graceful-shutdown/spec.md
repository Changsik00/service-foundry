# spec-12-04: Graceful Shutdown + Lifecycle (`@repo/backend-lifecycle`)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-12-04` |
| **Phase** | `phase-12` |
| **Branch** | `spec-12-04-graceful-shutdown` |
| **타입** | Feature |
| **Integration Test Required** | no (단위 + 컨트롤러 테스트) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
SIGTERM(배포/스케일다운) 시 in-flight 요청 드레인·정리 훅 실행이 없고, readiness 와 liveness 가 구분되지 않는다(현재 `/health` 단일). 배포 시 LB 가 종료 중인 인스턴스로 계속 라우팅할 수 있다.

### 문제점
- graceful shutdown 부재 → 종료 시 요청 유실/연결 누수 가능.
- readiness≠liveness 미구분 → k8s 등에서 트래픽 차단 타이밍 제어 불가.

### 해결 방안 (요약)
`@repo/backend-lifecycle`(core) 에 **lifecycle 매니저**(readiness 플래그 + shutdown 훅 + 타임아웃 드레인)를 제공. apps/api 가 `/health/live`(항상 200)·`/health/ready`(readiness 반영) 를 노출하고, SIGTERM 시 readiness=false → 정리 훅 실행 → 종료한다.

## 🎯 요구사항

### Functional Requirements
1. `createLifecycle()` — `isReady()`, `setReady(bool)`, `onShutdown(hook)`, `shutdown({timeoutMs?})`.
2. `shutdown`: readiness=false 전환 → 등록된 훅 순차 실행 → 완료/타임아웃 후 resolve. **idempotent**(중복 호출 시 훅 1회).
3. 훅이 멈춰도 `timeoutMs` 후 shutdown 이 resolve (행 방지).
4. apps/api: `/health/live`(항상 200) + `/health/ready`(ready=200, not-ready=503).
5. apps/api: SIGTERM/SIGINT → `lifecycle.shutdown` (readiness=false + app.close) → 종료.
6. 포트/매니저는 framework-agnostic (core). NestJS 배선은 앱에서.

### Non-Functional Requirements
1. lifecycle 로직(readiness/hook/timeout/idempotent)은 단위 테스트로 검증.
2. readiness=false 전환이 정리보다 **먼저** (LB 가 먼저 트래픽 차단).

## 🚫 Out of Scope
- k8s manifest(probe 설정) — phase-15(CI/CD) 또는 후속.
- 요청 in-flight 카운팅 기반 정밀 드레인 — 본 spec 은 readiness flip + 훅(app.close) 까지.
- nestjs-lifecycle 어댑터 패키지 — apps/api app-level 배선.

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (포트+앱 배선 — 12 패턴 연장)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-12.md` (§성공 기준 4)
- 직전 spec: spec-12-03 (caching)
- 관련 ADR: ADR-0015 (core 경계)

## ✅ Definition of Done
- [ ] `createLifecycle` 단위 테스트 PASS (readiness/hook/idempotent/timeout)
- [ ] apps/api `/health/live`·`/health/ready` + SIGTERM 배선 (controller 테스트)
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림
