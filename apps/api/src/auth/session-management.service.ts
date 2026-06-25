import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { hashToken } from "@repo/backend-auth-session";
import { organizations } from "@repo/backend-schema";
import { DATABASE, type Database } from "@repo/nestjs-database";
import { inArray } from "drizzle-orm";

import { InjectSessionStore, type SessionStore } from "./session.stores.js";

export interface SessionInfo {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  orgId: string | null;
  current: boolean;
}

@Injectable()
export class SessionManagementService {
  constructor(
    @InjectSessionStore() private readonly sessionStore: SessionStore,
    @Inject(DATABASE) private readonly database: Database<Record<string, unknown>>,
  ) {}

  async listSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
    const rows = await this.sessionStore.listActiveByUser(userId);
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    // 내부 org id → org public_id 매핑(외부 노출은 public_id, ADR-0028).
    const orgPublicById = await this.resolveOrgPublicIds(
      rows.map((r) => r.orgId).filter((v): v is string => v !== null),
    );
    return rows.map((row) => ({
      id: row.publicId, // 외부 식별자 = session public_id
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      orgId: row.orgId ? (orgPublicById.get(row.orgId) ?? null) : null,
      current: currentHash !== null && row.refreshTokenHash === currentHash,
    }));
  }

  /** sessionPublicId(외부) 로 revoke — 소유 userId 검증(IDOR 안전). */
  async revokeSession(userId: string, sessionPublicId: string): Promise<void> {
    const row = await this.sessionStore.findByPublicId(sessionPublicId);
    if (!row || row.userId !== userId) {
      throw new ForbiddenException("해당 세션에 접근할 권한이 없습니다");
    }
    await this.sessionStore.updateRevoked(row.id, new Date());
  }

  private async resolveOrgPublicIds(internalOrgIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const distinct = [...new Set(internalOrgIds)];
    if (distinct.length === 0) return map;
    const rows = await this.database.db
      .select({ id: organizations.id, publicId: organizations.publicId })
      .from(organizations)
      .where(inArray(organizations.id, distinct));
    for (const r of rows) map.set(r.id, r.publicId);
    return map;
  }

  async revokeOtherSessions(userId: string, currentRefreshToken?: string): Promise<void> {
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    await this.sessionStore.revokeOthers(userId, currentHash);
  }
}
