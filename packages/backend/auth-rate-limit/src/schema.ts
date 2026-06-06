import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * failed_logins — 모든 signin 실패 시도 기록 (ADR-0014).
 *
 * - `ip` / `accountKey` 둘 다 인덱스 — rate-limit count 시 *둘 다* 조회 가능.
 * - `attemptedAt` desc 인덱스 — sliding window query 효율.
 * - 본 테이블은 *append-only* (성공 시점에 cleanup 안 함, 감사 가치 유지).
 *   주기 cleanup 은 phase-10 cron.
 */
export const failedLogins = pgTable(
  "failed_logins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ip: text("ip").notNull(),
    accountKey: text("account_key").notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow().notNull(),
    orgId: uuid("org_id"),
  },
  (t) => [
    index("failed_logins_ip_at_idx").on(t.ip, t.attemptedAt),
    index("failed_logins_account_at_idx").on(t.accountKey, t.attemptedAt),
  ],
);

/**
 * lockouts — account 별 lockout 상태 (ADR-0014).
 *
 * - `accountKey` PK — account 1개당 row 1개.
 * - `unlockAt > now` 면 잠금 상태. `< now` 면 자동 해제 (read 시점 평가).
 * - `streak`: 반복 lockout 횟수 — progressive backoff 용 (다음 cooldown 계산).
 * - 성공 signin 시 row 삭제 (`deleteLockout`).
 */
export const lockouts = pgTable("lockouts", {
  accountKey: text("account_key").primaryKey(),
  lockedAt: timestamp("locked_at", { withTimezone: true }).defaultNow().notNull(),
  unlockAt: timestamp("unlock_at", { withTimezone: true }).notNull(),
  streak: integer("streak").default(1).notNull(),
  orgId: uuid("org_id"),
});

export type FailedLoginRow = typeof failedLogins.$inferSelect;
export type FailedLoginInsert = typeof failedLogins.$inferInsert;
export type LockoutRow = typeof lockouts.$inferSelect;
export type LockoutInsert = typeof lockouts.$inferInsert;

/** 본 schema 의 typed drizzle DB (호출자가 `NodePgDatabase<typeof schema>` 박을 때). */
export const schema = { failedLogins, lockouts };
