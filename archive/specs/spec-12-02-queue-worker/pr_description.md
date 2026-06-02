# feat(spec-12-02): Job Queue + Worker (BullMQ)

## 📋 Summary

### 배경 및 목적
async 백그라운드 작업을 돌릴 큐/worker 가 없었다. 본 spec 은 `@repo/backend-queue`(포트 + BullMQ 어댑터) + `apps/worker`(consumer) 를 추가해 enqueue→consume 기반을 마련한다.

### 주요 변경
- [x] **`@repo/backend-queue`** (core) — `Producer`/`Consumer`/`JobHandler` 포트 + **BullMQ 어댑터**(`createBullProducer`/`startBullConsumer`) + `resolveQueueConfig`(redis 연결)
- [x] **`apps/worker`** — consumer 부트(데모 핸들러) + SIGTERM close
- [x] 통합: redis round-trip (enqueue → consumer 핸들러 수신)

### Phase 컨텍스트
- **Phase**: `phase-12` (Service Foundations I · Runtime)
- **역할**: 성공 기준 2(worker + 큐 round-trip) 충족.

## 🎯 Key Review Points
1. **포트 추상화**: `port.ts` 가 bullmq 비노출 → 소비자는 포트만 의존, 어댑터(pg-boss 등) 교체 가능.
2. **큐 기술 = BullMQ(redis)**: 사용자 결정. ADR 후보 `queue-bullmq`.
3. **pnpm 빌드 승인**: bullmq→msgpackr-extract 네이티브 빌드를 `false`(JS fallback)로 — install 차단 해소.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-queue test       # 5 passed
bash packages/backend/queue/smoke-queue.sh    # redis round-trip
pnpm --filter @apps/worker typecheck          # 0
```

## 📦 Files Changed
### 🆕 New
- `packages/backend/queue/*` (port/config/bull + roundtrip/smoke)
- `apps/worker/*` (consumer 앱)
### 🛠 Modified
- `pnpm-workspace.yaml` (bullmq catalog + msgpackr-extract 빌드 승인)

**Total**: 15 files (+553)

## ✅ Definition of Done
- [x] `resolveQueueConfig` 단위 PASS (5)
- [x] redis round-trip 통합 PASS
- [x] `apps/worker` typecheck
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-12.md`
- 후속: caching(12-03), graceful shutdown(12-04), apps/api enqueue 배선
