import { describe, expect, it } from "vitest";
import { AuditService } from "./audit.service.js";
import type { AuditLogStore } from "./audit-log.store.js";
import type { AuthEvent } from "./events.js";

function createFakeStore(): AuditLogStore & {
  rows: Array<Parameters<AuditLogStore["insert"]>[0]>;
} {
  const rows: Array<Parameters<AuditLogStore["insert"]>[0]> = [];
  return {
    rows,
    async insert(row) {
      rows.push(row);
    },
  };
}

describe("AuditService", () => {
  it("SIGNED_IN 이벤트를 audit log에 저장", async () => {
    const store = createFakeStore();
    const svc = new AuditService(store);

    const event: AuthEvent = { type: "SIGNED_IN", userId: "u1", sessionId: "s1", ip: "1.2.3.4" };
    await svc.log(event, { ip: "1.2.3.4", userAgent: "Mozilla/5.0" });

    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({
      userId: "u1",
      eventType: "SIGNED_IN",
      ip: "1.2.3.4",
      userAgent: "Mozilla/5.0",
    });
  });

  it("LOGIN_FAILED 이벤트 — userId null 허용", async () => {
    const store = createFakeStore();
    const svc = new AuditService(store);

    const event: AuthEvent = {
      type: "LOGIN_FAILED",
      email: "a@b.com",
      reason: "invalid_credentials",
    };
    await svc.log(event);

    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({
      userId: null,
      eventType: "LOGIN_FAILED",
    });
    expect(store.rows[0]?.metadata).toMatchObject({
      email: "a@b.com",
      reason: "invalid_credentials",
    });
  });

  it("PASSWORD_CHANGED 이벤트 저장", async () => {
    const store = createFakeStore();
    const svc = new AuditService(store);

    await svc.log({ type: "PASSWORD_CHANGED", userId: "u2" });

    expect(store.rows[0]).toMatchObject({ userId: "u2", eventType: "PASSWORD_CHANGED" });
  });
});
