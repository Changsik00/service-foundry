---
type: reference
aliases: ["@apps/worker", "백그라운드 워커", "BullMQ 컨슈머"]
tags: [service-foundry, reference, backend, app]
---

# worker — BullMQ 백그라운드 작업 컨슈머

> 💡 **한 줄 요약**: BullMQ 기반 비동기 작업 컨슈머. `"default"` 큐를 구독해 등록된 핸들러로 백그라운드 작업을 처리한다.
> **위치**: `apps/worker` · **상위**: [[architecture]]

## 요약

`worker` 는 service-foundry 의 백그라운드 작업 처리 앱이다. `@repo/backend-queue` 에서 `startBullConsumer` 와 `resolveQueueConfig` 를 조립해 Redis 에 연결하고, `"default"` 큐의 잡을 핸들러 맵(`Record<string, JobHandler>`)으로 라우팅한다. 현재 `demo` 핸들러가 등록되어 있으며, 실제 작업(예: 이메일 발송)으로 교체하도록 설계되어 있다. SIGTERM/SIGINT 수신 시 컨슈머를 정상 종료한다.

> 📄 **위치**: `apps/worker` · **인프라**: Redis (`REDIS_HOST` / `REDIS_PORT`) · **큐**: `"default"`

## 책임

- BullMQ `"default"` 큐 구독 및 잡 핸들러 맵 기반 라우팅
- `resolveQueueConfig` 를 통한 Redis 연결 설정 로드
- SIGTERM/SIGINT 수신 시 `consumer.close()` graceful shutdown

## 구성 (조립하는 @repo 패키지)

| 패키지 | 역할 |
|---|---|
| [[reference/packages/backend-queue\|backend-queue]] | BullMQ 컨슈머 팩토리·큐 설정 리졸버 |

## 주요 엔트리포인트

| 파일 | 설명 |
|---|---|
| `src/main.ts` | 큐 설정 로드 → 핸들러 맵 정의 → `startBullConsumer` 호출 → shutdown 등록 |

## 연결된 개념

- [[explainers/backend/queue-worker-bullmq]] — BullMQ 컨슈머 동작 원리 및 graceful shutdown
- [[reference/architecture]] — 전체 시스템 구조
- [[reference/stack]] — BullMQ·ioredis 도입 근거

> 소스: spec-12-02 · `apps/worker/src/main.ts`
