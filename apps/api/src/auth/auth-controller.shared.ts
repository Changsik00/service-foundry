import { BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { ZodError, type z } from "zod";

import type { UserRow } from "../infra/schema/index.js";

// ── Swagger inline schemas (auth 컨트롤러 군 공유) ────────────────────────────

export const S_User = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
    email: { type: "string", format: "email", example: "user@example.com" },
    role: { type: "string", enum: ["user", "admin"], example: "user" },
    createdAt: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
  },
  required: ["id", "email", "role", "createdAt"],
};

export const S_SignResponse = {
  type: "object",
  description: "로그인·회원가입·토큰 갱신 공통 응답",
  properties: {
    accessToken: {
      type: "string",
      description: "JWT Bearer token. Authorization: Bearer <token> 헤더에 포함. 기본 만료: 15분.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
    user: S_User,
    csrfToken: {
      type: "string",
      description: "변경성 요청(POST/PATCH/DELETE) 시 X-Csrf-Token 헤더에 포함 필요.",
      example: "abc123xyz",
    },
  },
  required: ["accessToken", "user", "csrfToken"],
};

export const S_SessionInfo = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid", example: "550e8400-e29b-41d4-a716-446655440000" },
    createdAt: { type: "string", format: "date-time", example: "2024-01-01T00:00:00.000Z" },
    expiresAt: { type: "string", format: "date-time", example: "2024-01-31T00:00:00.000Z" },
    orgId: {
      type: "string",
      format: "uuid",
      nullable: true,
      example: "660e8400-e29b-41d4-a716-446655440000",
      description: "활성 org 컨텍스트 없으면 null.",
    },
    current: {
      type: "boolean",
      description: "현재 요청을 보낸 세션(refresh_token 쿠키 기준)이면 true.",
      example: true,
    },
  },
  required: ["id", "createdAt", "expiresAt", "current"],
};

export const S_StatusOk = {
  type: "object",
  properties: { status: { type: "string", enum: ["ok"], example: "ok" } },
  required: ["status"],
};

// ── 공유 헬퍼 ─────────────────────────────────────────────────────────────────

export function zodPipe<T>(schema: z.ZodType<T>) {
  return {
    transform(value: unknown): T {
      try {
        return schema.parse(value);
      } catch (err) {
        if (err instanceof ZodError) throw new BadRequestException(err.issues);
        throw err;
      }
    },
  };
}

export function getContext(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.ip ?? "unknown",
    userAgent: (req.headers["user-agent"] as string | undefined) ?? "unknown",
  };
}

export type SignResponse = {
  accessToken: string;
  user: Pick<UserRow, "id" | "email" | "role" | "createdAt">;
  csrfToken: string;
};
export type SignInResponse = SignResponse | { status: "mfa_required"; mfaChallengeToken: string };
