import { AsyncLocalStorage } from "node:async_hooks";
import type { NodePgDatabase } from "@repo/nestjs-database";
import { sql } from "drizzle-orm";

export const TENANT_ALS = Symbol("TENANT_ALS");

export interface TenantContext {
  orgId: string | null;
}

export class TenantAls extends AsyncLocalStorage<TenantContext> {}

/**
 * Drizzle 트랜잭션 내에서 SET LOCAL app.current_org 를 실행한 뒤 fn 을 호출한다.
 * 트랜잭션 종료 시 SET LOCAL 은 자동 해제 — 커넥션 풀 오염 없음.
 */
export async function withTenantContext<T>(
  db: NodePgDatabase<Record<string, unknown>>,
  orgId: string | null,
  fn: (tx: NodePgDatabase<Record<string, unknown>>) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    if (orgId) {
      await tx.execute(sql`SELECT set_config('app.current_org', ${orgId}, true)`);
    }
    return fn(tx);
  });
}
