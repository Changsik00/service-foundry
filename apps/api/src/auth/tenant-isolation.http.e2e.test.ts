import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { hashToken } from "@repo/backend-auth-session";
import { createDatabase } from "@repo/nestjs-database";
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
  // 시드/조회용 owner pool (RLS 우회) — invitations 직접 시드.
  let owner: ReturnType<typeof createDatabase>["pool"];

  async function bootstrapCsrf(): Promise<{ token: string; idCookie: string }> {
    const res = await request(server).get("/auth/csrf");
    return {
      token: res.body.csrfToken as string,
      idCookie: extractCookie(res.headers["set-cookie"], "csrf_id"),
    };
  }

  /** CsrfGuard 보호 POST 호출 (fresh CSRF 부트스트랩 + optional Bearer). */
  async function postCsrf(
    path: string,
    opts: { body?: object; bearer?: string } = {},
  ): Promise<request.Response> {
    const { token, idCookie } = await bootstrapCsrf();
    let r = request(server).post(path).set("X-Csrf-Token", token).set("Cookie", idCookie);
    if (opts.bearer) r = r.set("Authorization", `Bearer ${opts.bearer}`);
    return r.send(opts.body ?? {});
  }

  /** signup(고유 email) → { accessToken, userId, email }. 각 signup 은 개인 org + owner 멤버십 생성. */
  async function signup(email: string): Promise<{
    accessToken: string;
    userId: string;
    email: string;
  }> {
    const res = await postCsrf("/auth/signup", { body: { email, password: "Passw0rd!123" } });
    expect(res.status).toBe(201);
    // 응답 user.id 는 public_id — 멤버 비교/토큰 sub 용 내부 users.id 는 이메일로 해석.
    const internal = await owner.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    return {
      accessToken: res.body.accessToken as string,
      userId: internal.rows[0]?.id as string,
      email,
    };
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

  it("GET /auth/orgs → 내 멤버십 org 목록 반환 (native list-my-orgs, spec-x-native-list-orgs)", async () => {
    const a = await signup(`orgs-${Date.now()}@example.com`);

    const res = await request(server)
      .get("/auth/orgs")
      .set("Authorization", `Bearer ${a.accessToken}`);
    expect(res.status).toBe(200); // native 에 라우트 존재 (이전엔 404)

    const orgs = res.body.orgs as { orgId: string; isPersonal: boolean }[];
    expect(Array.isArray(orgs)).toBe(true);
    expect(orgs.length).toBeGreaterThanOrEqual(1); // 가입 시 개인 org 자동 생성
    expect(orgs.some((o) => o.isPersonal)).toBe(true);
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

  it("인증됐지만 orgId 없는 토큰 → GET /auth/org/members 는 전 테넌트 누수 없이 0건 (fail-closed, spec-x-null-org-isolation-failclose)", async () => {
    const stamp = Date.now();
    // 다른 org 들이 존재하는 상태를 만든다 (누수 시 이들이 보여야 함).
    const a = await signup(`nullorg-a-${stamp}@example.com`);
    const b = await signup(`nullorg-b-${stamp}@example.com`);

    // 앱 keystore 로 activeOrgId claim 없는(=orgId null) 인증 토큰 서명 — OAuth 로그인 토큰과 동형.
    const { signAccessToken } = await import("@repo/backend-auth-jwt");
    const { JwtService } = await import("../jwt/jwt.service.js");
    const { JWT_SIGN_OPTIONS } = await import("./jwt-sign.options.js");
    const jwt = app.get(JwtService);
    const opts = app.get(JWT_SIGN_OPTIONS) as { issuer: string; audience: string };
    const nullOrgToken = await signAccessToken({ sub: a.userId, role: "user" }, jwt.getKeyStore(), {
      issuer: opts.issuer,
      audience: opts.audience,
    });

    const res = await request(server)
      .get("/auth/org/members")
      .set("Authorization", `Bearer ${nullOrgToken}`);
    expect(res.status).toBe(200);
    // fail-closed: org 컨텍스트 없음 → RLS 가 전 행 차단 → 어떤 org 의 멤버도 안 보임.
    const ids = (res.body.members as { userId: string }[]).map((m) => m.userId);
    expect(ids).not.toContain(a.userId);
    expect(ids).not.toContain(b.userId);
    expect(ids).toHaveLength(0);
  });

  it("org A 가 B 를 초대 → B 가 accept → B 가 org A 멤버가 된다 (cross-org, 시스템 컨텍스트 C-4)", async () => {
    const stamp = Date.now();
    const a = await signup(`inv-a-${stamp}@example.com`);
    const b = await signup(`inv-b-${stamp}@example.com`);

    // org A id 조회 (owner — RLS 우회).
    const orgRes = await owner.query<{ org_id: string }>(
      "SELECT org_id FROM memberships WHERE user_id = $1 LIMIT 1",
      [a.userId],
    );
    const orgA = orgRes.rows[0]?.org_id;
    expect(orgA).toBeTruthy();

    // 초대 시드: org A 가 B 의 email 을 초대 (알려진 토큰 — 실행마다 고유).
    const token = `invtok-${stamp}-${"x".repeat(20)}`;
    await owner.query(
      `INSERT INTO invitations (org_id, email, token_hash, role, invited_by, expires_at)
       VALUES ($1, $2, $3, 'member', $4, now() + interval '1 day')`,
      [orgA, b.email, hashToken(token), a.userId],
    );

    // B 가 수락 — B 의 컨텍스트(org B)로는 org A invitation 이 RLS 에 가리지만 시스템 컨텍스트로 처리.
    const acceptRes = await postCsrf("/auth/org/invite/accept", {
      bearer: b.accessToken,
      body: { token },
    });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.accessToken).toBeTruthy();

    // 수락 토큰(activeOrgId=org A)으로 members 조회 → B 가 org A 멤버로 보인다.
    const members = await request(server)
      .get("/auth/org/members")
      .set("Authorization", `Bearer ${acceptRes.body.accessToken}`);
    expect(members.status).toBe(200);
    const ids = (members.body.members as { userId: string }[]).map((m) => m.userId);
    expect(ids).toContain(b.userId);
    expect(ids).toContain(a.userId); // 같은 org A 의 owner(A)도 함께 보임
  });
});
