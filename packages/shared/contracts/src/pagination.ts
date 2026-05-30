import { type ZodType, z } from "zod";

export const paginatedResponse = <T>(itemSchema: ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
  });

// === offset/cursor 요청 query (spec-13-01) === //
export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.output<typeof PaginationQuery>;

export const CursorQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CursorQuery = z.output<typeof CursorQuery>;

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
