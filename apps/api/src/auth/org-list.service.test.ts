import type { TenantAls } from "@repo/backend-tenant";
import { describe, expect, it, vi } from "vitest";
import { OrgListService } from "./org-list.service.js";

const PROVIDER_UID = "supabase-uid-123";

const ROWS = [
  { orgId: "org-1", name: "personal", role: "owner", isPersonal: true },
  { orgId: "org-2", name: "acme", role: "member", isPersonal: false },
];

function makeDatabase(rows = ROWS) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const innerJoin2 = vi.fn().mockReturnValue({ where });
  const innerJoin1 = vi.fn().mockReturnValue({ innerJoin: innerJoin2 });
  const from = vi.fn().mockReturnValue({ innerJoin: innerJoin1 });
  const select = vi.fn().mockReturnValue({ from });
  return { database: { db: { select } }, mocks: { select, where, orderBy, limit } };
}

// tx 없는 ALS — runWithSystemTenant 가 fn 직접 실행하는 경로
const als = { getStore: () => undefined } as unknown as TenantAls;

describe("OrgListService", () => {
  it("provider uid 의 멤버십 전체를 org 정보와 함께 반환한다", async () => {
    const { database } = makeDatabase();
    const service = new OrgListService(database as never, als);

    const result = await service.listForProviderUid(PROVIDER_UID);

    expect(result).toEqual(ROWS);
  });

  it("멤버십 없음 → 빈 배열", async () => {
    const { database } = makeDatabase([]);
    const service = new OrgListService(database as never, als);

    expect(await service.listForProviderUid(PROVIDER_UID)).toEqual([]);
  });

  it("상한 LIMIT 으로 무제한 스캔 방지 (A5)", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgListService(database as never, als);
    await service.listForProviderUid(PROVIDER_UID);
    expect(mocks.limit).toHaveBeenCalled();
    const [n] = mocks.limit.mock.calls[0] as number[];
    expect(typeof n).toBe("number");
    expect(n).toBeGreaterThan(0);
  });
});
