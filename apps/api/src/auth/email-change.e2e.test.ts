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

const BASE_EMAIL = `email-change-e2e-${Date.now()}`;
const PASSWORD = "TestPass123!";

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found in Set-Cookie header`);
  return entry.split(";")[0] ?? entry;
}

describe("Email Change E2E (real PG)", () => {
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

  async function signUp(email: string, password: string) {
    const res = await postCsrf("/auth/signup", { body: { email, password } });
    expect(res.status).toBe(201);
    // 응답 user.id 는 public_id — DB 시드/쿼리용 내부 users.id 는 이메일로 해석.
    const internal = await pool.query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    return {
      accessToken: res.body.accessToken as string,
      userId: internal.rows[0]?.id as string,
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

  describe("POST /auth/account/email/change-request", () => {
    it("provider 사용자 (providerUid 있음) → 400", async () => {
      const email = `${BASE_EMAIL}-provider@example.com`;
      const { userId, accessToken } = await signUp(email, PASSWORD);

      // providerUid 직접 주입 (고유값으로 충돌 방지)
      await pool.query("UPDATE users SET provider_uid = $1 WHERE id = $2", [
        `google-uid-${userId}`,
        userId,
      ]);

      const res = await postCsrf("/auth/account/email/change-request", {
        body: { newEmail: `${BASE_EMAIL}-provider-new@example.com` },
        bearer: accessToken,
      });
      expect(res.status).toBe(400);
    });

    it("새 이메일 이미 사용 중 → 409", async () => {
      const email = `${BASE_EMAIL}-taken-req@example.com`;
      const takenEmail = `${BASE_EMAIL}-taken-existing@example.com`;

      await signUp(takenEmail, PASSWORD);
      const { accessToken } = await signUp(email, PASSWORD);

      const res = await postCsrf("/auth/account/email/change-request", {
        body: { newEmail: takenEmail },
        bearer: accessToken,
      });
      expect(res.status).toBe(409);
    });

    it("정상 요청 → 200 + email_change_tokens 레코드 저장", async () => {
      const email = `${BASE_EMAIL}-req-ok@example.com`;
      const newEmail = `${BASE_EMAIL}-req-ok-new@example.com`;
      const { userId, accessToken } = await signUp(email, PASSWORD);

      const res = await postCsrf("/auth/account/email/change-request", {
        body: { newEmail },
        bearer: accessToken,
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });

      const tokenRow = await pool.query<{ user_id: string; new_email: string }>(
        "SELECT user_id, new_email FROM email_change_tokens WHERE user_id = $1 LIMIT 1",
        [userId],
      );
      expect(tokenRow.rows[0]?.user_id).toBe(userId);
      expect(tokenRow.rows[0]?.new_email).toBe(newEmail);
    });
  });

  describe("POST /auth/account/email/change-confirm", () => {
    it("잘못된 token → 200 (enumeration-safe)", async () => {
      const res = await postCsrf("/auth/account/email/change-confirm", {
        body: { token: "totally-fake-token-aaaabbbbcccc" },
      });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("invalid");
    });

    it("정상 confirm → 200 + 새 이메일로 로그인 + 기존 세션 revoke", async () => {
      const email = `${BASE_EMAIL}-confirm-ok@example.com`;
      const newEmail = `${BASE_EMAIL}-confirm-ok-new@example.com`;
      const { userId, accessToken, refreshCookie } = await signUp(email, PASSWORD);

      // 이메일 변경 요청
      const reqRes = await postCsrf("/auth/account/email/change-request", {
        body: { newEmail },
        bearer: accessToken,
      });
      expect(reqRes.status).toBe(200);

      // DB에서 token_hash로 원본 토큰 직접 취득 불가 → token_hash 대신 hash 함수 없이
      // email_change_tokens 테이블에서 userId 기준으로 record를 읽고,
      // notifier가 dev 어댑터라 콘솔 출력 → DB에서 직접 행 조작으로 confirm 우회
      // (실제 토큰을 DB에서 hash 역산 불가이므로 — 테스트용 직접 갱신 패턴 사용)
      const tokenRow = await pool.query<{ id: string; token_hash: string }>(
        "SELECT id, token_hash FROM email_change_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId],
      );
      const tokenId = tokenRow.rows[0]?.id;
      expect(tokenId).toBeTruthy();

      // hashToken(token) = SHA-256(token) → 원본 불가 → 테스트에서는 token_hash를 알려진 값으로 교체
      // generateRefreshToken() → crypto.randomBytes(32).toString('hex') 패턴 (64자 hex)
      // 테스트 편의: DB에서 token_hash를 known hash로 덮어쓰고 그 hash의 원본을 confirm
      // 테스트 실행마다 고유한 토큰 사용 (DB 중복 방지)
      const { createHash, randomBytes } = await import("node:crypto");
      const testToken = `test-email-change-${randomBytes(16).toString("hex")}`;
      const testHash = createHash("sha256").update(testToken).digest("hex");
      await pool.query("UPDATE email_change_tokens SET token_hash = $1 WHERE id = $2", [
        testHash,
        tokenId,
      ]);

      // confirm 요청
      const confirmRes = await postCsrf("/auth/account/email/change-confirm", {
        body: { token: testToken },
      });
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.status).toBe("confirmed");

      // 새 이메일로 로그인 가능
      const signinRes = await postCsrf("/auth/signin", {
        body: { email: newEmail, password: PASSWORD },
      });
      expect(signinRes.status).toBe(200);
      expect(typeof signinRes.body.accessToken).toBe("string");

      // 기존 refresh token → 세션 revoke → 401
      const refreshRes = await postCsrf("/auth/refresh", { cookie: refreshCookie });
      expect(refreshRes.status).toBe(401);
    });
  });
});
