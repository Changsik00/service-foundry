# Implementation Plan: spec-12-04

## 📋 Branch Strategy
- 신규 브랜치: `spec-12-04-graceful-shutdown` (from `phase-12-runtime`)
- base 모드: PR target = `phase-12-runtime`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] lifecycle 코어(readiness+hook+timeout)는 core 패키지, NestJS 배선은 apps/api.
> - [ ] readiness=false 가 정리보다 먼저 (LB 트래픽 차단 우선).

> [!WARNING]
> - [ ] SIGTERM/process.exit 경로는 단위 테스트 어려움 → lifecycle 코어 + 컨트롤러로 검증, 시그널 wiring 은 thin.
> - [ ] backend tsconfig `types:["node"]` 보정(생성기 갭).

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| lifecycle | `createLifecycle()` (readiness + onShutdown + shutdown timeout, idempotent) | core, 단위 테스트 |
| 헬스 | `/health/live`(항상) + `/health/ready`(readiness) | k8s probe 분리 |
| wiring | apps/api LIFECYCLE provider + SIGTERM → shutdown(app.close) | graceful drain |
| 테스트 | 단위(lifecycle) + health controller | 시그널/exit 제외 |

## 📂 Proposed Changes

### @repo/backend-lifecycle (신규, 생성기 scaffold + tsconfig types:node)
- [NEW] `src/index.ts` — `Lifecycle` + `createLifecycle()` (+ `.test.ts`: readiness/hook/idempotent/timeout)

### apps/api
- [NEW] `src/lifecycle/lifecycle.provider.ts` — LIFECYCLE 토큰 + provider(createLifecycle), @Global module
- [MODIFY] `src/health/health.controller.ts` — `/health/live`, `/health/ready`(503 분기) 추가
- [MODIFY] `src/main.ts` — lifecycle 에 app.close 훅 등록 + SIGTERM/SIGINT → lifecycle.shutdown → exit
- [MODIFY] `src/app.module.ts` — LifecycleModule 등록
- [MODIFY] health controller 테스트 — ready/live + lifecycle mock

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-lifecycle test
pnpm --filter @apps/api exec vitest run src/health/health.controller.test.ts
```
lifecycle: setReady/isReady, onShutdown 실행, shutdown idempotent, 타임아웃 resolve. health: ready=200/not-ready=503, live=200.

### 정적
```bash
pnpm --filter @apps/api typecheck
```

### 수동
1. apps/api 부트 → `/health/ready` 200 → SIGTERM → readiness=false(/ready 503) → 정리 후 종료.

## 🔁 Rollback
- 신규 패키지 + apps/api 배선. 제거로 롤백. 기존 `/health` 유지.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
