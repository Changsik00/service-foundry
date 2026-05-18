import { type ZodType, z } from "zod";

export const paginatedResponse = <T>(itemSchema: ZodType<T>) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().min(1),
    perPage: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
  });
