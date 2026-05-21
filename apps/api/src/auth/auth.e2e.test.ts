import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");

describe("Auth E2E (real PG)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe("POST /auth/password/reset", () => {
    it("존재하지 않는 email → 200 (enumeration-safe)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password/reset")
        .send({ email: "ghost@example.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload → 422/400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password/reset")
        .send({ email: "not-an-email" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /auth/password/reset/confirm", () => {
    it("미존재 token → 200 (enumeration-safe)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password/reset/confirm")
        .send({ token: "nonexistent-token-aaaabbbbccccddddeeee", newPassword: "newPass123!" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload (짧은 token) → 422/400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/password/reset/confirm")
        .send({ token: "short", newPassword: "newPass123!" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /auth/email/verify/request", () => {
    it("미존재 email → 200 (enumeration-safe)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/email/verify/request")
        .send({ email: "ghost@example.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload → 422/400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/email/verify/request")
        .send({ email: "not-an-email" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("POST /auth/email/verify/confirm", () => {
    it("미존재 token → 200 (enumeration-safe)", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/email/verify/confirm")
        .send({ token: "nonexistent-token-aaaabbbbccccddddeeee" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: "ok" });
    });

    it("잘못된 payload (짧은 token) → 422/400", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/email/verify/confirm")
        .send({ token: "short" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("GET /.well-known/jwks.json", () => {
    it("JWKS 구조 반환 (keys 배열, OKP/Ed25519/EdDSA)", async () => {
      const res = await request(app.getHttpServer()).get("/.well-known/jwks.json");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("keys");
      expect(Array.isArray(res.body.keys)).toBe(true);
      expect(res.body.keys.length).toBeGreaterThan(0);
      const key = res.body.keys[0];
      expect(key).toMatchObject({ kty: "OKP", crv: "Ed25519", alg: "EdDSA", use: "sig" });
    });

    it("비공개키 'd' 미포함", async () => {
      const res = await request(app.getHttpServer()).get("/.well-known/jwks.json");
      for (const key of res.body.keys) {
        expect(key).not.toHaveProperty("d");
      }
    });
  });
});
