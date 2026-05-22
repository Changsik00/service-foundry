import type { NodePgDatabase } from "@repo/backend-database";
import { authAuditLogs, type schema } from "./audit-log.schema.js";
import type { AuditLogInsert, AuditLogStore } from "./audit-log.store.js";

export function drizzleAuditLogStore(db: NodePgDatabase<typeof schema>): AuditLogStore {
  return {
    async insert(row: AuditLogInsert): Promise<void> {
      await db.insert(authAuditLogs).values(row);
    },
  };
}
