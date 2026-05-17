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
