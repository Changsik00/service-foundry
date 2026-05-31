import { defineConfig } from "vitest/config";

export const nodePreset = defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.{test,spec}.ts"],
    // CI 러너(2-core)는 실제 crypto(argon2/bcrypt) · Nest 부트스트랩이 느려 기본 5s 를 넘긴다.
    testTimeout: process.env.CI ? 30_000 : 10_000,
    hookTimeout: process.env.CI ? 30_000 : 10_000,
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
