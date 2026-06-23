import { AsyncLocalStorage } from "node:async_hooks";
import { describe, expect, it } from "vitest";

import { createTenantDb, runWithSystemTenant, TenantAls } from "./index.js";

/** select().from().where() 체인을 흉내내는 최소 mock db. label 로 base/tx 를 구분. */
function makeDb(label: string) {
  return {
    label,
    select() {
      return { from: () => ({ where: async () => [{ from: label }] }) };
    },
  };
}

describe("createTenantDb (ALS tx 라우팅 proxy)", () => {
  it("ALS 에 tx 없으면 base db 로 위임", async () => {
    const als = new TenantAls();
    const base = makeDb("base");
    const proxy = createTenantDb(base as never, als);

    const rows = await (proxy as never as ReturnType<typeof makeDb>).select().from().where();
    expect(rows).toEqual([{ from: "base" }]);
  });

  it("ALS 에 tx 있으면 tx 로 라우팅", async () => {
    const als = new TenantAls();
    const base = makeDb("base");
    const tx = makeDb("tx");
    const proxy = createTenantDb(base as never, als);

    await als.run({ orgId: "org-a", tx: tx as never }, async () => {
      const rows = await (proxy as never as ReturnType<typeof makeDb>).select().from().where();
      expect(rows).toEqual([{ from: "tx" }]);
    });
  });

  it("라우팅은 호출 시점 ALS 상태로 동적 결정", async () => {
    const als = new TenantAls();
    const base = makeDb("base");
    const tx = makeDb("tx");
    const proxy = createTenantDb(base as never, als) as never as ReturnType<typeof makeDb>;

    // 컨텍스트 밖: base
    expect(await proxy.select().from().where()).toEqual([{ from: "base" }]);
    // 컨텍스트 안: tx
    await als.run({ orgId: "org-a", tx: tx as never }, async () => {
      expect(await proxy.select().from().where()).toEqual([{ from: "tx" }]);
    });
  });
});

describe("runWithSystemTenant", () => {
  it("요청 tx 없으면 fn 그대로 실행", async () => {
    const als = new TenantAls();
    const result = await runWithSystemTenant(als, async () => "ok");
    expect(result).toBe("ok");
  });

  it("tx 있으면 컨텍스트를 비웠다가 fn 후 원복", async () => {
    const calls: string[] = [];
    const tx = {
      execute: async (q: unknown) => {
        calls.push(JSON.stringify(q).includes("set_config") ? "set_config" : "other");
      },
    } as never;
    const als = new TenantAls();
    await als.run({ orgId: "org-a", tx }, async () => {
      const seen = await runWithSystemTenant(als, async () => {
        calls.push("fn");
        return 1;
      });
      expect(seen).toBe(1);
    });
    // 비우기(set_config '') → fn → 원복(set_config org-a)
    expect(calls).toEqual(["set_config", "fn", "set_config"]);
  });
});

describe("TenantAls", () => {
  it("AsyncLocalStorage 인스턴스", () => {
    expect(new TenantAls()).toBeInstanceOf(AsyncLocalStorage);
  });
});
