import { createDatabase } from "@repo/nestjs-database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type Pool = ReturnType<typeof createDatabase>["pool"];

/**
 * 테넌트 격리 DB-level e2e (spec-17-07).
 *
 * phase-17 성공 기준 3 / 통합 시나리오 3 의 실제 검증:
 *   "런타임 role + app.current_org 컨텍스트=org A 일 때 org B row 접근 불가."
 *
 * - `DATABASE_URL` = **런타임 role**(비-슈퍼유저 app_runtime 기대). RLS 가 적용되는 주체.
 * - `DATABASE_MIGRATE_URL` = owner/superuser. 시드·정리 전용(RLS 우회 필요).
 *
 * Red 조건(spec-17-07 이전): 런타임이 슈퍼유저(`postgres`)라 RLS 우회 →
 * 컨텍스트=A 여도 org B row 가 보여 첫 케이스가 실패한다.
 * Green 조건: 런타임이 비-슈퍼유저 `app_runtime` 로 분리되면 RLS 가 강제되어 차단된다.
 */
const RUNTIME_URL = process.env.DATABASE_URL ?? "postgres://postgres:test@localhost:5434/test";
const MIGRATE_URL = process.env.DATABASE_MIGRATE_URL ?? RUNTIME_URL;

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
/** 본 테스트가 만든 row 만 식별·정리하기 위한 마커 (account_key). */
const MARK = "rls-probe-spec-17-07";

describe("Tenant isolation (real PG, RLS DB-level)", () => {
  let owner: Pool; // 시드/정리 — owner/superuser (RLS 우회)
  let runtime: Pool; // 앱 런타임 role — RLS 적용 대상

  beforeAll(async () => {
    owner = createDatabase({ connectionUrl: MIGRATE_URL, schema: {} }).pool;
    runtime = createDatabase({ connectionUrl: RUNTIME_URL, schema: {} }).pool;
    await owner.query("DELETE FROM failed_logins WHERE account_key = $1", [MARK]);
    await owner.query(
      "INSERT INTO failed_logins (ip, account_key, org_id) VALUES ($1,$2,$3),($1,$2,$4)",
      ["127.0.0.1", MARK, ORG_A, ORG_B],
    );
  });

  afterAll(async () => {
    if (owner) {
      await owner.query("DELETE FROM failed_logins WHERE account_key = $1", [MARK]);
      await owner.end();
    }
    if (runtime) await runtime.end();
  });

  /** tx-local 컨텍스트로 격리된 SELECT 를 수행하고 본 테스트 row 의 org_id 목록을 반환. */
  async function selectUnderContext(orgId: string | null): Promise<string[]> {
    const client = await runtime.connect();
    try {
      await client.query("BEGIN");
      if (orgId) {
        await client.query("SELECT set_config('app.current_org', $1, true)", [orgId]);
      }
      const res = await client.query<{ org_id: string }>(
        "SELECT org_id FROM failed_logins WHERE account_key = $1",
        [MARK],
      );
      await client.query("ROLLBACK");
      return res.rows.map((r) => r.org_id);
    } finally {
      client.release();
    }
  }

  it("context=org A → org A row 만 보이고 org B 는 차단된다 (DB-level)", async () => {
    const orgs = await selectUnderContext(ORG_A);
    expect(orgs).toContain(ORG_A);
    expect(orgs).not.toContain(ORG_B);
  });

  it("context=NULL → 전체 보임 (무컨텍스트 호환, 회귀 방지)", async () => {
    const orgs = await selectUnderContext(null);
    expect(orgs).toContain(ORG_A);
    expect(orgs).toContain(ORG_B);
  });
});
