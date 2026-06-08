import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * 테넌트 격리 — 실 HTTP 경로 검증 (spec-17-08).
 *
 * raw SQL 이 아니라 실제 요청 경로(JWT → AuthGuard → TenantContextInterceptor → RLS)를
 * 통과시켜 격리가 *운영 경로에서* 작동함을 검증한다. spec-17-07 의 거짓 GREEN 재발 방지
 * ([[feedback_isolation_test_real_path]]).
 *
 * 런타임은 반드시 비-슈퍼유저 app_runtime (RLS 적용 주체).
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("Tenant isolation via real HTTP (guard→interceptor→RLS)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;

  async function bootstrapCsrf(): Promise<{ token: string; idCookie: string }> {
    const res = await request(server).get("/auth/csrf");
    return {
      token: res.body.csrfToken as string,
      idCookie: extractCookie(res.headers["set-cookie"], "csrf_id"),
    };
  }

  /** signup(고유 email) → { accessToken, userId }. 각 signup 은 개인 org + owner 멤버십 생성. */
  async function signup(email: string): Promise<{ accessToken: string; userId: string }> {
    const { token, idCookie } = await bootstrapCsrf();
    const res = await request(server)
      .post("/auth/signup")
      .set("X-Csrf-Token", token)
      .set("Cookie", idCookie)
      .send({ email, password: "Passw0rd!123" });
    expect(res.status).toBe(201);
    return { accessToken: res.body.accessToken as string, userId: res.body.user.id as string };
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

  it("org A 토큰의 GET /auth/org/members 는 org A 멤버만 보이고 org B 는 차단된다", async () => {
    const stamp = Date.now();
    const a = await signup(`iso-a-${stamp}@example.com`);
    const b = await signup(`iso-b-${stamp}@example.com`);

    const res = await request(server)
      .get("/auth/org/members")
      .set("Authorization", `Bearer ${a.accessToken}`);
    expect(res.status).toBe(200);

    const memberUserIds = (res.body.members as { userId: string }[]).map((m) => m.userId);
    expect(memberUserIds).toContain(a.userId); // 자기 org 는 보임
    expect(memberUserIds).not.toContain(b.userId); // 타 org 는 차단 (현재 RED — 컨텍스트 미설정)
  });
});
