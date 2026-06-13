import { createHash, randomBytes } from "node:crypto";
import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DATABASE, type Database } from "@repo/nestjs-database";

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
  constructor(@Inject(DATABASE) private readonly database: Database<Record<string, unknown>>) {}

  async create(userId: string, orgId: string, name: string): Promise<ApiKeyCreated> {
    void userId;
    const raw = randomBytes(32).toString("hex");
    const plain = `sk_${raw}`;
    const preview = raw.slice(0, 8);
    const keyHash = hashKey(plain);

    const { rows } = await this.database.pool.query<ApiKeyRow>(
      `INSERT INTO api_keys (org_id, name, key_hash, key_preview)
       VALUES ($1, $2, $3, $4)
       RETURNING id, org_id, name, key_hash, key_preview, last_used_at, revoked_at, created_at`,
      [orgId, name, keyHash, preview],
    );

    const row = rows[0]!;
    return { ...toPublic(row), plain, preview };
  }

  async list(orgId: string): Promise<ApiKeyPublic[]> {
    const { rows } = await this.database.pool.query<ApiKeyRow>(
      `SELECT id, org_id, name, key_preview, last_used_at, revoked_at, created_at
       FROM api_keys
       WHERE org_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [orgId],
    );
    return rows.map(toPublic);
  }

  async revoke(id: string, orgId: string): Promise<void> {
    const { rows } = await this.database.pool.query<{ id: string }>(
      `UPDATE api_keys SET revoked_at = now()
       WHERE id = $1 AND org_id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [id, orgId],
    );
    if (!rows[0]) throw new ForbiddenException("api key not found");
  }

  async verifyKey(plain: string): Promise<ApiKeyPublic | null> {
    if (!plain.startsWith("sk_") || plain.length !== 67) return null;

    const keyHash = hashKey(plain);
    const { rows } = await this.database.pool.query<ApiKeyRow>(
      `SELECT id, org_id, name, key_preview, last_used_at, revoked_at, created_at
       FROM api_keys
       WHERE key_hash = $1 AND revoked_at IS NULL`,
      [keyHash],
    );

    const row = rows[0];
    if (!row) return null;

    await this.database.pool.query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [
      row.id,
    ]);

    return toPublic(row);
  }
}
