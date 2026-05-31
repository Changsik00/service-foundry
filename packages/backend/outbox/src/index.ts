/**
 * @repo/backend-outbox — transactional outbox 포트 + in-memory 어댑터 + relay.
 *
 * dual-write 문제(상태 커밋 후 발행 실패 → 이벤트 유실) 회피:
 * 이벤트를 비즈니스 상태와 같은 트랜잭션으로 적재 → relay 가 미발행 행을
 * 폴링해 at-least-once 발행 후 마킹. framework-agnostic core (ADR-0015).
 *
 * drizzle-backed store(실제 트랜잭션 적재)는 후속 — 본 패키지는 포트 + memory.
 */

export interface OutboxEvent {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date;
  publishedAt?: Date;
}

/** add 입력 — id/createdAt 은 store 가 부여 */
export interface NewOutboxEvent {
  type: string;
  payload: unknown;
}

export interface OutboxStore {
  /** 이벤트 적재. tx 는 동일 트랜잭션 핸들(원자 적재 의도; memory 는 무시) */
  add(event: NewOutboxEvent, tx?: unknown): Promise<OutboxEvent>;
  /** 미발행 이벤트 최대 limit 개 (createdAt 오름차순) */
  fetchUnpublished(limit: number): Promise<OutboxEvent[]>;
  /** 주어진 id 들을 발행 완료로 마킹 */
  markPublished(ids: string[]): Promise<void>;
}

export interface MemoryOutboxStoreOptions {
  /** createdAt/publishedAt 주입 (테스트 결정성) */
  now?: () => Date;
}

export interface OutboxRelayOptions {
  store: OutboxStore;
  publish: (event: OutboxEvent) => Promise<void>;
  /** 한 번에 처리할 최대 건수 — 기본 100 */
  batchSize?: number;
}

export interface OutboxRelay {
  /** 미발행분을 1 회 폴링해 발행 + 마킹. 발행 성공 건수 반환 */
  runOnce(): Promise<number>;
}

export function createMemoryOutboxStore(opts?: MemoryOutboxStoreOptions): OutboxStore {
  const now = opts?.now ?? (() => new Date());
  const events = new Map<string, OutboxEvent>();
  let seq = 0;

  return {
    async add(event) {
      seq += 1;
      const stored: OutboxEvent = {
        id: String(seq),
        type: event.type,
        payload: event.payload,
        createdAt: now(),
      };
      events.set(stored.id, stored);
      return stored;
    },
    async fetchUnpublished(limit) {
      return [...events.values()]
        .filter((e) => e.publishedAt === undefined)
        .sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || Number(a.id) - Number(b.id),
        )
        .slice(0, limit);
    },
    async markPublished(ids) {
      const at = now();
      for (const id of ids) {
        const e = events.get(id);
        if (e) e.publishedAt = at;
      }
    },
  };
}

export function createOutboxRelay(opts: OutboxRelayOptions): OutboxRelay {
  const { store, publish, batchSize = 100 } = opts;
  return {
    async runOnce() {
      const pending = await store.fetchUnpublished(batchSize);
      const publishedIds: string[] = [];
      for (const event of pending) {
        // at-least-once: 발행 성공분만 마킹. 실패 시 중단 → 다음 runOnce 재시도.
        try {
          await publish(event);
        } catch {
          break;
        }
        publishedIds.push(event.id);
      }
      if (publishedIds.length > 0) await store.markPublished(publishedIds);
      return publishedIds.length;
    },
  };
}
