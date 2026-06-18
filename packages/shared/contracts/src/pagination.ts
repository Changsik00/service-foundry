import { type ZodType, z } from "zod";

/** 페이지네이션 기본/최대 limit (단일 출처). */
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const paginatedResponse = <T>(itemSchema: ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1).max(PAGINATION_MAX_LIMIT),
    total: z.number().int().min(0),
  });

// === offset/cursor 요청 query (spec-13-01) === //
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_MAX_LIMIT)
    .default(PAGINATION_DEFAULT_LIMIT),
});
export type PaginationQuery = z.output<typeof PaginationQuery>;

export const CursorQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(PAGINATION_MAX_LIMIT).default(PAGINATION_DEFAULT_LIMIT),
});
export type CursorQuery = z.output<typeof CursorQuery>;

/** 커서 페이지네이션 공통 입력 (서비스 레이어 — 도메인별 결과 키는 유지). */
export interface CursorPaginationParams {
  search?: string;
  cursor?: string;
  limit?: number;
}

/** cursor 응답 envelope (무한 스크롤). */
export const cursorPaginatedResponse = <T>(itemSchema: ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });

// === opaque cursor 코덱 (spec-13-01) === //
// base64(URI-encoded JSON) — 브라우저/Node 공통 btoa/atob, 유니코드 안전.
export function encodeCursor(value: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(value)));
}

export function decodeCursor<T>(cursor: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(atob(cursor))) as T;
  } catch {
    return null;
  }
}
