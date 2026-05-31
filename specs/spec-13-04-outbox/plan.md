# Implementation Plan: spec-13-04

## 📋 Branch Strategy
- 신규 브랜치: `spec-13-04-outbox`
- 시작 지점: `phase-13-api-data`
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **신뢰성 모델 = at-least-once** (publish 후 mark). exactly-once 아님 — 소비자 멱등(13-02) 으로 보완.

> [!WARNING]
> - [ ] **drizzle 실제 트랜잭션 적재는 범위 외**(후속). 본 spec 은 포트+memory 로 relay 로직을 단위 검증. 성공 기준 5 는 설계+로직 충족, DB 배선 후속.

## 🎯 핵심 전략

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| store | 포트 + memory 어댑터 (drizzle 후속) | core framework-agnostic, 라이브 DB 없이 검증 |
| relay | publish→mark 순서 고정 | at-least-once (실패 시 미마킹 재시도) |
| publish | 콜백 주입 `(event)=>Promise<void>` | queue/notification 과 디커플 |

### 📑 ADR 후보
- [x] 후보: `outbox-at-least-once` — 머지 시 판단

## 📂 Proposed Changes

### `@repo/backend-outbox` (NEW, `packages/backend/outbox/`)
#### [NEW] `src/index.ts`
```text
interface OutboxEvent { id: string; type: string; payload: unknown; createdAt: Date; publishedAt?: Date }
interface NewOutboxEvent { type: string; payload: unknown }   // add 입력
interface OutboxStore {
  add(event: NewOutboxEvent, tx?: unknown): Promise<OutboxEvent>
  fetchUnpublished(limit: number): Promise<OutboxEvent[]>
  markPublished(ids: string[]): Promise<void>
}
createMemoryOutboxStore(opts?: { now?: () => Date }): OutboxStore   // Map + 단조 id seq
interface OutboxRelayOptions { store; publish: (e:OutboxEvent)=>Promise<void>; batchSize?: number }
createOutboxRelay(opts): { runOnce(): Promise<number> }
  // fetchUnpublished(batchSize) → for each: await publish(e) → 성공분 ids 모아 markPublished
  // publish throw 시 해당 이벤트 미마킹(루프 중단, 다음 runOnce 재시도)
```
> memory store 는 결정성 위해 `now?: () => Date` 옵션. id 는 seq 기반 문자열.

#### [NEW] `src/index.test.ts`
- add → fetchUnpublished 포함, markPublished 후 제외
- relay.runOnce: 미발행 전부 publish + 마킹, 재호출 시 0
- publish 실패 → 该 이벤트 미마킹(다음 runOnce 재시도)
- batchSize 만큼만 처리

> 패키지: `package.json`(@repo/backend-outbox) + `tsconfig.json`(`types:["node"]`) + `vitest.config.ts`.

## 🧪 검증 계획
```bash
pnpm --filter @repo/backend-outbox test
pnpm -r typecheck   # turbo (pre-commit 게이트)
```

## 🔁 Rollback Plan
- 신규 패키지 디렉토리 삭제. 기존 코드 의존 없음 → 영향 0.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
