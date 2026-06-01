---
type: reference
aliases: ["@repo/backend-lifecycle", "그레이스풀 셧다운"]
tags: [service-foundry, reference, backend, lifecycle]
---

# @repo/backend-lifecycle — Readiness 플래그 + Graceful Shutdown 드레인

> 💡 **한 줄 요약**: readiness 토글과 등록된 정리 훅을 순서대로 실행하는 graceful shutdown 오케스트레이터. idempotent하고 타임아웃 보호를 갖는다.
> **위치**: `packages/backend/lifecycle` · **상위**: [[architecture]]

## 책임 (Responsibility)

`createLifecycle`로 생성된 `Lifecycle` 인스턴스는 로드 밸런서 트래픽 차단(`setReady(false)`)을 shutdown보다 먼저 수행하고, `onShutdown` 등록 훅을 순서대로 실행한다. 훅 실패는 종료를 막지 않는다(best-effort drain). `shutdown`은 idempotent하여 중복 호출에 안전하다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createLifecycle` | fn | `Lifecycle` 인스턴스 팩토리 |
| `Lifecycle` | type | readiness + shutdown 관리 포트 |
| `ShutdownOptions` | type | 타임아웃 옵션 타입 |
| `CreateLifecycleOptions` | type | 초기 ready 상태 옵션 타입 |

## 의존

- 내부: 없음
- 외부: 없음

## 사용 예

```ts
import { createLifecycle } from "@repo/backend-lifecycle";

const lifecycle = createLifecycle({ ready: true });
lifecycle.onShutdown(async () => { await db.pool.end(); });
lifecycle.onShutdown(async () => { await redis.quit(); });

process.on("SIGTERM", () => lifecycle.shutdown({ timeoutMs: 10_000 }));
app.get("/health/ready", (_, res) => {
  lifecycle.isReady() ? res.sendStatus(200) : res.sendStatus(503);
});
```

## 연결된 개념

- [[explainers/backend/graceful-shutdown-lifecycle]] — readiness ≠ liveness 구분 및 드레인 순서
- [[backend-database]] — shutdown 훅 등록 대상 예시
- [[backend-queue]] — 워커 종료 훅 등록 예시

> 소스: spec-12-04 · `packages/backend/lifecycle/src/`
