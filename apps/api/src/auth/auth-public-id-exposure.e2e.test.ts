import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * 외부 식별자 노출 전환 검증 (spec-26-03).
 *
 * auth 응답·/auth/me 의 사용자 식별자가 내부 uuid PK 가 아니라 public_id(`usr_…`)임을 강제.
 * JWT sub(서버 내부)는 내부 id 유지 — 본 검증은 응답 body 만 대상(ADR-0028 §1 완화).
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

const PUBLIC_ID_RE = /^usr_[0-9A-HJKMNP-TV-Z]{26}$/;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractCookie(setCookie: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("auth responses expose public_id (not internal uuid)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;

  async function signup(
    email: string,
  ): Promise<{ accessToken: string; body: Record<string, unknown> }> {
    const csrf = await request(server).get("/auth/csrf");
    const token = csrf.body.csrfToken as string;
    const idCookie = extractCookie(csrf.headers["set-cookie"], "csrf_id");
    const res = await request(server)
      .post("/auth/signup")
      .set("X-Csrf-Token", token)
      .set("Cookie", idCookie)
      .send({ email, password: "Passw0rd!123" });
    expect(res.status).toBe(201);
    return { accessToken: res.body.accessToken as string, body: res.body };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, { corsOrigin: "http://localhost:2027" });
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("signup 응답의 user.id 는 public_id (uuid 아님)", async () => {
    const { body } = await signup(`expose-su-${Date.now()}@example.com`);
    const user = body.user as { id: string };
    expect(user.id).toMatch(PUBLIC_ID_RE);
    expect(user.id).not.toMatch(UUID_RE);
  });

  it("GET /auth/me 사용자 식별자 = public_id, 내부 sub 미노출", async () => {
    const { accessToken } = await signup(`expose-me-${Date.now()}@example.com`);
    const res = await request(server).get("/auth/me").set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    const user = res.body.user as { id?: string; sub?: string };
    expect(user.id).toMatch(PUBLIC_ID_RE);
    expect(user.id).not.toMatch(UUID_RE);
    // 내부 users.id 를 담던 sub 필드는 응답에서 제거됨.
    expect(user.sub).toBeUndefined();
    // 참고: orgId(내부 org uuid)는 26-04 에서 public_id 전환 — 전체 uuid 부재는 26-06 스냅샷에서 강제.
  });
});
