import { ForbiddenException, Injectable } from "@nestjs/common";
import { hashToken } from "@repo/backend-auth-session";

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
  constructor(@InjectSessionStore() private readonly sessionStore: SessionStore) {}

  async listSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
    const rows = await this.sessionStore.listActiveByUser(userId);
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      orgId: row.orgId,
      current: currentHash !== null && row.refreshTokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const row = await this.sessionStore.findById(sessionId);
    if (!row || row.userId !== userId) {
      throw new ForbiddenException("해당 세션에 접근할 권한이 없습니다");
    }
    await this.sessionStore.updateRevoked(sessionId, new Date());
  }

  async revokeOtherSessions(userId: string, currentRefreshToken?: string): Promise<void> {
    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    await this.sessionStore.revokeOthers(userId, currentHash);
  }
}
