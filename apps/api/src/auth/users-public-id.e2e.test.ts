import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ID_PREFIX, publicId } from "@repo/backend-id";
import { createDatabase } from "@repo/nestjs-database";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * users.public_id 검증 (spec-26-02).
 *
 * 컬럼·DB 함수를 raw SQL 로 직접 검증 — 타입 비결합(컬럼 미존재 시 런타임 RED).
 * 생성 권위 = DB-side gen_public_id(prefix): drizzle insert + raw INSERT 모두 자동 채움.
 */
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://app_runtime:test@localhost:5434/test";
process.env.DATABASE_MIGRATE_URL ??= "postgres://postgres:test@localhost:5434/test";
process.env.HTTP_CLIENT_BASE_URL ??= "http://localhost:9999";

const { AppModule } = await import("../app.module.js");
const { configureApp } = await import("../app.setup.js");

const PUBLIC_ID_RE = /^usr_[0-9A-HJKMNP-TV-Z]{26}$/;

function extractCookie(setCookie: string | string[] | undefined, name: string): string {
  const headers = Array.isArray(setCookie) ? setCookie : [setCookie ?? ""];
  const entry = headers.find((h) => h.startsWith(`${name}=`));
  if (!entry) throw new Error(`Cookie '${name}' not found`);
  return entry.split(";")[0] ?? entry;
}

describe("users.public_id (DB gen_public_id default)", () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication["getHttpServer"]>;
  let owner: ReturnType<typeof createDatabase>["pool"];

  async function signup(email: string): Promise<string> {
    const csrf = await request(server).get("/auth/csrf");
    const token = csrf.body.csrfToken as string;
    const idCookie = extractCookie(csrf.headers["set-cookie"], "csrf_id");
    const res = await request(server)
      .post("/auth/signup")
      .set("X-Csrf-Token", token)
      .set("Cookie", idCookie)
      .send({ email, password: "Passw0rd!123" });
    expect(res.status).toBe(201);
    return res.body.user.id as string;
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

  it("signup 한 user 는 형식에 맞는 public_id 를 가진다", async () => {
    const userId = await signup(`pubid-${Date.now()}@example.com`);
    const r = await owner.query<{ public_id: string }>(
      "SELECT public_id FROM users WHERE id = $1",
      [userId],
    );
    expect(r.rows[0]?.public_id).toMatch(PUBLIC_ID_RE);
  });

  it("raw INSERT (public_id 미지정) 도 DEFAULT 로 채워진다", async () => {
    const r = await owner.query<{ public_id: string }>(
      "INSERT INTO users (email) VALUES ($1) RETURNING public_id",
      [`rawins-${Date.now()}@example.com`],
    );
    expect(r.rows[0]?.public_id).toMatch(PUBLIC_ID_RE);
  });

  it("SQL gen_public_id 와 TS publicId 의 출력 구조가 동일하다 (포맷 parity)", async () => {
    const shape = (s: string) => {
      const [prefix, body = ""] = s.split("_");
      return { prefix, len: body.length, crockford: /^[0-9A-HJKMNP-TV-Z]+$/.test(body) };
    };
    const sql = await owner.query<{ v: string }>("SELECT gen_public_id('usr') AS v");
    const sqlId = sql.rows[0]?.v ?? "";
    const tsId = publicId(ID_PREFIX.user);
    expect(shape(sqlId)).toEqual(shape(tsId)); // 같은 prefix/길이/문자집합
    expect(shape(sqlId)).toEqual({ prefix: "usr", len: 26, crockford: true });
  });

  it("서로 다른 user 의 public_id 는 유일하다", async () => {
    const stamp = Date.now();
    const a = await signup(`uniq-a-${stamp}@example.com`);
    const b = await signup(`uniq-b-${stamp}@example.com`);
    const r = await owner.query<{ public_id: string }>(
      "SELECT public_id FROM users WHERE id = ANY($1::uuid[])",
      [[a, b]],
    );
    const ids = r.rows.map((x) => x.public_id);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
