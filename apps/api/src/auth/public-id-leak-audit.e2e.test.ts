import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabase } from "@repo/nestjs-database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * 누출 감사 스냅샷 (spec-26-07) — ADR-0028 §1 불변식 강제.
 *
 * 주요 인증 엔드포인트 응답 body 에 **내부 uuid(hex 8-4-4-4-12) 가 0건**임을 스캔.
 * 범위: 응답 body 의 hex uuid. 제외: JWT payload(§1 예외, base64 라 미매칭), base64 cursor(불투명),
 * `slug`(개인 org 의 randomUUID handle — PK 아님, scan 에서 제거).
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** slug(개인 org 의 uuid handle)은 식별자(PK) 아니므로 scan 에서 제거. */
function scrub(body: unknown): string {
  return JSON.stringify(body, (key, value) => (key === "slug" ? undefined : value));
}
function expectNoInternalUuid(body: unknown, label: string): void {
  expect(scrub(body), `${label}: 내부 uuid 노출`).not.toMatch(UUID_RE);
}

function extractCookie(setCookie: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("public_id 누출 감사 — 응답 body 내부 uuid 0 (ADR-0028 §1)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;
  let owner: ReturnType<typeof createDatabase>["pool"];

  async function csrf(): Promise<{ token: string; idCookie: string }> {
    const res = await request(server).get("/auth/csrf");
    return {
      token: res.body.csrfToken,
      idCookie: extractCookie(res.headers["set-cookie"], "csrf_id"),
    };
  }
  async function post(path: string, body: object, bearer?: string) {
    const { token, idCookie } = await csrf();
    let r = request(server).post(path).set("X-Csrf-Token", token).set("Cookie", idCookie);
    if (bearer) r = r.set("Authorization", `Bearer ${bearer}`);
    return r.send(body);
  }

  beforeAll(async () => {
    owner = createDatabase({
      connectionUrl: process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL ?? "",
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
    if (owner) await owner.end();
  });

  it("auth/org/api-key/session 응답에 내부 uuid 가 없다", async () => {
    const email = `leak-${Date.now()}@example.com`;
    const password = "Passw0rd!123";

    const signup = await post("/auth/signup", { email, password });
    expect(signup.status).toBe(201);
    expectNoInternalUuid(signup.body, "signup");
    expect(signup.body.user.id).toMatch(/^usr_/);
    const token = signup.body.accessToken as string;

    const signin = await post("/auth/signin", { email, password });
    expectNoInternalUuid(signin.body, "signin");

    const me = await request(server).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expectNoInternalUuid(me.body, "me");
    expect(me.body.user.id).toMatch(/^usr_/);
    if (me.body.user.orgId) expect(me.body.user.orgId).toMatch(/^org_/);

    const orgs = await request(server).get("/auth/orgs").set("Authorization", `Bearer ${token}`);
    expectNoInternalUuid(orgs.body, "orgs");
    expect(orgs.body.orgs.length).toBeGreaterThanOrEqual(1); // 빈 배열 가짜 GREEN 방지
    expect(orgs.body.orgs[0]?.orgId).toMatch(/^org_/);

    const members = await request(server)
      .get("/auth/org/members")
      .set("Authorization", `Bearer ${token}`);
    expectNoInternalUuid(members.body, "org/members");
    expect(members.body.members.length).toBeGreaterThanOrEqual(1);
    expect(members.body.members[0]?.userId).toMatch(/^usr_/);

    const keyCreate = await post("/auth/api-keys", { name: "audit" }, token);
    expect(keyCreate.status).toBe(201);
    expectNoInternalUuid({ ...keyCreate.body, plain: undefined }, "api-keys create");
    expect(keyCreate.body.id).toMatch(/^key_/);

    const keyList = await request(server)
      .get("/auth/api-keys")
      .set("Authorization", `Bearer ${token}`);
    expectNoInternalUuid(keyList.body, "api-keys list");

    const sessions = await request(server)
      .get("/auth/sessions")
      .set("Authorization", `Bearer ${token}`);
    expectNoInternalUuid(sessions.body, "sessions");
    expect(sessions.body.sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions.body.sessions[0]?.id).toMatch(/^ses_/);
  });

  it("admin 응답(orgs/users)에 내부 uuid 가 없다", async () => {
    const email = `leak-admin-${Date.now()}@example.com`;
    const password = "Passw0rd!123";
    await post("/auth/signup", { email, password });
    // role=admin 승격 후 재로그인 → admin 토큰
    await owner.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
    const signin = await post("/auth/signin", { email, password });
    const adminToken = signin.body.accessToken as string;

    const adminOrgs = await request(server)
      .get("/admin/orgs")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminOrgs.status).toBe(200);
    expectNoInternalUuid(adminOrgs.body, "admin/orgs");
    expect(adminOrgs.body.orgs.length).toBeGreaterThanOrEqual(1);
    expect(adminOrgs.body.orgs[0]?.id).toMatch(/^org_/);
    expect(adminOrgs.body.orgs[0]?.ownerId).toMatch(/^usr_/);

    const adminUsers = await request(server)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminUsers.status).toBe(200);
    expectNoInternalUuid(adminUsers.body, "admin/users");
    expect(adminUsers.body.users.length).toBeGreaterThanOrEqual(1);
    expect(adminUsers.body.users[0]?.id).toMatch(/^usr_/);

    // nextCursor 도 base64 디코드 시 내부 uuid 0 (spec-26-08 — cursor 누출 차단).
    const paged = await request(server)
      .get("/admin/users?limit=1")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(paged.body.nextCursor).toBeTruthy(); // admin 다수 → 다음 페이지 존재
    const decoded = decodeURIComponent(atob(paged.body.nextCursor as string));
    expect(decoded, "admin/users nextCursor 내부 uuid 노출").not.toMatch(UUID_RE);
  });
});
