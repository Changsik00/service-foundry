import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabase } from "@repo/nestjs-database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * organizations.public_id 검증 (spec-26-05).
 * 컬럼·DB 함수를 raw SQL 로 직접 검증 — 타입 비결합(컬럼 미존재 시 런타임 RED).
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

const ORG_PUBLIC_ID_RE = /^org_[0-9A-HJKMNP-TV-Z]{26}$/;

function extractCookie(setCookie: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("organizations.public_id (DB gen_public_id default)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;
  let owner: ReturnType<typeof createDatabase>["pool"];

  async function signupOrgId(email: string): Promise<string> {
    const csrf = await request(server).get("/auth/csrf");
    const token = csrf.body.csrfToken as string;
    const idCookie = extractCookie(csrf.headers["set-cookie"], "csrf_id");
    const res = await request(server)
      .post("/auth/signup")
      .set("X-Csrf-Token", token)
      .set("Cookie", idCookie)
      .send({ email, password: "Passw0rd!123" });
    expect(res.status).toBe(201);
    const r = await owner.query<{ org_id: string }>(
      "SELECT m.org_id FROM memberships m JOIN users u ON m.user_id = u.id WHERE u.email = $1 LIMIT 1",
      [email],
    );
    return r.rows[0]?.org_id as string;
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

  it("signup 시 생성된 개인 org 는 형식에 맞는 public_id 를 가진다", async () => {
    const orgId = await signupOrgId(`org-pubid-${Date.now()}@example.com`);
    const r = await owner.query<{ public_id: string }>(
      "SELECT public_id FROM organizations WHERE id = $1",
      [orgId],
    );
    expect(r.rows[0]?.public_id).toMatch(ORG_PUBLIC_ID_RE);
  });

  it("raw INSERT (public_id 미지정) 도 DEFAULT 로 채워진다", async () => {
    // owner 시드용 — ownerId 는 임의 user 필요. 직전 signup 의 user 재사용.
    const email = `org-rawins-${Date.now()}@example.com`;
    const orgId = await signupOrgId(email);
    const ownerRow = await owner.query<{ owner_id: string }>(
      "SELECT owner_id FROM organizations WHERE id = $1",
      [orgId],
    );
    const r = await owner.query<{ public_id: string }>(
      "INSERT INTO organizations (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING public_id",
      [`raw-${Date.now()}`, `slug-${Date.now()}`, ownerRow.rows[0]?.owner_id],
    );
    expect(r.rows[0]?.public_id).toMatch(ORG_PUBLIC_ID_RE);
  });
});
