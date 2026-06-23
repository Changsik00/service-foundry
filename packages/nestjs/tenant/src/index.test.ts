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

  it("인증 + orgId null → fail-closed: nil-uuid 컨텍스트 tx 로 격리 (spec-x-null-org-isolation-failclose)", async () => {
    const als = new TenantAls();
    const { db, execute, transaction, mockTx } = makeDb();
    const interceptor = new TenantContextInterceptor(als, db as never);

    const handler: CallHandler = { handle: () => of(als.getStore()) };

    const seen = (await lastValueFrom(
      interceptor.intercept(makeCtx({ orgId: null }), handler),
    )) as TenantContext;

    // 인증됐는데 org 없음 → permissive 가 아니라 불가능 컨텍스트(nil-uuid)로 tx → RLS 전면 차단
    expect(transaction).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce(); // set_config(nil-uuid)
    expect(seen.orgId).toBe("00000000-0000-0000-0000-000000000000");
    expect(seen.tx).toBe(mockTx);
  });

  it("미인증(req.user 없음) → tx 미개시 + 핸들러는 context NULL 을 본다 (bootstrap permissive)", async () => {
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
