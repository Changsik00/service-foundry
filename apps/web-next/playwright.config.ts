import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// 루트 .env 로드 (apps/web-next/기준 ../../ = monorepo root)
// CI에서는 GitHub Actions 환경변수로 이미 주입됨 (파일 없어도 무시)
config({ path: resolve(process.cwd(), "../../.env"), override: false });

function passIfSet(key: string): Record<string, string> {
  const val = process.env[key];
  return val ? { [key]: val } : {};
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:2027",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // apps/api — NestJS 백엔드 (AUTH_MODE=supabase)
      command: "pnpm dev",
      cwd: "../api",
      url: "http://localhost:2026/health",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: "2026",
        AUTH_MODE: "supabase",
        HTTP_CLIENT_BASE_URL: "http://localhost:2026",
        CORS_ORIGIN: "http://localhost:2027",
        ...passIfSet("DATABASE_URL"),
        ...passIfSet("SUPABASE_URL"),
      },
    },
    {
      // apps/web-next — Next.js 프론트엔드
      command: "pnpm dev",
      url: "http://localhost:2027",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        // RSC는 process.env에서 직접 읽으므로 NEXT_PUBLIC_* 이름으로 명시 전달
        NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? "",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
        NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL ?? "",
        // 서버사이드(env.ts)에서 unprefixed API_BASE_URL도 읽음
        ...passIfSet("API_BASE_URL"),
      },
    },
  ],
});
