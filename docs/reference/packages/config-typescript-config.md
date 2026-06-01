---
type: reference
aliases: ["@repo/typescript-config", "typescript tsconfig 프리셋"]
tags: [service-foundry, reference, config, typescript]
---

# @repo/typescript-config — monorepo 공용 TypeScript tsconfig 프리셋 모음

> 💡 **한 줄 요약**: base·library·nestjs·node-app·react-app 5종 tsconfig 를 제공해 패키지 유형별 TypeScript 설정을 표준화하는 프리셋.
> **위치**: `packages/config/typescript-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

워크스페이스 내 모든 패키지가 `extends` 로 재사용할 수 있는 5개의 tsconfig JSON 파일을 관리한다. `base.json` 이 공통 엄격 옵션(strict, noImplicitOverride, noUncheckedIndexedAccess, exactOptionalPropertyTypes)과 NodeNext 모듈 해석을 정의하고, 나머지 4개는 이를 extends 하여 패키지 유형에 맞게 조정한다.

## 제공 preset / export

| export | 파일 | 대상 | 주요 특징 |
|---|---|---|---|
| `./base` | `base.json` | 공통 베이스 | strict 풀셋, NodeNext, ES2023, declarationMap |
| `./library` | `library.json` | `packages/backend/*` 등 라이브러리 | `noEmit: false`, `outDir: ./dist`, `rootDir: ./src` |
| `./nestjs` | `nestjs.json` | NestJS 어댑터 패키지 | `experimentalDecorators`, `emitDecoratorMetadata`, `useDefineForClassFields: false` |
| `./node-app` | `node-app.json` | `apps/api`, `apps/worker` | `noEmit: true`, `types: ["node"]` |
| `./react-app` | `react-app.json` | `apps/web-*`, `apps/admin` | DOM lib, `jsx: react-jsx`, Bundler 모듈 해석, unused 검사 |

`base.json` 의 핵심 옵션:

- 모듈: `module: NodeNext`, `moduleResolution: NodeNext`, `verbatimModuleSyntax: true`
- 타입 안전: `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`
- 출력: `declaration: true`, `declarationMap: true`, `sourceMap: true`, `incremental: false`

## 의존

- 내부: 없음
- 외부: `typescript` (호출 패키지 devDependency, [[stack]])

## 사용 예

```json
// packages/backend/auth-session/tsconfig.json
{
  "extends": "@repo/typescript-config/library",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*.ts"]
}
```

```json
// apps/api/tsconfig.json
{
  "extends": "@repo/typescript-config/node-app"
}
```

```json
// packages/nestjs/auth/tsconfig.json
{
  "extends": "@repo/typescript-config/nestjs",
  "compilerOptions": { "outDir": "./dist" }
}
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 컴파일 전략
- [[adr/0004-typescript-and-compilation-strategy|ADR-0004]] — TypeScript·컴파일 전략 결정
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/typescript-config/`
