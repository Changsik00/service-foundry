import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// 루트 .env 로드 (apps/web/기준 ../../ = monorepo root)
// CI에서는 이미 환경변수로 주입되므로 override: false
config({ path: resolve(process.cwd(), "../../.env"), override: false });

const nextConfig: NextConfig = {
  // unprefixed 루트 변수 → NEXT_PUBLIC_* 매핑 (브라우저 번들 노출)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY ?? "",
    NEXT_PUBLIC_API_BASE_URL: process.env.API_BASE_URL ?? "",
  },
};

export default nextConfig;
