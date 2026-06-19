import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { authenticator } from "otplib";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";
// OAuth authorize 흐름은 client id 가 필수다 (spec-24-02 Wa fail-fast). 테스트 자격증명 주입.
process.env.GOOGLE_CLIENT_ID ??= "test-google-client";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-secret";
process.env.KAKAO_CLIENT_ID ??= "test-kakao-client";
process.env.KAKAO_CLIENT_SECRET ??= "test-kakao-secret";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

function extractCookie(setCookieHeader: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found in Set-Cookie header`);
  return entry.split(";")[0] ?? entry;
}

describe("Auth E2E (real PG)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;

  /** CSRF 부트스트랩: GET /auth/csrf 로 csrf_id 쿠키 + 토큰을 새로 발급받는다. */
  async function bootstrapCsrf(): Promise<{ token: string; idCookie: string }> {
    const res = await request(server).get("/auth/csrf");
    return {
      token: res.body.csrfToken as string,
      idCookie: extractCookie(res.headers["set-cookie"], "csrf_id"),
    };
  }

  /** CsrfGuard 로 보호된 POST 호출 (매번 fresh 부트스트랩 → csrf_id 쿠키 + X-Csrf-Token 동반). */
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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    // prod 부트스트랩(main.ts)과 동일한 미들웨어 배선을 공유 — 배선 회귀 차단 (phase-15 C1 / spec-16-02).
    // corsOrigin 명시 → CORS 회귀 가드(ACAO echo) 결정적 검증 가능 (W-1).
    configureApp(app, { corsOrigin: "http://localhost:2027" });
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe("CSRF 게이트", () => {
    it("보호 POST: X-Csrf-Token 누락 → 403", async () => {
      const res = await request(server)
        .post("/auth/password/reset")
        .send({ email: "ghost@example.com" });
      expect(res.status).toBe(403);
    });

    it("보호 POST: csrf_id 쿠키 없이 헤더만 → 403", async () => {
      const { token } = await bootstrapCsrf();
      const res = await request(server)
        .post("/auth/password/reset")
        .set("X-Csrf-Token", token)
        .send({ email: "ghost@example.com" });
      expect(res.status).toBe(403);
    });

    it("보호 POST: 위조 토큰 → 403", async () => {
      const { idCookie } = await bootstrapCsrf();
      const res = await request(server)
        .post("/auth/refresh")
        .set("X-Csrf-Token", "forged-token")
        .set("Cookie", idCookie);
      expect(res.status).toBe(403);
    });

    it("GET /auth/csrf → 200 + csrfToken + csrf_id/csrf_token 쿠키", async () => {
      const res = await request(server).get("/auth/csrf");
      expect(res.status).toBe(200);
      expect(typeof res.body.csrfToken).toBe("string");
      const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
      expect(cookies.some((c) => c.startsWith("csrf_id="))).toBe(true);
      expect(cookies.some((c) => c.startsWith("csrf_token="))).toBe(true);
    });
  });

  describe("MFA/passkey CSRF 게이트", () => {
    it("CSRF 없는 POST /auth/mfa/totp/verify → 403", async () => {
      const res = await request(server)
        .post("/auth/mfa/totp/verify")
        .send({ mfaChallengeToken: "x".repeat(20), code: "123456" });
      expect(res.status).toBe(403);
    });

    it("CSRF 없는 POST /auth/passkey/authenticate/verify → 403", async () => {
      const res = await request(server).post("/auth/passkey/authenticate/verify").send({
        challengeToken: "00000000-0000-0000-0000-000000000000",
        credentialId: "cred-1",
        credential: {},
      });
      expect(res.status).toBe(403);
    });
  });

  describe("보안 헤더 (helmet/CORS)", () => {
    it("응답에 helmet 헤더 x-content-type-options=nosniff 존재", async () => {
      const res = await request(server).get("/auth/csrf");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("허용 Origin 요청에 CORS 헤더(ACAO echo + credentials) 존재", async () => {
      // enableCors({ origin, credentials:true }) 가 배선됐으면 매칭 Origin 을 ACAO 로 echo + ACAC=true.
      // configureApp 에서 applySecurity 제거 시 두 헤더 부재 → FAIL (W-1 회귀 가드).
      const res = await request(server).get("/auth/csrf").set("Origin", "http://localhost:2027");
      expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:2027");
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("request-id (reqId)", () => {
    it("헤더 없는 요청 → 응답 x-request-id = 새 UUID", async () => {
      const res = await request(server).get("/auth/csrf");
      const reqId = res.headers["x-request-id"];
      expect(reqId).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it("X-Request-Id 제공 → 응답에 동일 값 에코", async () => {
      const res = await request(server).get("/auth/csrf").set("X-Request-Id", "trace-e2e-001");
      expect(res.headers["x-request-id"]).toBe("trace-e2e-001");
    });
  });

  describe("로그인 rate-limit + lockout", () => {
    // 전용 계정(미가입) — IP 누적 최소화 위해 정확히 5회 실패 후 잠금만 확인.
    const email = `lockout-${Date.now()}@example.com`;
    const password = "WrongPass123!";

    it("동일 계정 5회 실패(각 401) → 이후 429 (lockout)", async () => {
      for (let i = 0; i < 5; i++) {
        const res = await postCsrf("/auth/signin", { body: { email, password } });
        expect(res.status).toBe(401);
      }
      const locked = await postCsrf("/auth/signin", { body: { email, password } });
      expect(locked.status).toBe(429);
    });
  });

  describe("POST /auth/password/reset", () => {
    it("존재하지 않는 email → 200 (enumeration-safe)", async () => {
      const res = await postCsrf("/auth/password/reset", { body: { email: "ghost@example.com" } });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload → 400 (validation error)", async () => {
      const res = await postCsrf("/auth/password/reset", { body: { email: "not-an-email" } });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("POST /auth/password/reset/confirm", () => {
    it("미존재 token → 200 (enumeration-safe)", async () => {
      const res = await postCsrf("/auth/password/reset/confirm", {
        body: { token: "nonexistent-token-aaaabbbbccccddddeeee", newPassword: "newPass123!" },
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload (짧은 token) → 400 (validation error)", async () => {
      const res = await postCsrf("/auth/password/reset/confirm", {
        body: { token: "short", newPassword: "newPass123!" },
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("POST /auth/email/verify/request", () => {
    it("미존재 email → 200 (enumeration-safe)", async () => {
      const res = await postCsrf("/auth/email/verify/request", {
        body: { email: "ghost@example.com" },
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload → 400 (validation error)", async () => {
      const res = await postCsrf("/auth/email/verify/request", { body: { email: "not-an-email" } });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("POST /auth/email/verify/confirm", () => {
    it("미존재 token → 200 (enumeration-safe)", async () => {
      const res = await postCsrf("/auth/email/verify/confirm", {
        body: { token: "nonexistent-token-aaaabbbbccccddddeeee" },
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload (짧은 token) → 400 (validation error)", async () => {
      const res = await postCsrf("/auth/email/verify/confirm", { body: { token: "short" } });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("GET /.well-known/jwks.json", () => {
    it("JWKS 구조 반환 (keys 배열, OKP/Ed25519/EdDSA)", async () => {
      const res = await request(server).get("/.well-known/jwks.json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("keys");
      expect(Array.isArray(res.body.keys)).toBe(true);
      expect(res.body.keys.length).toBeGreaterThan(0);
      const key = res.body.keys[0];
      expect(key).toMatchObject({ kty: "OKP", crv: "Ed25519", alg: "EdDSA", use: "sig" });
    });

    it("비공개키 'd' 미포함", async () => {
      const res = await request(server).get("/.well-known/jwks.json");
      for (const key of res.body.keys) {
        expect(key).not.toHaveProperty("d");
      }
    });
  });

  describe("로그인 수직 슬라이스", () => {
    const email = `slice-${Date.now()}@example.com`;
    const password = "SliceTest123!";
    let accessToken: string;
    let refreshCookie: string;
    let userId: string;

    it("POST /auth/signup → 201 + accessToken + refresh_token cookie + csrfToken", async () => {
      const res = await postCsrf("/auth/signup", { body: { email, password } });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("csrfToken");
      expect(res.body.user.email).toBe(email);
      userId = res.body.user.id as string;
      refreshCookie = extractCookie(res.headers["set-cookie"], "refresh_token");
      accessToken = res.body.accessToken as string;
    });

    it("GET /auth/me (Bearer accessToken) → 200, sub + role 반환", async () => {
      const res = await request(server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.sub).toBe(userId);
      expect(res.body.user.role).toBe("user");
    });

    it("POST /auth/signout → 200", async () => {
      const res = await postCsrf("/auth/signout", { cookie: refreshCookie });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /auth/refresh (revoked cookie) → 401 (세션 취소 검증)", async () => {
      const res = await postCsrf("/auth/refresh", { cookie: refreshCookie });
      expect(res.status).toBe(401);
    });

    it("POST /auth/signin → 200 + 새 accessToken + 새 cookie", async () => {
      const res = await postCsrf("/auth/signin", { body: { email, password } });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      refreshCookie = extractCookie(res.headers["set-cookie"], "refresh_token");
      accessToken = res.body.accessToken as string;
    });

    it("POST /auth/refresh (유효한 cookie) → 200 + 새 accessToken", async () => {
      const res = await postCsrf("/auth/refresh", { cookie: refreshCookie });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      refreshCookie = extractCookie(res.headers["set-cookie"], "refresh_token");
      accessToken = res.body.accessToken as string;
    });

    it("GET /auth/me (refresh 후 새 accessToken) → 200", async () => {
      const res = await request(server)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.sub).toBe(userId);
      expect(res.body.user.role).toBe("user");
    });
  });

  describe("OAuth — GET /auth/oauth/:provider", () => {
    it("GET /auth/oauth/google → 302 + state/pkce 쿠키 + Location에 accounts.google.com 포함", async () => {
      const res = await request(server).get("/auth/oauth/google").redirects(0);

      expect(res.status).toBe(302);
      const location = res.headers["location"] as string;
      expect(location).toContain("accounts.google.com");
      expect(location).toContain("code_challenge");
      expect(location).toContain("state=");

      const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
      expect(cookies.some((c: string) => c.startsWith("oauth_state="))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith("oauth_pkce="))).toBe(true);
    });

    it("GET /auth/oauth/kakao → 302 + Location에 kauth.kakao.com 포함", async () => {
      const res = await request(server).get("/auth/oauth/kakao").redirects(0);

      expect(res.status).toBe(302);
      const location = res.headers["location"] as string;
      expect(location).toContain("kauth.kakao.com");
    });
  });

  describe("OAuth — GET /auth/oauth/google/callback", () => {
    it("state 불일치 → 401", async () => {
      const res = await request(server)
        .get("/auth/oauth/google/callback")
        .query({ code: "any-code", state: "wrong-state" })
        .set("Cookie", "oauth_state=correct-state; oauth_pkce=verifier");

      expect(res.status).toBe(401);
    });
  });

  describe("MFA TOTP 수직 슬라이스", () => {
    const email = `mfa-${Date.now()}@example.com`;
    const password = "MfaTest123!";
    let accessToken: string;
    let totpSecret: string;
    let mfaChallengeToken: string;

    it("POST /auth/signup → 201 (MFA 미등록 상태)", async () => {
      const res = await postCsrf("/auth/signup", { body: { email, password } });
      expect(res.status).toBe(201);
      accessToken = res.body.accessToken as string;
    });

    it("POST /auth/mfa/totp/enroll (Bearer) → 200 + totpUri", async () => {
      const res = await postCsrf("/auth/mfa/totp/enroll", { bearer: accessToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totpUri");
      expect(res.body.totpUri as string).toMatch(/^otpauth:\/\/totp\//);
      const url = new URL(res.body.totpUri as string);
      totpSecret = url.searchParams.get("secret") ?? "";
      expect(totpSecret.length).toBeGreaterThan(0);
    });

    it("POST /auth/mfa/totp/enroll/confirm (잘못된 코드) → 401", async () => {
      const res = await postCsrf("/auth/mfa/totp/enroll/confirm", {
        bearer: accessToken,
        body: { code: "000000" },
      });
      expect(res.status).toBe(401);
    });

    it("POST /auth/mfa/totp/enroll/confirm (유효 코드) → 200 + backupCodes", async () => {
      const code = authenticator.generate(totpSecret);
      const res = await postCsrf("/auth/mfa/totp/enroll/confirm", {
        bearer: accessToken,
        body: { code },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.backupCodes)).toBe(true);
      expect((res.body.backupCodes as string[]).length).toBe(10);
    });

    it("POST /auth/signin (MFA 활성화) → 200 + mfa_required", async () => {
      const res = await postCsrf("/auth/signin", { body: { email, password } });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("mfa_required");
      expect(res.body).toHaveProperty("mfaChallengeToken");
      mfaChallengeToken = res.body.mfaChallengeToken as string;
    });

    it("POST /auth/mfa/totp/verify (잘못된 코드) → 401", async () => {
      const res = await postCsrf("/auth/mfa/totp/verify", {
        body: { mfaChallengeToken, code: "000000" },
      });
      expect(res.status).toBe(401);
    });

    it("POST /auth/mfa/totp/verify (유효 코드) → 200 + accessToken + refresh cookie", async () => {
      const code = authenticator.generate(totpSecret);
      const res = await postCsrf("/auth/mfa/totp/verify", {
        body: { mfaChallengeToken, code },
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      accessToken = res.body.accessToken as string;
    });

    it("POST /auth/mfa/totp/disable (유효 코드) → 200", async () => {
      const code = authenticator.generate(totpSecret);
      const res = await postCsrf("/auth/mfa/totp/disable", {
        bearer: accessToken,
        body: { code },
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("POST /auth/signin (MFA 비활성화 후) → 200 + accessToken (정상 세션)", async () => {
      const res = await postCsrf("/auth/signin", { body: { email, password } });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body.status).toBeUndefined();
    });
  });

  describe("Passkey 수직 슬라이스", () => {
    const email = `passkey-${Date.now()}@example.com`;
    const password = "PasskeyTest123!";
    let accessToken: string;

    it("POST /auth/signup → 201 (passkey 등록 전 계정 생성)", async () => {
      const res = await postCsrf("/auth/signup", { body: { email, password } });
      expect(res.status).toBe(201);
      accessToken = res.body.accessToken as string;
    });

    it("POST /auth/passkey/register/options (Bearer) → 200 + challengeToken + options", async () => {
      const res = await postCsrf("/auth/passkey/register/options", { bearer: accessToken });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("challengeToken");
      expect(res.body).toHaveProperty("options");
      expect(typeof res.body.challengeToken).toBe("string");
    });

    it("POST /auth/passkey/register/options (인증 없음) → 401", async () => {
      const res = await request(server).post("/auth/passkey/register/options");
      expect(res.status).toBe(401);
    });

    it("POST /auth/passkey/authenticate/options → 200 + challengeToken + options", async () => {
      const res = await postCsrf("/auth/passkey/authenticate/options");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("challengeToken");
      expect(res.body).toHaveProperty("options");
    });

    it("POST /auth/passkey/register/verify (잘못된 payload) → 400", async () => {
      const res = await postCsrf("/auth/passkey/register/verify", {
        bearer: accessToken,
        body: { bad: "payload" },
      });
      expect(res.status).toBe(400);
    });

    it("POST /auth/passkey/authenticate/verify (잘못된 payload) → 400", async () => {
      const res = await postCsrf("/auth/passkey/authenticate/verify", {
        body: { bad: "payload" },
      });
      expect(res.status).toBe(400);
    });
  });
});
