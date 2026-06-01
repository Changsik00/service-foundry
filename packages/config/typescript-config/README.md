# @repo/typescript-config

> 모노레포 공유 TypeScript 설정 프리셋 — 패키지·앱 유형별 `tsconfig.json` 기반.

## 설치 / import

```json
// 라이브러리 패키지 tsconfig.json
{ "extends": "@repo/typescript-config/library" }

// NestJS 앱 tsconfig.json
{ "extends": "@repo/typescript-config/nestjs" }

// Next.js / Vite 앱 tsconfig.json
{ "extends": "@repo/typescript-config/react-app" }

// Node CLI / worker tsconfig.json
{ "extends": "@repo/typescript-config/node-app" }
```

## 핵심 export

- `@repo/typescript-config/base` — 전체 공통 기반 (`ES2023`, strict)
- `@repo/typescript-config/library` — tsup 빌드 라이브러리용 (`packages/backend/*` 등)
- `@repo/typescript-config/nestjs` — NestJS 앱용 (decorators 활성화)
- `@repo/typescript-config/react-app` — Next.js / Vite SPA 앱용 (JSX 포함)
- `@repo/typescript-config/node-app` — Node CLI / worker 앱용

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
