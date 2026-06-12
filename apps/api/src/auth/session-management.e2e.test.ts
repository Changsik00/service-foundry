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

const BASE_EMAIL = `session-mgmt-e2e-${Date.now()}`;
const PASSWORD = "TestPass123!";

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found in Set-Cookie header`);
  return entry.split(";")[0] ?? entry;
}

describe("Session Management E2E (real PG)", () => {
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

  async function signUp(email: string) {
    const res = await postCsrf("/auth/signup", { body: { email, password: PASSWORD } });
    expect(res.status).toBe(201);
    return {
      accessToken: res.body.accessToken as string,
      userId: res.body.user.id as string,
      refreshCookie: extractCookie(res.headers["set-cookie"], "refresh_token"),
    };
  }

  async function signIn(email: string) {
    const res = await postCsrf("/auth/signin", { body: { email, password: PASSWORD } });
    expect(res.status).toBe(200);
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
    if (app) await app.close();
    if (pool) await pool.end();
  });

  describe("GET /auth/sessions", () => {
    it("활성 세션 목록 반환 + current 세션 식별", async () => {
      const email = `${BASE_EMAIL}-list@example.com`;
      const { accessToken, refreshCookie } = await signUp(email);

      const res = await request(server)
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", refreshCookie);

      expect(res.status).toBe(200);
      expect(res.body.sessions).toBeInstanceOf(Array);
      expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
      const current = res.body.sessions.find((s: { current: boolean }) => s.current);
      expect(current).toBeDefined();
      expect(current).not.toHaveProperty("refreshTokenHash");
    });
  });

  describe("DELETE /auth/sessions/:id", () => {
    it("특정 세션 revoke → 해당 refresh_token 으로 갱신 시 401", async () => {
      const email = `${BASE_EMAIL}-revoke1@example.com`;
      const { accessToken, refreshCookie } = await signUp(email);

      // 현재 세션 ID 조회
      const listRes = await request(server)
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${accessToken}`)
        .set("Cookie", refreshCookie);
      expect(listRes.status).toBe(200);
      const session = listRes.body.sessions[0] as { id: string };
      expect(session).toBeDefined();

      // 세션 revoke
      const delRes = await deleteCsrf(`/auth/sessions/${session.id}`, {
        bearer: accessToken,
        cookie: refreshCookie,
      });
      expect(delRes.status).toBe(200);
      expect(delRes.body.status).toBe("ok");

      // revoke된 refresh_token으로 갱신 시도 → 401
      const refreshRes = await postCsrf("/auth/refresh", { cookie: refreshCookie });
      expect(refreshRes.status).toBe(401);
    });

    it("타인 세션 revoke 시도 → 403", async () => {
      const emailA = `${BASE_EMAIL}-revoke2a@example.com`;
      const emailB = `${BASE_EMAIL}-revoke2b@example.com`;
      const userA = await signUp(emailA);
      const userB = await signUp(emailB);

      // userB 의 세션 ID 조회
      const listResB = await request(server)
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${userB.accessToken}`)
        .set("Cookie", userB.refreshCookie);
      expect(listResB.status).toBe(200);
      const sessionB = listResB.body.sessions[0] as { id: string };

      // userA 가 userB 의 세션 revoke 시도 → 403
      const delRes = await deleteCsrf(`/auth/sessions/${sessionB.id}`, {
        bearer: userA.accessToken,
        cookie: userA.refreshCookie,
      });
      expect(delRes.status).toBe(403);
    });
  });

  describe("DELETE /auth/sessions (일괄 종료)", () => {
    it("현재 세션 제외 다른 세션 모두 revoke", async () => {
      const email = `${BASE_EMAIL}-revoke-all@example.com`;
      // 1) signup → session A
      const session1 = await signUp(email);
      // 2) signin 으로 session B 생성
      const session2 = await signIn(email);

      // 목록 확인 — 2개 active
      const listBefore = await request(server)
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${session2.accessToken}`)
        .set("Cookie", session2.refreshCookie);
      expect(listBefore.status).toBe(200);
      expect(listBefore.body.sessions.length).toBeGreaterThanOrEqual(2);

      // session2(current) 기준으로 나머지 전체 revoke
      const delRes = await deleteCsrf("/auth/sessions", {
        bearer: session2.accessToken,
        cookie: session2.refreshCookie,
      });
      expect(delRes.status).toBe(200);
      expect(delRes.body.status).toBe("ok");

      // session1 refresh_token 으로 갱신 시도 → 401 (revoked)
      const refreshRes = await postCsrf("/auth/refresh", { cookie: session1.refreshCookie });
      expect(refreshRes.status).toBe(401);

      // session2 자신은 여전히 유효 (목록에서 current 세션만 남아있음)
      const listAfter = await request(server)
        .get("/auth/sessions")
        .set("Authorization", `Bearer ${session2.accessToken}`)
        .set("Cookie", session2.refreshCookie);
      expect(listAfter.status).toBe(200);
      const activeSessions = listAfter.body.sessions as Array<{ current: boolean }>;
      expect(activeSessions.every((s) => s.current)).toBe(true);
    });
  });
});
