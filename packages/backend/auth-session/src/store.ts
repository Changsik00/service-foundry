import type { SessionInsert, SessionRow } from "./schema.js";

/**
 * `SessionStore` — Repository interface (Persistence Ignorance).
 *
 * Application/domain layer (createSession / rotateSession / revokeSession) 는 본 interface 만 의존 — ORM 모름.
 * Drizzle 실 구현은 `./drizzle-store.ts` 의 `drizzleSessionStore(db)` factory.
 * 향후 Redis adapter 등 추가 시 *같은 interface 구현* 만 박으면 됨.
 *
 * phase-03 spec-03-05 의 *Repository 패턴 가이드* 답습.
 */
export interface SessionStore {
  insert(row: SessionInsert): Promise<SessionRow>;
  findByHash(refreshTokenHash: string): Promise<SessionRow | null>;
  updateRevoked(id: string, revokedAt: Date): Promise<void>;
  bulkRevokeByFamily(refreshTokenFamily: string, revokedAt: Date): Promise<number>;
}
