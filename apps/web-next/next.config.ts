import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript ESM 소스를 직접 노출하는 workspace 패키지 목록.
  // 새 @repo/frontend-* 패키지 추가 시 여기에 함께 추가할 것.
  transpilePackages: [
    "@repo/frontend-ui",
    "@repo/errors",
    "@repo/frontend-http-client",
    "@repo/frontend-auth-react",
    "@repo/frontend-auth-testing",
    "@repo/frontend-auth-firebase",
    "@repo/frontend-auth-supabase",
    "@repo/auth-contracts",
  ],
  webpack(config) {
    // TypeScript ESM 컨벤션: 소스 파일은 .ts/.tsx 이지만 import 경로는 .js 로 작성.
    // webpack 은 .js 확장자를 그대로 찾으므로 아래 alias 로 .ts/.tsx 도 탐색하게 함.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
