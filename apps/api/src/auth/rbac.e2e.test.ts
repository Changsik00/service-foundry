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

const BASE = `rbac-e2e-${Date.now()}`;
const PASSWORD = "TestPass123!";

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found in Set-Cookie header`);
  return entry.split(";")[0] ?? entry;
}

describe("RBAC E2E (real PG)", () => {
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
      refreshCookie: extractCookie(res.headers["set-cookie"], "refresh_token"),
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

  describe("POST /auth/org/invite RBAC", () => {
    let ownerToken: string;
    let ownerOrgId: string; // org public_id (switch 입력·외부 식별자)
    let ownerInternalOrgId: string; // 내부 org uuid (raw membership INSERT 용)

    beforeAll(async () => {
      // owner 계정 생성
      const owner = await signUp(`${BASE}-owner@example.com`);
      ownerToken = owner.accessToken;

      // owner의 org public_id 조회 (/me 는 public_id 노출, spec-26-05)
      const meRes = await request(server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${ownerToken}`);
      ownerOrgId = meRes.body.user.orgId as string;
      // raw SQL 시드용 내부 org id 해석
      const r = await pool.query<{ id: string }>(
        "SELECT id FROM organizations WHERE public_id = $1",
        [ownerOrgId],
      );
      ownerInternalOrgId = r.rows[0]?.id as string;
    });

    it("owner 토큰 → 초대 성공 (200)", async () => {
      const res = await postCsrf("/auth/org/invite", {
        bearer: ownerToken,
        body: { email: `${BASE}-target1@example.com`, role: "member" },
      });
      expect(res.status).toBe(200);
    });

    it("member 토큰 → 403 Forbidden", async () => {
      // member 계정 생성 + owner의 org에 member로 등록
      const member = await signUp(`${BASE}-member@example.com`);

      // DB에서 직접 membership을 owner org에 member로 삽입 후 org switch
      await pool.query(
        `INSERT INTO memberships (user_id, org_id, role)
         SELECT u.id, $2, 'member'
         FROM users u WHERE u.email = $1
         ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'member'`,
        [`${BASE}-member@example.com`, ownerInternalOrgId],
      );

      // org switch → ownerOrgId로 전환된 토큰 발급 (orgRole=member)
      const switchRes = await postCsrf("/auth/org/switch", {
        bearer: member.accessToken,
        body: { orgId: ownerOrgId },
      });
      const memberToken = switchRes.body.accessToken as string;

      const res = await postCsrf("/auth/org/invite", {
        bearer: memberToken,
        body: { email: `${BASE}-target2@example.com`, role: "member" },
      });
      expect(res.status).toBe(403);
    });

    it("admin 토큰 → 초대 성공 (200)", async () => {
      // admin 계정 생성 + owner의 org에 admin으로 등록
      const admin = await signUp(`${BASE}-admin@example.com`);

      await pool.query(
        `INSERT INTO memberships (user_id, org_id, role)
         SELECT u.id, $2, 'admin'
         FROM users u WHERE u.email = $1
         ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'admin'`,
        [`${BASE}-admin@example.com`, ownerInternalOrgId],
      );

      const switchRes = await postCsrf("/auth/org/switch", {
        bearer: admin.accessToken,
        body: { orgId: ownerOrgId },
      });
      const adminToken = switchRes.body.accessToken as string;

      const res = await postCsrf("/auth/org/invite", {
        bearer: adminToken,
        body: { email: `${BASE}-target3@example.com`, role: "member" },
      });
      expect(res.status).toBe(200);
    });
  });
});
