import { type AppError, validationError } from "@repo/errors";
import { err, ok, type Result } from "@repo/utils";
import { type ZodError, type ZodType, z } from "zod";

export const Uuid = z.uuid();

export const Email = z.email();

export const Pagination = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.input<typeof Pagination>;
export type PaginationOutput = z.output<typeof Pagination>;

export const fromZodError = (error: ZodError, message = "Validation failed"): AppError => {
  const errors = error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
  return validationError(message, { errors });
};

export const parse = <T>(
  schema: ZodType<T>,
  data: unknown,
  message?: string,
): Result<T, AppError> => {
  const result = schema.safeParse(data);
  return result.success ? ok(result.data) : err(fromZodError(result.error, message));
};
