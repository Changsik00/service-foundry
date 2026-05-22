import type { AuditLogStore } from "./audit-log.store.js";
import type { AuthEvent } from "./events.js";

interface LogContext {
  ip?: string;
  userAgent?: string;
}

function extractFields(event: AuthEvent): {
  userId: string | null;
  metadata: Record<string, unknown> | null;
} {
  switch (event.type) {
    case "SIGNED_IN":
      return { userId: event.userId, metadata: { sessionId: event.sessionId } };
    case "SIGNED_OUT":
      return { userId: null, metadata: { sessionId: event.sessionId } };
    case "TOKEN_REFRESHED":
      return { userId: null, metadata: { sessionId: event.sessionId } };
    case "PASSWORD_CHANGED":
      return { userId: event.userId, metadata: null };
    case "LOGIN_FAILED":
      return { userId: null, metadata: { email: event.email, reason: event.reason } };
    case "SESSION_REVOKED":
      return { userId: null, metadata: { sessionId: event.sessionId, reason: event.reason } };
    case "MFA_ENROLLED":
      return { userId: event.userId, metadata: { method: event.method } };
    case "SUSPICIOUS_ACTIVITY":
      return { userId: event.userId, metadata: { signal: event.signal } };
  }
}

export class AuditService {
  constructor(private readonly store: AuditLogStore) {}

  async log(event: AuthEvent, context: LogContext = {}): Promise<void> {
    const { userId, metadata } = extractFields(event);
    await this.store.insert({
      userId,
      eventType: event.type,
      ip: context.ip ?? null,
      userAgent: context.userAgent ?? null,
      metadata,
    });
  }
}
