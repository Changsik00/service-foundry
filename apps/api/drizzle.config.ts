import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/infra/schema/local.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // 마이그레이션은 owner/superuser 로 실행 — DATABASE_MIGRATE_URL 우선, 없으면 DATABASE_URL 폴백.
  // (런타임 app_runtime role 은 RLS 적용 대상이라 DDL/마이그레이션 권한이 없을 수 있다.)
  dbCredentials: { url: process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL ?? "" },
});
