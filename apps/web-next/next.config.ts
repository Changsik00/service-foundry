import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript ESM 소스를 직접 노출하는 workspace 패키지 목록.
  // ⚠ Turbopack: web-next/package.json 에 직접 설치된 패키지만 추가할 것.
  //   미설치 패키지를 여기에 넣으면 Turbopack 이 silently fail → 모든 route 404 됨.
  transpilePackages: [
    "@repo/frontend-ui",
    "@repo/errors",
    "@repo/frontend-http-client",
    "@repo/frontend-auth-react",
    "@repo/frontend-auth-testing",
    "@repo/auth-contracts",
    "@repo/utils",
  ],
};

export default nextConfig;
