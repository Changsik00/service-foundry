import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // src/*.ts 를 직접 노출하는 workspace 패키지 — .js → .tsx 매핑을 번들러에게 알려야 함.
  transpilePackages: ["@repo/frontend-ui", "@repo/errors", "@repo/frontend-http-client"],
};

export default nextConfig;
