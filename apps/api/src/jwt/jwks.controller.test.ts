import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const { JwtModule } = await import("./jwt.module.js");

describe("GET /.well-known/jwks.json", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it("200 응답 + JWKS 구조 { keys: JWK[] }", async () => {
    const res = await request(app.getHttpServer()).get("/.well-known/jwks.json");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      keys: expect.arrayContaining([
        expect.objectContaining({
          kty: "OKP",
          crv: "Ed25519",
          alg: "EdDSA",
          use: "sig",
          kid: expect.any(String),
        }),
      ]),
    });
  });

  it("private key (d) 미포함", async () => {
    const res = await request(app.getHttpServer()).get("/.well-known/jwks.json");
    const key = res.body.keys[0] as Record<string, unknown>;
    expect(key).not.toHaveProperty("d");
  });
});
