# Walkthrough: spec-12-02

> Job Queue + Worker — `@repo/backend-queue`(포트+BullMQ) + `apps/worker`.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 큐 기술 | pg-boss / BullMQ | **BullMQ(redis)** | 성숙·표준 (사용자 결정). 포트로 추상화해 교체 가능 |
| 포트 분리 | 단일 파일 / port.ts | **port.ts** (bullmq 비노출) | core 경계 — 소비자는 포트만 의존 |
| worker 생성 | 생성기 / 수기 | **수기** | 생성기는 api/next/vite 만 — worker 타입은 후속 |
| msgpackr-extract 빌드 | true/false | **false** (JS fallback) | 네이티브 빌드 회피, 큐 동작 충분 |

### ADR 승격
- [x] 후보: `queue-bullmq` (decision/tradeoff) — 머지 시 검토.

## 💬 사용자 협의
- 큐 첫 어댑터 = BullMQ(redis) 선택. pg-boss 는 포트 뒤 대안으로 남김.

## 🧪 검증 결과

### 단위
- `@repo/backend-queue` ✅ 5 passed (resolveQueueConfig: REDIS_URL/host/port/기본값/우선순위)

### 통합 (Integration Test Required = yes)
- **명령**: `bash packages/backend/queue/smoke-queue.sh`
- **결과**: ✅ redis 기동 → producer.enqueue → consumer 핸들러 수신 round-trip
```text
✓ redis ready
✓ queue round-trip — consumer 가 작업 수신
```

### 정적
- `apps/worker` typecheck ✅

## 🔍 발견 사항
- **bullmq → msgpackr-extract 네이티브 빌드** 가 pnpm 11 미승인 빌드로 install 차단 → `allowBuilds: msgpackr-extract: false`(JS fallback)로 해결.
- backend tsconfig `types:["node"]` 보정(생성기 갭, notification 과 동일).

## 🚧 이월 항목
- apps/api 에서 실제 작업 enqueue(예: notification 비동기화) → 후속.
- BullMQ 재시도/우선순위/스케줄 튜닝 → 후속.
- 생성기 `worker` 타입 → 후속.
- worker graceful shutdown 정식 처리 → spec-12-04.

## 🔗 관련
- 관련 phase: `backlog/phase-12.md` (§성공 기준 2, §시나리오 2)
- 직전 spec: spec-12-01 (notification-port)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 최종 commit | ship 시 갱신 |
