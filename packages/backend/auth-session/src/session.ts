import { AppError } from "@repo/errors";
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
  | { type: "not_found" };

// stub — TDD Green 단계에서 구현
export async function createSession(
  _store: SessionStore,
  _input: CreateSessionInput,
): Promise<CreateSessionResult> {
  throw new AppError({ code: "INTERNAL", message: "not implemented", statusCode: 500 });
}

export async function rotateSession(
  _store: SessionStore,
  _presentedToken: string,
): Promise<RotateResult> {
  throw new AppError({ code: "INTERNAL", message: "not implemented", statusCode: 500 });
}

export async function revokeSession(_store: SessionStore, _sessionId: string): Promise<void> {
  throw new AppError({ code: "INTERNAL", message: "not implemented", statusCode: 500 });
}

export { generateRefreshToken, hashToken };
