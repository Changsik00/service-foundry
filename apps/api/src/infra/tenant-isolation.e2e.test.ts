import { randomUUID } from "node:crypto";
import { createDatabase } from "@repo/nestjs-database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type Pool = ReturnType<typeof createDatabase>["pool"];

/**
 * 테넌트 격리 DB-level e2e (spec-17-07, spec-17-08 에서 도메인 테이블로 갱신).
 *
 * "런타임 role + app.current_org 컨텍스트=org A 일 때 org B row 접근 불가" 를 **도메인 테이블
 * (organizations)** 에서 검증한다. (spec-17-08: RLS 는 도메인 테이블에만 적용 — auth 인프라
 * 테이블에서는 제거됐으므로 그쪽으로는 검증하지 않는다.)
 *
 * - `DATABASE_URL` = 런타임 role(비-슈퍼유저 app_runtime). RLS 적용 주체.
 * - `DATABASE_MIGRATE_URL` = owner/superuser. 시드·정리 전용(RLS 우회).
 *
 * 이 테스트는 *DB 메커니즘* 검증. 실 요청 경로 격리는 `tenant-isolation.http.e2e.test.ts` 참조.
 */
const RUNTIME_URL = process.env.DATABASE_URL ?? "postgres://app_runtime:test@localhost:5434/test";
const MIGRATE_URL = process.env.DATABASE_MIGRATE_URL ?? RUNTIME_URL;

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OWNER_USER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SLUG_A = `rls-probe-a-${OWNER_USER}`;
const SLUG_B = `rls-probe-b-${OWNER_USER}`;

describe("Tenant isolation (real PG, RLS DB-level on domain table)", () => {
  let owner: Pool; // 시드/정리 — owner (RLS 우회)
  let runtime: Pool; // 앱 런타임 role — RLS 적용 대상

  async function cleanup(): Promise<void> {
    await owner.query("DELETE FROM memberships WHERE org_id = ANY($1::uuid[])", [[ORG_A, ORG_B]]);
    await owner.query("DELETE FROM organizations WHERE id = ANY($1::uuid[])", [[ORG_A, ORG_B]]);
    await owner.query("DELETE FROM users WHERE id = $1", [OWNER_USER]);
  }

  beforeAll(async () => {
    owner = createDatabase({ connectionUrl: MIGRATE_URL, schema: {}, poolSize: 2 }).pool;
    runtime = createDatabase({ connectionUrl: RUNTIME_URL, schema: {}, poolSize: 2 }).pool;
    await cleanup();
    // owner 유저 1명 + org A/B 2개 시드(owner FK 충족).
    await owner.query("INSERT INTO users (id, email) VALUES ($1, $2)", [
      OWNER_USER,
      `rls-owner-${randomUUID()}@example.com`,
    ]);
    await owner.query(
      "INSERT INTO organizations (id, name, slug, owner_id) VALUES ($1,'orgA',$3,$5),($2,'orgB',$4,$5)",
      [ORG_A, ORG_B, SLUG_A, SLUG_B, OWNER_USER],
    );
  });

  afterAll(async () => {
    if (owner) {
      await cleanup();
      await owner.end();
    }
    if (runtime) await runtime.end();
  });

  /** tx-local 컨텍스트로 격리된 SELECT 를 수행하고 본 테스트가 만든 org id 목록을 반환. */
  async function selectUnderContext(orgId: string | null): Promise<string[]> {
    const client = await runtime.connect();
    try {
      await client.query("BEGIN");
      if (orgId) {
        await client.query("SELECT set_config('app.current_org', $1, true)", [orgId]);
      }
      const res = await client.query<{ id: string }>(
        "SELECT id FROM organizations WHERE id = ANY($1::uuid[])",
        [[ORG_A, ORG_B]],
      );
      await client.query("ROLLBACK");
      return res.rows.map((r) => r.id);
    } finally {
      client.release();
    }
  }

  it("context=org A → org A 만 보이고 org B 는 차단된다 (DB-level)", async () => {
    const orgs = await selectUnderContext(ORG_A);
    expect(orgs).toContain(ORG_A);
    expect(orgs).not.toContain(ORG_B);
  });

  it("context=NULL → 전체 보임 (무컨텍스트 호환, 회귀 방지)", async () => {
    const orgs = await selectUnderContext(null);
    expect(orgs).toContain(ORG_A);
    expect(orgs).toContain(ORG_B);
  });

  /** ctx 컨텍스트로 membership(orgId) INSERT 를 시도하고 성공/거부를 반환. */
  async function tryInsertMembership(
    ctx: string,
    membershipOrg: string,
  ): Promise<"ok" | "rejected"> {
    const client = await runtime.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('app.current_org', $1, true)", [ctx]);
      await client.query(
        "INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'member')",
        [OWNER_USER, membershipOrg],
      );
      await client.query("ROLLBACK");
      return "ok";
    } catch {
      await client.query("ROLLBACK").catch(() => {});
      return "rejected";
    } finally {
      client.release();
    }
  }

  it("context=org A → org B 로의 INSERT 는 WITH CHECK 로 거부된다 (쓰기 격리)", async () => {
    const result = await tryInsertMembership(ORG_A, ORG_B);
    expect(result).toBe("rejected");
  });

  it("context=org A → org A 로의 INSERT 는 허용된다 (정상 쓰기 회귀 방지)", async () => {
    const result = await tryInsertMembership(ORG_A, ORG_A);
    expect(result).toBe("ok");
  });
});
