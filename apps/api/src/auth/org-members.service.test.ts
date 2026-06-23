import { describe, expect, it, vi } from "vitest";

import { OrgMembersService } from "./org-members.service.js";

const BASE_ROWS = [
  { userId: "u-1", orgId: "org-1", role: "owner", email: "alice@x.com", displayName: "Alice" },
  { userId: "u-2", orgId: "org-1", role: "member", email: "bob@x.com", displayName: null },
  { userId: "u-3", orgId: "org-1", role: "admin", email: "carol@x.com", displayName: "Carol" },
];

function makeMockDb(rows = BASE_ROWS) {
  // Drizzle 체인: .select().from().innerJoin().where().orderBy().limit()
  // 체인 끝 .limit() 이 Promise 반환
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  const select = vi.fn().mockReturnValue({ from });
  return { db: { select }, mocks: { select, from, innerJoin, where, orderBy, limit } };
}

describe("OrgMembersService — search/filter/cursor (spec-20-03)", () => {
  it("파라미터 없이 호출 → 전체 멤버 반환 + displayName 포함", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    const result = await service.list({});

    expect(result.members).toEqual(BASE_ROWS);
    expect(result.nextCursor).toBeNull();
    expect(mocks.innerJoin).toHaveBeenCalled();
  });

  it("limit=2, 결과 3개 → nextCursor 있음 (limit+1 슬라이스 방식)", async () => {
    const rows = BASE_ROWS.slice(); // 3개
    const { db } = makeMockDb(rows);
    const service = new OrgMembersService({ db } as never);

    const result = await service.list({ limit: 2 });

    // DB 에서 limit+1(3) 개 조회 → 2개 반환, nextCursor 있음
    expect(result.members).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
  });

  it("limit=3, 결과 3개 → nextCursor null (마지막 페이지)", async () => {
    const { db } = makeMockDb(BASE_ROWS.slice(0, 3));
    const service = new OrgMembersService({ db } as never);

    const result = await service.list({ limit: 3 });

    // DB 에서 limit+1(4) 조회했는데 3개 → 마지막 페이지
    expect(result.members).toHaveLength(3);
    expect(result.nextCursor).toBeNull();
  });

  it("where 조건이 호출될 때 조건 빌더가 전달된다 (search 파라미터)", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    await service.list({ search: "alice" });

    expect(mocks.where).toHaveBeenCalled();
    const [condition] = mocks.where.mock.calls[0] as unknown[];
    expect(condition).toBeDefined();
  });

  it("where 조건이 호출될 때 조건 빌더가 전달된다 (role 파라미터)", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    await service.list({ role: "owner" });

    expect(mocks.where).toHaveBeenCalled();
  });

  it("cursor 파라미터 있을 때 where 조건이 전달된다", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    // encodeCursor({ userId: "u-1" }) 값
    const cursor = btoa(encodeURIComponent(JSON.stringify({ userId: "u-1" })));
    await service.list({ cursor });

    expect(mocks.where).toHaveBeenCalled();
  });

  it("cursor 디코딩 실패 → where 조건 없이 처음부터 반환 (graceful fallback)", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    await service.list({ cursor: "invalid-cursor!!" });

    // 잘못된 cursor → 무시하고 where 에 cursor 조건 없이 진행 (or 기본 where)
    expect(mocks.limit).toHaveBeenCalled();
  });

  it("orgId 전달 시 명시 org_id 조건이 항상 where 에 적용된다 (defense-in-depth, spec-x-org-members-defensive-scope)", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    // search/role/cursor 전부 없음 — org 조건만으로도 where 가 정의된 조건을 받아야 함.
    await service.list({ orgId: "org-1" });

    expect(mocks.where).toHaveBeenCalled();
    const [condition] = mocks.where.mock.calls[0] as unknown[];
    // 수정 전: 빈 params → and(undefined×N) = undefined → where(undefined) (RED)
    expect(condition).toBeDefined();
  });

  it("orgId 없으면(null) 0건 fail-closed — nil-uuid 스코프 (spec-x-org-members-defensive-scope)", async () => {
    const { db, mocks } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    await service.list({ orgId: null });

    // org 컨텍스트 없으면 nil-uuid 조건 → 정의된 where (전 org 노출 아님)
    const [condition] = mocks.where.mock.calls[0] as unknown[];
    expect(condition).toBeDefined();
  });

  it("기존 list() 호출 시그니처 (파라미터 없음) 하위 호환", async () => {
    const { db } = makeMockDb();
    const service = new OrgMembersService({ db } as never);

    // 파라미터 없이 호출 — 컴파일 에러 없어야 함
    const result = await service.list();

    expect(result.members).toEqual(BASE_ROWS);
  });
});
