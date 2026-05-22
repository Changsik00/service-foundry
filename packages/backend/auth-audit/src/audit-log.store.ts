export interface AuditLogInsert {
  userId: string | null;
  eventType: string;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogStore {
  insert(row: AuditLogInsert): Promise<void>;
}
