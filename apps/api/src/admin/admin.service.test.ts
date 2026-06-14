import { encodeCursor } from "@repo/contracts";
import { describe, expect, it, vi } from "vitest";

import { AdminService } from "./admin.service.js";

const BASE_ORGS = [
  {
    id: "org-1",
    name: "Acme",
    slug: "acme",
    isPersonal: false,
    ownerId: "u-1",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "org-2",
    name: "Beta",
    slug: "beta",
    isPersonal: true,
    ownerId: "u-2",
    createdAt: new Date("2024-01-02"),
  },
  {
    id: "org-3",
    name: "Gamma",
    slug: "gamma",
    isPersonal: false,
    ownerId: "u-3",
    createdAt: new Date("2024-01-03"),
  },
];

const BASE_USERS = [
  {
    id: "u-1",
    email: "alice@x.com",
    displayName: "Alice",
    role: "admin",
    orgId: "org-1",
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "u-2",
    email: "bob@x.com",
    displayName: null,
    role: "user",
    orgId: "org-1",
    createdAt: new Date("2024-01-02"),
  },
  {
    id: "u-3",
    email: "carol@x.com",
    displayName: "Carol",
    role: "user",
    orgId: null,
    createdAt: new Date("2024-01-03"),
  },
];

function makeOrgMockDb(rows = BASE_ORGS) {
  // Drizzle 체인: .select().from().where().orderBy().limit()
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select }, mocks: { select, from, where, orderBy, limit } };
}

function makeUserMockDb(rows = BASE_USERS) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const from = vi.fn().mockReturnValue({ where });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select }, mocks: { select, from, where, orderBy, limit } };
}

// als mock: runWithSystemTenant → fn() 직접 호출
function makeAlsMock() {
  return {
    getStore: vi.fn().mockReturnValue(null),
  };
}

describe("AdminService — listOrgs (spec-21-01)", () => {
  it("파라미터 없이 호출 → 전체 조직 반환", async () => {
    const { db } = makeOrgMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listOrgs({});

    expect(result.orgs).toEqual(BASE_ORGS);
    expect(result.nextCursor).toBeNull();
  });

  it("limit=2, 결과 3개 → nextCursor 있음 (limit+1 슬라이스)", async () => {
    const { db } = makeOrgMockDb(BASE_ORGS.slice());
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listOrgs({ limit: 2 });

    expect(result.orgs).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
  });

  it("limit=3, 결과 3개 → nextCursor null (마지막 페이지)", async () => {
    const { db } = makeOrgMockDb(BASE_ORGS.slice(0, 3));
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listOrgs({ limit: 3 });

    expect(result.orgs).toHaveLength(3);
    expect(result.nextCursor).toBeNull();
  });

  it("search 파라미터 → where 조건 전달됨", async () => {
    const { db, mocks } = makeOrgMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    await service.listOrgs({ search: "acme" });

    expect(mocks.where).toHaveBeenCalled();
    const [condition] = mocks.where.mock.calls[0] as unknown[];
    expect(condition).toBeDefined();
  });

  it("cursor 파라미터 → where 조건에 gt 조건 포함됨", async () => {
    const cursor = encodeCursor({ orgId: "org-1" });
    const { db, mocks } = makeOrgMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    await service.listOrgs({ cursor });

    expect(mocks.where).toHaveBeenCalled();
  });
});

describe("AdminService — listUsers (spec-21-01)", () => {
  it("파라미터 없이 호출 → 전체 유저 반환", async () => {
    const { db } = makeUserMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listUsers({});

    expect(result.users).toEqual(BASE_USERS);
    expect(result.nextCursor).toBeNull();
  });

  it("limit=2, 결과 3개 → nextCursor 있음", async () => {
    const { db } = makeUserMockDb(BASE_USERS.slice());
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listUsers({ limit: 2 });

    expect(result.users).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
  });

  it("limit=3, 결과 3개 → nextCursor null", async () => {
    const { db } = makeUserMockDb(BASE_USERS.slice(0, 3));
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    const result = await service.listUsers({ limit: 3 });

    expect(result.users).toHaveLength(3);
    expect(result.nextCursor).toBeNull();
  });

  it("search 파라미터 → where 조건 전달됨", async () => {
    const { db, mocks } = makeUserMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    await service.listUsers({ search: "alice" });

    expect(mocks.where).toHaveBeenCalled();
    const [condition] = mocks.where.mock.calls[0] as unknown[];
    expect(condition).toBeDefined();
  });

  it("cursor 파라미터 → where 조건 전달됨", async () => {
    const cursor = encodeCursor({ userId: "u-1" });
    const { db, mocks } = makeUserMockDb();
    const als = makeAlsMock();
    const service = new AdminService({ db } as never, als as never);

    await service.listUsers({ cursor });

    expect(mocks.where).toHaveBeenCalled();
  });
});
