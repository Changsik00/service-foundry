# spec-13-04: transactional outbox

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-13-04` |
| **Phase** | `phase-13` |
| **Branch** | `spec-13-04-outbox` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
도메인 상태 변경 후 이벤트(알림/큐 발행)를 별도로 호출한다. 상태 커밋과 발행이 분리돼 있어, 커밋 성공 후 발행 실패 시 **이벤트 유실**(dual-write 문제)이 발생한다.

### 문제점
- DB 트랜잭션과 이벤트 발행이 원자적이지 않음 → 유실 또는 중복.
- 재시도/신뢰성 전략 표준 부재.

### 해결 방안 (요약)
**transactional outbox**: 이벤트를 비즈니스 상태와 **같은 트랜잭션**으로 outbox 에 적재 → 별도 relay 가 미발행 행을 폴링해 **at-least-once** 발행 후 마킹. 발행 실패 시 미마킹으로 다음 폴에서 재시도.

## 🎯 요구사항

### Functional Requirements
1. **`OutboxStore` 포트** — `add(event, tx?)` · `fetchUnpublished(limit)` · `markPublished(ids)`. `tx` 는 동일 트랜잭션 핸들(원자 적재 의도).
2. **`createMemoryOutboxStore()`** — 테스트/dev 어댑터.
3. **`createOutboxRelay({ store, publish, batchSize? })`** — `runOnce(): Promise<number>` (발행 건수). publish 후 mark (at-least-once). publish 실패 → 미마킹(재시도).
4. `OutboxEvent` — `{ id, type, payload, createdAt, publishedAt? }`.

### Non-Functional Requirements
1. framework-agnostic core (ADR-0015) — drizzle/queue 직접 의존 없음. `publish` 는 콜백 주입(`@repo/backend-queue`/notification 과 결합은 호출부).
2. at-least-once 보장 — publish 성공 후에만 mark.

## 🚫 Out of Scope (후속)
- **drizzle-backed OutboxStore + 실제 트랜잭션 적재** — 라이브 DB 검증 필요. 포트 + memory 어댑터로 신뢰성 로직을 단위 검증, drizzle 어댑터는 후속.
- 폴링 스케줄러/데몬(setInterval 루프) — `runOnce` 를 호출부가 워커/cron 에 배선.
- exactly-once / 멱등 소비자 — spec-13-02 idempotency 와 조합은 후속.

## 📑 ADR 후보
- [ ] 후보: `outbox-at-least-once` (type: decision) — dual-write 회피 + 신뢰성 전략. 머지 시 판단.

## 🔗 관련 문서 (Related)
- 관련 ADR: ADR-0015 (core/adapter)
- 관련 spec: spec-12-02 (queue, publish 대상), spec-13-02 (idempotency, 소비자 멱등)

## ✅ Definition of Done
- [ ] `OutboxStore` 포트 + `createMemoryOutboxStore` 적재/조회/마킹 단위 PASS
- [ ] `createOutboxRelay` at-least-once (발행→마킹, 실패 시 재시도, batchSize) 단위 PASS
- [ ] 전체 typecheck 0
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-13-04-outbox` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
