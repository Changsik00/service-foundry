import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { TenantAls, type TenantContext } from "@repo/backend-tenant";
import { lastValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { TenantContextInterceptor } from "./index.js";

function makeCtx(user: { orgId: string | null } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

/** db.transaction(cb) → cb(mockTx). mockTx.execute 는 set_config 호출 기록용. */
function makeDb() {
  const execute = vi.fn().mockResolvedValue(undefined);
  const mockTx = { execute, label: "tx" };
  const transaction = vi
    .fn()
    .mockImplementation((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
  return { db: { db: { transaction }, pool: {} }, execute, transaction, mockTx };
}

describe("TenantContextInterceptor", () => {
  it("orgId 있으면 tx 를 열고 set_config 발행 + 핸들러가 tx 바인딩된 ALS 를 본다", async () => {
    const als = new TenantAls();
    const { db, execute, transaction, mockTx } = makeDb();
    const interceptor = new TenantContextInterceptor(als, db as never);

    // 핸들러는 자신이 본 ALS store 를 그대로 방출 → 컨텍스트 주입을 직접 검증.
    const handler: CallHandler = { handle: () => of(als.getStore()) };

    const seen = (await lastValueFrom(
      interceptor.intercept(makeCtx({ orgId: "org-a" }), handler),
    )) as TenantContext;

    expect(transaction).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce(); // set_config
    expect(seen.orgId).toBe("org-a");
    expect(seen.tx).toBe(mockTx);
  });

  it("orgId 없으면 tx 미개시 + 핸들러는 context NULL 을 본다", async () => {
    const als = new TenantAls();
    const { db, transaction } = makeDb();
    const interceptor = new TenantContextInterceptor(als, db as never);

    const handler: CallHandler = { handle: () => of(als.getStore()) };

    const seen = (await lastValueFrom(
      interceptor.intercept(makeCtx(undefined), handler),
    )) as TenantContext;

    expect(transaction).not.toHaveBeenCalled();
    expect(seen.orgId).toBeNull();
    expect(seen.tx).toBeUndefined();
  });
});
