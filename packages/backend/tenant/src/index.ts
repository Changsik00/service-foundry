import { AsyncLocalStorage } from "node:async_hooks";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/** DI 토큰 — adapter(nestjs-tenant)·소비처가 공유 ALS 인스턴스를 주입받는 데 쓴다. */
export const TENANT_ALS = Symbol("TENANT_ALS");

/** 요청 스코프 테넌트 컨텍스트. `tx` 가 있으면 해당 요청의 모든 쿼리가 그 트랜잭션으로 라우팅된다. */
export interface TenantContext {
  orgId: string | null;
  /** 요청 스코프 트랜잭션(= SET LOCAL app.current_org 가 적용된 커넥션). 없으면 pool 기본 경로. */
  tx?: NodePgDatabase<Record<string, unknown>>;
}

export class TenantAls extends AsyncLocalStorage<TenantContext> {}

/**
 * `db` 를 ALS 인지(tenant-aware) Proxy 로 감싼다.
 *
 * 요청 처리 중 ALS store 에 `tx` 가 있으면(= TenantContextInterceptor 가 org 컨텍스트로 연 트랜잭션)
 * 모든 쿼리(select/insert/update/delete/execute/transaction…)를 그 `tx` 로 라우팅한다.
 * 없으면 원본 pool `db` 로 위임한다. → 서비스 코드 수정 없이 "모든 쿼리에 RLS 컨텍스트 자동 적용".
 */
export function createTenantDb<TSchema extends Record<string, unknown>>(
  baseDb: NodePgDatabase<TSchema>,
  als: TenantAls,
): NodePgDatabase<TSchema> {
  return new Proxy(baseDb, {
    get(target, prop, _receiver) {
      const tx = als.getStore()?.tx as NodePgDatabase<TSchema> | undefined;
      const active: NodePgDatabase<TSchema> = tx ?? target;
      const value = Reflect.get(active as object, prop, active);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(active)
        : value;
    },
  });
}

/**
 * 현재 요청의 트랜잭션 안에서 테넌트 컨텍스트를 **일시적으로 비워(system context)** fn 을 실행한다.
 *
 * 토큰 기반 invite accept 처럼 *정당한 cross-org* 조회/쓰기에 사용한다 — 수락자의 org 컨텍스트로는
 * 초대 org 의 invitation 이 RLS 에 가려 보이지 않기 때문(spec-17-08 C-4). 같은 tx 안에서
 * set_config 만 토글하므로 원자성은 유지된다. 요청 tx 가 없으면(이미 무컨텍스트) 그대로 실행.
 */
export async function runWithSystemTenant<T>(als: TenantAls, fn: () => Promise<T>): Promise<T> {
  const store = als.getStore();
  const tx = store?.tx;
  if (!tx) return fn();
  await tx.execute(sql`SELECT set_config('app.current_org', '', true)`);
  try {
    return await fn();
  } finally {
    if (store?.orgId) {
      await tx.execute(sql`SELECT set_config('app.current_org', ${store.orgId}, true)`);
    }
  }
}
