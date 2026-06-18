import { describe, expect, it } from "vitest";
import { createAccountUserStore } from "./account.stores.js";

/**
 * 쿼리 결과를 호출 순서대로 돌려주는 mock drizzle db.
 * 2-쿼리 구현: (1) ownerOrgs, (2) 해당 org들의 다른 멤버(role 포함).
 * `where()` 가 결과 Promise 를 돌려준다 (둘 다 `await select().from().where()` 형태).
 */
function makeStore(results: unknown[][]) {
  let i = 0;
  const builder: Record<string, unknown> = {
    from: () => builder,
    where: () => Promise.resolve(results[i++] ?? []),
  };
  const db = { select: () => builder };
  return createAccountUserStore(db as never);
}

const USER = "00000000-0000-0000-0000-000000000001";

describe("createAccountUserStore.isSoleOwnerOfAnyOrg", () => {
  it("owner org 없음 → false", async () => {
    const store = makeStore([[]]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(false);
  });

  it("owner org 에 다른 owner 존재 → 차단 안 함 → false", async () => {
    const store = makeStore([
      [{ orgId: "org-1" }], // ownerOrgs
      [
        { orgId: "org-1", role: "owner" },
        { orgId: "org-1", role: "member" },
      ], // 다른 멤버 (owner 포함)
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(false);
  });

  it("유일 owner + 다른 멤버 존재 → 차단 → true", async () => {
    const store = makeStore([
      [{ orgId: "org-1" }], // ownerOrgs
      [{ orgId: "org-1", role: "member" }], // 다른 멤버 (owner 아님)
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(true);
  });

  it("본인만 있는 개인 org (다른 멤버 없음) → 허용 → false", async () => {
    const store = makeStore([
      [{ orgId: "org-1" }], // ownerOrgs
      [], // 다른 멤버 없음
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(false);
  });
});
