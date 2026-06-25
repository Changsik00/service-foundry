import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, Inject, Injectable, Logger } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { sql } from "drizzle-orm";

export interface ApiKeyPublic {
  id: string;
  orgId: string;
  name: string;
  keyPreview: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyCreated extends ApiKeyPublic {
  plain: string;
  preview: string;
}

type ApiKeyRow = {
  id: string;
  org_id: string;
  name: string;
  key_preview: string;
  last_used_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
};

function toPublic(row: ApiKeyRow): ApiKeyPublic {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    keyPreview: row.key_preview,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

function hashKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async create(userId: string, orgId: string, name: string): Promise<ApiKeyCreated> {
    void userId;
    const raw = randomBytes(32).toString("hex");
    const plain = `sk_${raw}`;
    const preview = raw.slice(0, 8);
    const keyHash = hashKey(plain);

    // org-scoped 쓰기는 요청 tenant tx(database.db)로 — app.current_org 설정되어 RLS 적용(backstop).
    // raw pool 은 tx-local 컨텍스트를 못 받아 RLS permissive 가 됨(spec-26-04 B). WHERE org_id 는 defense-in-depth.
    const result = await this.database.db.execute(sql`
      INSERT INTO api_keys (org_id, name, key_hash, key_preview)
      VALUES (${orgId}, ${name}, ${keyHash}, ${preview})
      RETURNING id, org_id, name, key_hash, key_preview, last_used_at, revoked_at, created_at`);

    const row = (result.rows as ApiKeyRow[])[0]!;
    return { ...toPublic(row), plain, preview };
  }

  async list(orgId: string): Promise<ApiKeyPublic[]> {
    // RLS backstop: tenant tx 경유(database.db). WHERE org_id 는 defense-in-depth.
    const result = await this.database.db.execute(sql`
      SELECT id, org_id, name, key_preview, last_used_at, revoked_at, created_at
      FROM api_keys
      WHERE org_id = ${orgId} AND revoked_at IS NULL
      ORDER BY created_at DESC`);
    return (result.rows as ApiKeyRow[]).map(toPublic);
  }

  async revoke(id: string, orgId: string): Promise<void> {
    // RLS backstop: tenant tx 경유(database.db). WHERE org_id 는 defense-in-depth.
    const result = await this.database.db.execute(sql`
      UPDATE api_keys SET revoked_at = now()
      WHERE id = ${id} AND org_id = ${orgId} AND revoked_at IS NULL
      RETURNING id`);
    if (!(result.rows as { id: string }[])[0]) throw new ForbiddenException("api key not found");
  }

  async verifyKey(plain: string): Promise<ApiKeyPublic | null> {
    if (!plain.startsWith("sk_") || plain.length !== 67) return null;

    // pre-auth 경로(ApiKeyGuard, 인터셉터 이전 실행) — 아직 org 컨텍스트가 없고,
    // 시크릿(key_hash)으로 전-org 조회해 어느 org 인지 *확정*하는 단계라 raw pool 이 적절(의도적).
    const keyHash = hashKey(plain);
    const { rows } = await this.database.pool.query<ApiKeyRow>(
      `SELECT id, org_id, name, key_preview, last_used_at, revoked_at, created_at
       FROM api_keys
       WHERE key_hash = $1 AND revoked_at IS NULL`,
      [keyHash],
    );

    const row = rows[0];
    if (!row) return null;

    // last_used_at 갱신은 인증 핫패스를 막지 않도록 비차단(fire-and-forget). 실패는 로깅만.
    void this.database.pool
      .query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [row.id])
      .catch((err) => this.logger.warn(`api-key last_used_at 갱신 실패: ${err}`));

    return toPublic(row);
  }
}
