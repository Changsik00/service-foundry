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
