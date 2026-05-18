import { z } from "zod";

export const Uuid = z.uuid();

export const Email = z.email();

export const Pagination = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.input<typeof Pagination>;
export type PaginationOutput = z.output<typeof Pagination>;
