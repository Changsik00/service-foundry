import { defineConfig, type Options } from "tsup";

/**
 * Preset for Node-runtime library packages (consumed by apps that run via `node`).
 * ESM only — see ADR-0002 / ADR-0004.
 */
export const nodeLibPreset = (overrides: Partial<Options> = {}): Options =>
  defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    ...overrides,
  }) as Options;

export default nodeLibPreset;
