import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabase } from "@repo/nestjs-database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

const BASE = `apikey-e2e-${Date.now()}`;
const PASSWORD = "TestPass123!";

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("API Key E2E (real PG)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;
  let pool: ReturnType<typeof createDatabase>["pool"];

  async function bootstrapCsrf(): Promise<{ token: string; idCookie: string }> {
    const res = await request(server).get("/auth/csrf");
    return {
      token: res.body.csrfToken as string,
      idCookie: extractCookie(res.headers["set-cookie"], "csrf_id"),
    };
  }

  async function postCsrf(
    path: string,
    opts: { body?: object; cookie?: string; bearer?: string } = {},
  ) {
    const { token, idCookie } = await bootstrapCsrf();
    const cookie = [opts.cookie, idCookie].filter(Boolean).join("; ");
    let r = request(server).post(path).set("X-Csrf-Token", token).set("Cookie", cookie);
    if (opts.bearer) r = r.set("Authorization", `Bearer ${opts.bearer}`);
    if (opts.body !== undefined) r = r.send(opts.body);
    return r;
  }

  async function signUp(email: string) {
    const res = await postCsrf("/auth/signup", { body: { email, password: PASSWORD } });
    expect(res.status).toBe(201);
    return {
      accessToken: res.body.accessToken as string,
    };
  }

  beforeAll(async () => {
    pool = createDatabase({
      connectionUrl: process.env.DATABASE_URL ?? "",
      schema: {},
      poolSize: 2,
    }).pool;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, { corsOrigin: "http://localhost:2027" });
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await pool.end();
    await app.close();
  });

  describe("API Key 생성·사용·취소 흐름 (owner)", () => {
    let ownerToken: string;
    let keyId: string;
    let plainKey: string;

    beforeAll(async () => {
      const owner = await signUp(`${BASE}-owner@example.com`);
      ownerToken = owner.accessToken;
    });

    it("POST /auth/api-keys → 201 + plain 키 반환", async () => {
      const res = await request(server)
        .post("/auth/api-keys")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({ name: "Test Key" });
      expect(res.status).toBe(201);
      expect(res.body.plain).toMatch(/^sk_[0-9a-f]{64}$/);
      expect(res.body.id).toBeDefined();
      keyId = res.body.id as string;
      plainKey = res.body.plain as string;
    });

    it("GET /auth/api-keys → 200 + 키 목록 포함", async () => {
      const res = await request(server)
        .get("/auth/api-keys")
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((k: { id: string }) => k.id === keyId)).toBe(true);
    });

    it("GET /auth/api-keys/verify (X-API-Key) → 200 { ok: true }", async () => {
      const res = await request(server).get("/auth/api-keys/verify").set("X-API-Key", plainKey);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });

    it("DELETE /auth/api-keys/:id → 204", async () => {
      const res = await request(server)
        .delete(`/auth/api-keys/${keyId}`)
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(res.status).toBe(204);
    });

    it("취소 후 GET /auth/api-keys/verify → 401", async () => {
      const res = await request(server).get("/auth/api-keys/verify").set("X-API-Key", plainKey);
      expect(res.status).toBe(401);
    });
  });

  describe("member의 API Key 생성 시도 → 403", () => {
    let memberToken: string;
    let ownerOrgId: string;

    beforeAll(async () => {
      const owner = await signUp(`${BASE}-owner2@example.com`);
      const meRes = await request(server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${owner.accessToken}`);
      ownerOrgId = meRes.body.user.orgId as string; // org public_id (switch 입력)
      // raw INSERT 용 내부 org id 해석
      const orgRow = await pool.query<{ id: string }>(
        "SELECT id FROM organizations WHERE public_id = $1",
        [ownerOrgId],
      );
      const ownerInternalOrgId = orgRow.rows[0]?.id as string;

      const member = await signUp(`${BASE}-member@example.com`);

      await pool.query(
        `INSERT INTO memberships (user_id, org_id, role)
         SELECT u.id, $2, 'member'
         FROM users u WHERE u.email = $1
         ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'member'`,
        [`${BASE}-member@example.com`, ownerInternalOrgId],
      );

      const switchRes = await postCsrf("/auth/org/switch", {
        bearer: member.accessToken,
        body: { orgId: ownerOrgId },
      });
      memberToken = switchRes.body.accessToken as string;
    });

    it("member POST /auth/api-keys → 403", async () => {
      const res = await request(server)
        .post("/auth/api-keys")
        .set("Authorization", `Bearer ${memberToken}`)
        .send({ name: "Member Key" });
      expect(res.status).toBe(403);
    });
  });

  // RLS backstop (spec-26-04): org-scoped api_keys 연산은 tenant tx(RLS) 경유 — 교차-org 격리 보존.
  describe("교차-org 격리 (RLS backstop)", () => {
    let tokenA: string;
    let tokenB: string;
    let keyIdA: string;

    beforeAll(async () => {
      tokenA = (await signUp(`${BASE}-iso-a@example.com`)).accessToken;
      tokenB = (await signUp(`${BASE}-iso-b@example.com`)).accessToken;
      const created = await request(server)
        .post("/auth/api-keys")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ name: "A's Key" });
      expect(created.status).toBe(201);
      keyIdA = created.body.id as string;
    });

    it("org B 의 GET /auth/api-keys 는 org A 의 키를 포함하지 않는다", async () => {
      const res = await request(server)
        .get("/auth/api-keys")
        .set("Authorization", `Bearer ${tokenB}`);
      expect(res.status).toBe(200);
      expect(res.body.some((k: { id: string }) => k.id === keyIdA)).toBe(false);
    });

    it("org B 가 org A 의 키 revoke 시도 → 실패(403)", async () => {
      const res = await request(server)
        .delete(`/auth/api-keys/${keyIdA}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    // RLS 계층 단독 실증: WHERE org_id 동어반복이 아니라, app.current_org 컨텍스트만으로
    // api_keys 가 스코프되는지 검증(WHERE 절 없는 raw SELECT). B(database.db 경유)가 의존하는 backstop.
    it("app.current_org 설정 시 WHERE 없이도 api_keys 가 그 org 로 스코프됨 (RLS backstop)", async () => {
      // /me 의 orgId 는 org public_id (spec-26-05) — RLS 는 내부 uuid 기준이므로 내부 id 로 해석.
      const me = await request(server).get("/auth/me").set("Authorization", `Bearer ${tokenA}`);
      const orgAPublic = me.body.user.orgId as string;
      const orgRow = await pool.query<{ id: string }>(
        "SELECT id FROM organizations WHERE public_id = $1",
        [orgAPublic],
      );
      const orgAInternal = orgRow.rows[0]?.id as string;
      expect(orgAInternal).toBeTruthy();

      // app_runtime(RLS 적용 주체) 연결에서 tx-local 컨텍스트 설정 후 WHERE 없이 조회.
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('app.current_org', $1, true)", [orgAInternal]);
        const r = await client.query<{ org_id: string }>("SELECT org_id FROM api_keys");
        await client.query("COMMIT");
        expect(r.rows.length).toBeGreaterThan(0); // org A 자기 키는 보임
        expect(r.rows.every((row) => row.org_id === orgAInternal)).toBe(true); // 타 org 0건
      } finally {
        client.release();
      }
    });
  });
});
