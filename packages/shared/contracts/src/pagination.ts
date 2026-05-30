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
// TDD 스텁 — 구현은 Green 단계.
export function encodeCursor(_value: unknown): string {
  throw new Error("not implemented");
}
export function decodeCursor<T>(_cursor: string): T | null {
  throw new Error("not implemented");
}
