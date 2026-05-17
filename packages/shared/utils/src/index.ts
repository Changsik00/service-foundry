/**
 * @repo/utils — Shared, framework-agnostic utilities.
 *
 * - Zero runtime dependencies (zod is allowed at this layer but not required here).
 * - No Node-only APIs — must be safe in both Node and browser bundles.
 * - Single-entry export; consumers tree-shake what they need.
 */

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const pick = <T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.hasOwn(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
};

export const omit = <T extends object, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Omit<T, K> => {
  const result = { ...source } as T;
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
};

/**
 * Discriminated-union Result type for explicit success/failure.
 *
 * Helpers are function-form (no method chaining, no `unwrap`).
 * Branch with `isOk(r)` / `isErr(r)` for safe narrowing.
 * See ADR-0008.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(
  result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } => result.ok;

export const isErr = <T, E>(
  result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } => !result.ok;

export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  result.ok ? ok(fn(result.value)) : result;

export const flatMap = <T, U, E, F>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, F>,
): Result<U, E | F> => (result.ok ? fn(result.value) : result);
