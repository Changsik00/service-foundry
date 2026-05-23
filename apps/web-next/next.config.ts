import type { NextConfig } from "next";

// Next.js 16 — Turbopack 기본 활성화.
// Turbopack 은 TypeScript ESM workspace 패키지를 네이티브로 처리하므로
// transpilePackages 불필요. 추가 시 Turbopack route scanner 오작동 → 404.
const nextConfig: NextConfig = {};

export default nextConfig;
