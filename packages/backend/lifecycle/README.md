# @repo/backend-lifecycle

> readiness 토글과 등록된 정리 훅을 순서대로 실행하는 graceful shutdown 오케스트레이터. idempotent하고 타임아웃 보호를 갖는다.

## 설치 / import
```ts
import { createLifecycle } from "@repo/backend-lifecycle";
```

## 핵심 API
- `createLifecycle(options)` — `Lifecycle` 인스턴스 팩토리 (`ready` 초기값 지정)
- `lifecycle.onShutdown(fn)` — 종료 훅 등록 (등록 순서대로 실행, best-effort)
- `lifecycle.shutdown({ timeoutMs })` — readiness 해제 후 훅 실행, idempotent
- `lifecycle.isReady()` — 헬스체크 엔드포인트용 readiness 상태 조회

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-lifecycle.md`](../../../docs/reference/packages/backend-lifecycle.md)
- 동작 원리: [`docs/explainers/backend/graceful-shutdown-lifecycle.md`](../../../docs/explainers/backend/graceful-shutdown-lifecycle.md)
