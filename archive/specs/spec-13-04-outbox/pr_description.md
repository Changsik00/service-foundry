# feat(spec-13-04): transactional outbox (@repo/backend-outbox)

## 📋 Summary
### 배경
상태 커밋과 이벤트 발행이 분리돼 dual-write 유실 위험. transactional outbox 로 원자적 적재 + 신뢰성 발행을 제공한다. phase-13 마지막 spec.

### 주요 변경
- [x] **`@repo/backend-outbox`** (신규, core):
  - `OutboxStore` 포트(`add(event, tx?)` / `fetchUnpublished` / `markPublished`)
  - `createMemoryOutboxStore()` — 테스트/dev 어댑터
  - `createOutboxRelay({ store, publish, batchSize })` → `runOnce()` — **at-least-once**(publish→mark, 실패 시 미마킹 재시도)

### Phase 컨텍스트
- phase-13 성공 기준 **5(outbox 신뢰성) 충족**(포트+relay 로직). drizzle 실제 트랜잭션 배선은 후속.

## 🎯 Key Review Points
1. **at-least-once**: publish 성공분만 markPublished. 실패 시 break → 순서 보존 + 다음 runOnce 재시도.
2. **core 디커플**: drizzle/queue 직접 의존 없음. `publish` 콜백·`tx` 핸들로 어댑터 확장점만 남김 (ADR-0015).
3. 새 런타임 dep 0.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-outbox test   # 6 passed
# typecheck: turbo 전체 PASS (pre-commit 게이트)
```

## 📦 Files Changed
- `packages/backend/outbox/**` (신규)
- `specs/spec-13-04-outbox/**`, `backlog/phase-13.md`

## ✅ Definition of Done
- [x] store/relay 단위 PASS (6) + typecheck 0
- [x] at-least-once 재시도 검증
- [x] walkthrough / pr_description ship

## 🔗 관련
- 후속: drizzle OutboxStore(실 트랜잭션), 폴링 데몬(worker), 멱등 소비자(13-02 조합)
- 다음: phase-13 마감 (`/hk-phase-ship`)
