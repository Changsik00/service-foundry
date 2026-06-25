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

// list/create 응답용 행 — 외부 식별자(public_id) + org public_id 조인.
type ApiKeyPublicRow = {
  public_id: string;
  org_public_id: string;
  name: string;
  key_preview: string;
  last_used_at: Date | null;
  revoked_at: Date | null;
  created_at: Date;
};

function toPublic(row: ApiKeyPublicRow): ApiKeyPublic {
  return {
    id: row.public_id,
    orgId: row.org_public_id,
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
    // org-scoped 쓰기는 요청 tenant tx(database.db)로 — app.current_org 설정되어 RLS 적용(backstop).
    // 응답 식별자는 public_id, orgId 는 org public_id(서브쿼리). 내부 org id 미노출(ADR-0028).
    const result = await this.database.db.execute(sql`
      INSERT INTO api_keys (org_id, name, key_hash, key_preview)
      VALUES (${orgId}, ${name}, ${keyHash}, ${preview})
      RETURNING public_id,
        (SELECT public_id FROM organizations WHERE id = api_keys.org_id) AS org_public_id,
        name, key_preview, last_used_at, revoked_at, created_at`);

    const row = (result.rows as ApiKeyPublicRow[])[0]!;
    return { ...toPublic(row), plain, preview };
  }

  async list(orgId: string): Promise<ApiKeyPublic[]> {
    // RLS backstop: tenant tx 경유(database.db). WHERE org_id 는 defense-in-depth.
    const result = await this.database.db.execute(sql`
      SELECT k.public_id, o.public_id AS org_public_id, k.name, k.key_preview,
        k.last_used_at, k.revoked_at, k.created_at
      FROM api_keys k
      JOIN organizations o ON o.id = k.org_id
      WHERE k.org_id = ${orgId} AND k.revoked_at IS NULL
      ORDER BY k.created_at DESC`);
    return (result.rows as ApiKeyPublicRow[]).map(toPublic);
  }

  /** 외부 식별자(public_id)로 revoke — org 스코프 매칭(IDOR 안전). */
  async revoke(publicId: string, orgId: string): Promise<void> {
    // RLS backstop: tenant tx 경유(database.db). WHERE org_id 는 defense-in-depth.
    const result = await this.database.db.execute(sql`
      UPDATE api_keys SET revoked_at = now()
      WHERE public_id = ${publicId} AND org_id = ${orgId} AND revoked_at IS NULL
      RETURNING public_id`);
    if (!(result.rows as { public_id: string }[])[0]) {
      throw new ForbiddenException("api key not found");
    }
  }

  /**
   * API key 인증 — ApiKeyGuard 가 호출. 반환 id/orgId 는 **내부 uuid**:
   * guard 가 req.user.orgId 로 RLS 컨텍스트(app.current_org)를 설정하므로 내부 id 여야 한다.
   * (외부 노출 경로 아님 — list/create 만 public_id.)
   */
  async verifyKey(plain: string): Promise<{ id: string; orgId: string } | null> {
    if (!plain.startsWith("sk_") || plain.length !== 67) return null;

    // pre-auth 경로(ApiKeyGuard, 인터셉터 이전 실행) — 아직 org 컨텍스트가 없고,
    // 시크릿(key_hash)으로 전-org 조회해 어느 org 인지 *확정*하는 단계라 raw pool 이 적절(의도적).
    const keyHash = hashKey(plain);
    const { rows } = await this.database.pool.query<{ id: string; org_id: string }>(
      `SELECT id, org_id FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
      [keyHash],
    );

    const row = rows[0];
    if (!row) return null;

    // last_used_at 갱신은 인증 핫패스를 막지 않도록 비차단(fire-and-forget). 실패는 로깅만.
    void this.database.pool
      .query(`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, [row.id])
      .catch((err) => this.logger.warn(`api-key last_used_at 갱신 실패: ${err}`));

    return { id: row.id, orgId: row.org_id };
  }
}
