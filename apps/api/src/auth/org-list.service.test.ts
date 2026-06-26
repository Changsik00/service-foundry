import type { TenantAls } from "@repo/backend-tenant";
import { describe, expect, it, vi } from "vitest";
import { OrgListService } from "./org-list.service.js";

const ROWS = [
  { orgId: "org-1", name: "personal", role: "owner", isPersonal: true },
  { orgId: "org-2", name: "acme", role: "member", isPersonal: false },
];

// listForUserId 체인: select().from().innerJoin(organizations).where().orderBy().limit() — 단일 join, 내부 userId 키
function makeDatabase(rows = ROWS) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  const select = vi.fn().mockReturnValue({ from });
  return { database: { db: { select } }, mocks: { select, where, orderBy, limit } };
}

// tx 없는 ALS — runWithSystemTenant 가 fn 직접 실행하는 경로
const als = { getStore: () => undefined } as unknown as TenantAls;

describe("OrgListService — listForUserId (sub 정규화 후 단일 메서드, spec-x-auth-sub-normalize)", () => {
  it("내부 userId 의 멤버십 전체를 org 정보와 함께 반환한다", async () => {
    const { database } = makeDatabase();
    const service = new OrgListService(database as never, als);

    expect(await service.listForUserId("user-internal-1")).toEqual(ROWS);
  });

  it("멤버십 없음 → 빈 배열", async () => {
    const { database } = makeDatabase([]);
    const service = new OrgListService(database as never, als);

    expect(await service.listForUserId("user-internal-1")).toEqual([]);
  });

  it("상한 LIMIT 으로 무제한 스캔 방지 (A5)", async () => {
    const { database, mocks } = makeDatabase();
    const service = new OrgListService(database as never, als);
    await service.listForUserId("user-internal-1");
    expect(mocks.limit).toHaveBeenCalled();
    const [n] = mocks.limit.mock.calls[0] as number[];
    expect(typeof n).toBe("number");
    expect(n).toBeGreaterThan(0);
  });
});
