# worker

> BullMQ 기반 비동기 작업 컨슈머. `"default"` 큐를 구독해 등록된 핸들러로 백그라운드 작업을 처리한다.

## 실행

```bash
# 개발 (tsx watch)
pnpm dev

# 프로덕션
pnpm start
```

환경변수: `REDIS_HOST`, `REDIS_PORT` (Redis 연결)

## 구성

조립하는 핵심 `@repo` 패키지:

- `@repo/backend-queue` — BullMQ 컨슈머 팩토리(`startBullConsumer`)·큐 설정 리졸버(`resolveQueueConfig`)

## 주요 엔트리포인트

| 파일 | 설명 |
|---|---|
| `src/main.ts` | 큐 설정 로드 → 핸들러 맵 정의 → `startBullConsumer` 호출 → SIGTERM/SIGINT graceful shutdown 등록 |

현재 `demo` 핸들러 등록. 실제 작업(이메일 발송 등)으로 교체해 사용.

## 자세히

- 레퍼런스: [`docs/reference/apps/worker.md`](../../docs/reference/apps/worker.md)
- 동작 원리: [`docs/explainers/backend/queue-worker-bullmq.md`](../../docs/explainers/backend/queue-worker-bullmq.md)
