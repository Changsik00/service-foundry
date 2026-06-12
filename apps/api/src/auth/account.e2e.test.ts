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

const BASE_EMAIL = `account-e2e-${Date.now()}`;
const PASSWORD = "TestPass123!";
const NEW_PASSWORD = "NewPass456!";

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found in Set-Cookie header`);
  return entry.split(";")[0] ?? entry;
}

describe("Account Mutations E2E (real PG)", () => {
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

  async function deleteCsrf(path: string, opts: { cookie?: string; bearer?: string } = {}) {
    const { token, idCookie } = await bootstrapCsrf();
    const cookie = [opts.cookie, idCookie].filter(Boolean).join("; ");
    let r = request(server).delete(path).set("X-Csrf-Token", token).set("Cookie", cookie);
    if (opts.bearer) r = r.set("Authorization", `Bearer ${opts.bearer}`);
    return r;
  }

  async function signUp(email: string, password: string) {
    const res = await postCsrf("/auth/signup", { body: { email, password } });
    expect(res.status).toBe(201);
    return {
      accessToken: res.body.accessToken as string,
      userId: res.body.user.id as string,
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
    if (app) await app.close();
    if (pool) await pool.end();
  });

  describe("PATCH /auth/account/password", () => {
    it("현재 비밀번호 틀림 → 400", async () => {
      const email = `${BASE_EMAIL}-pw-wrong@example.com`;
      const { accessToken } = await signUp(email, PASSWORD);

      const res = await request(server)
        .patch("/auth/account/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: "WrongPass999!", newPassword: NEW_PASSWORD });

      expect(res.status).toBe(400);
    });

    it("성공 → 200 + 새 비밀번호로 로그인 가능", async () => {
      const email = `${BASE_EMAIL}-pw-ok@example.com`;
      const { accessToken } = await signUp(email, PASSWORD);

      const changeRes = await request(server)
        .patch("/auth/account/password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
      expect(changeRes.status).toBe(200);

      const signinRes = await postCsrf("/auth/signin", { body: { email, password: NEW_PASSWORD } });
      expect(signinRes.status).toBe(200);
      expect(typeof signinRes.body.accessToken).toBe("string");
    });
  });

  describe("PATCH /auth/account/profile", () => {
    it("displayName 변경 → GET /auth/me 에 반영", async () => {
      const email = `${BASE_EMAIL}-profile@example.com`;
      const { accessToken } = await signUp(email, PASSWORD);

      const patchRes = await request(server)
        .patch("/auth/account/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ displayName: "홍길동" });
      expect(patchRes.status).toBe(200);

      const meRes = await request(server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.displayName).toBe("홍길동");
    });
  });

  describe("DELETE /auth/account", () => {
    it("sole owner (다른 멤버 있는 org) → 400 ACCOUNT_DELETE_BLOCKED", async () => {
      const ownerEmail = `${BASE_EMAIL}-sole-owner@example.com`;
      const memberEmail = `${BASE_EMAIL}-sole-member@example.com`;

      const { userId: ownerUserId, accessToken: ownerToken } = await signUp(ownerEmail, PASSWORD);
      const { userId: memberUserId } = await signUp(memberEmail, PASSWORD);

      // owner 의 org ID 조회
      const orgRes = await pool.query<{ org_id: string }>(
        "SELECT org_id FROM memberships WHERE user_id = $1 LIMIT 1",
        [ownerUserId],
      );
      const orgId = orgRes.rows[0]?.org_id;
      expect(orgId).toBeTruthy();

      // member 를 owner 의 org 에 직접 추가 (비-owner 멤버 → owner 가 sole owner 가 됨)
      await pool.query(
        "INSERT INTO memberships (user_id, org_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
        [memberUserId, orgId],
      );

      const res = await deleteCsrf("/auth/account", { bearer: ownerToken });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("ACCOUNT_DELETE_BLOCKED");
    });

    it("sole owner 아닌 경우 (본인만 있는 org) → 200 + 세션 무효화", async () => {
      const email = `${BASE_EMAIL}-del-alone@example.com`;
      const { accessToken, refreshCookie } = await signUp(email, PASSWORD);

      // 가입 직후 — 자신의 org 에 본인만 있음 → 차단 아님
      const deleteRes = await deleteCsrf("/auth/account", { bearer: accessToken });
      expect(deleteRes.status).toBe(200);

      // 탈퇴 후 refresh 시도 → 세션 revoke → 401
      const refreshRes = await postCsrf("/auth/refresh", { cookie: refreshCookie });
      expect(refreshRes.status).toBe(401);
    });
  });
});
