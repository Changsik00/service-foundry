import { describe, expect, it } from "vitest";
import { createAccountUserStore } from "./account.stores.js";

/**
 * 쿼리 결과를 호출 순서대로 돌려주는 mock drizzle db.
 * `where()` 가 `.limit()` 를 가진 실제 Promise 를 돌려줘 두 호출 형태를 모두 지원:
 * - `await select().from().where()` (ownerOrgs)
 * - `await select().from().where().limit(1)` (otherOwners/otherMembers)
 */
function makeStore(results: unknown[][]) {
  let i = 0;
  const make = () => {
    const rows = results[i++] ?? [];
    return Object.assign(Promise.resolve(rows), { limit: () => Promise.resolve(rows) });
  };
  const builder: Record<string, unknown> = {
    from: () => builder,
    where: () => make(),
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
      [{ id: "other-owner" }], // otherOwners (존재)
      [{ id: "other-member" }], // otherMembers
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(false);
  });

  it("유일 owner + 다른 멤버 존재 → 차단 → true", async () => {
    const store = makeStore([
      [{ orgId: "org-1" }], // ownerOrgs
      [], // otherOwners (없음)
      [{ id: "other-member" }], // otherMembers (존재)
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(true);
  });

  it("본인만 있는 개인 org (다른 멤버 없음) → 허용 → false", async () => {
    const store = makeStore([
      [{ orgId: "org-1" }], // ownerOrgs
      [], // otherOwners
      [], // otherMembers (없음)
    ]);
    expect(await store.isSoleOwnerOfAnyOrg(USER)).toBe(false);
  });
});
