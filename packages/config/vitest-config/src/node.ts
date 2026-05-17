import { defineConfig } from "vitest/config";

export const nodePreset = defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.{test,spec}.ts", "src/**/__tests__/**"],
    },
    reporters: process.env.CI ? ["default", "github-actions"] : ["default"],
  },
});

export default nodePreset;
