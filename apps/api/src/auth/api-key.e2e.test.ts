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
      ownerOrgId = meRes.body.user.orgId as string;

      const member = await signUp(`${BASE}-member@example.com`);

      await pool.query(
        `INSERT INTO memberships (user_id, org_id, role)
         SELECT u.id, $2, 'member'
         FROM users u WHERE u.email = $1
         ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'member'`,
        [`${BASE}-member@example.com`, ownerOrgId],
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
});
