import { randomUUID } from "node:crypto";

import type { SessionRow } from "./schema.js";
import type { SessionStore } from "./store.js";
import { generateRefreshToken, hashToken } from "./token.js";

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CreateSessionInput {
  userId: string;
  ttlMs?: number;
}

export interface CreateSessionResult {
  session: SessionRow;
  refreshToken: string;
}

export type RotateResult =
  | { type: "rotated"; session: SessionRow; refreshToken: string }
  | { type: "reuse_detected"; revokedCount: number }
  | { type: "expired" }
  | { type: "not_found" };

/**
 * `createSession` — 신규 session 생성.
 *
 * Family UUID 신규 발행 — 본 token 이 chain 의 root.
 * Raw token 은 *반환만* — DB 에는 SHA-256 hash 저장 (ADR-0014).
 */
export async function createSession(
  store: SessionStore,
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenFamily = randomUUID();
  const now = new Date();
  const ttl = input.ttlMs ?? DEFAULT_TTL_MS;

  const session = await store.insert({
    userId: input.userId,
    refreshTokenHash,
    refreshTokenFamily,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttl),
    revokedAt: null,
  });

  return { session, refreshToken };
}

/**
 * `rotateSession` — refresh token rotation (ADR-0013).
 *
 * 분기 4 개:
 * - unknown token → `not_found`
 * - revoked token 재제시 (reuse) → family 전체 revoke + `reuse_detected`
 * - `expiresAt < now` (만료) → `expired` (revoke 박지 않음, 그저 거부)
 * - active 정상 → 기존 revoke + 새 token (same family) → `rotated`
 *
 * **본 spec 은 minimal** — 시간 검증은 `expiresAt` 만. 정공법 추가 항목 (absolute timeout / inactivity timeout / device fingerprint / rate limit / concurrent rotation guard / user-wide revoke / audit log) 은 README.md 의 *Rotation 정공법 (미래 검토)* 절 참조.
 */
export async function rotateSession(
  store: SessionStore,
  presentedToken: string,
): Promise<RotateResult> {
  const presentedHash = hashToken(presentedToken);
  const existing = await store.findByHash(presentedHash);

  if (!existing) return { type: "not_found" };

  const now = new Date();

  if (existing.revokedAt !== null) {
    const revokedCount = await store.bulkRevokeByFamily(existing.refreshTokenFamily, now);
    return { type: "reuse_detected", revokedCount };
  }

  if (existing.expiresAt.getTime() < now.getTime()) {
    return { type: "expired" };
  }

  await store.updateRevoked(existing.id, now);
  const newToken = generateRefreshToken();
  const newSession = await store.insert({
    userId: existing.userId,
    refreshTokenHash: hashToken(newToken),
    refreshTokenFamily: existing.refreshTokenFamily,
    createdAt: now,
    expiresAt: new Date(now.getTime() + DEFAULT_TTL_MS),
    revokedAt: null,
  });

  return { type: "rotated", session: newSession, refreshToken: newToken };
}

/** `revokeSession` — 명시 revoke (signout 등). */
export async function revokeSession(store: SessionStore, sessionId: string): Promise<void> {
  await store.updateRevoked(sessionId, new Date());
}

export { generateRefreshToken, hashToken };
