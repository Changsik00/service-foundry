import { AsyncLocalStorage } from "node:async_hooks";
import { from, lastValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { TenantContextInterceptor } from "./tenant.interceptor.js";
import type { TenantContext } from "./tenant.js";

function makeInterceptor(orgId: string | null) {
  const als = new AsyncLocalStorage<TenantContext>();
  const interceptor = new TenantContextInterceptor(als);
  return { als, interceptor };
}

function makeCtx(orgId: string | null) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: { sub: "u1", role: "user", orgId } }),
    }),
  };
}

describe("TenantContextInterceptor", () => {
  it("orgId 있으면 ALS에 orgId 저장", async () => {
    const { als, interceptor } = makeInterceptor(null);
    const ctx = makeCtx("00000000-0000-0000-0000-000000000099");

    let captured: TenantContext | undefined;
    const next = {
      handle: () =>
        from(
          (async () => {
            captured = als.getStore();
            return "result";
          })(),
        ),
    };

    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    await lastValueFrom(interceptor.intercept(ctx as any, next as any));

    expect(captured?.orgId).toBe("00000000-0000-0000-0000-000000000099");
  });

  it("user 없으면 orgId=null로 ALS 저장", async () => {
    const als = new AsyncLocalStorage<TenantContext>();
    const interceptor = new TenantContextInterceptor(als);
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: undefined }) }),
    };

    let captured: TenantContext | undefined;
    const next = {
      handle: () =>
        from(
          (async () => {
            captured = als.getStore();
            return "result";
          })(),
        ),
    };

    // biome-ignore lint/suspicious/noExplicitAny: ExecutionContext mock
    await lastValueFrom(interceptor.intercept(ctx as any, next as any));

    expect(captured?.orgId).toBeNull();
  });
});
