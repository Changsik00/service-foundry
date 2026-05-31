# @repo/backend-settings

> `@env-kit/node-settings`와 Zod 기반 `BaseBackendSchema`를 re-export하고 config 마스킹 유틸리티를 제공하는 framework-agnostic 설정 패키지.

## 설치 / import
```ts
import { BaseBackendSchema, defineSettings, maskConfig } from "@repo/backend-settings";
```

## 핵심 API
- `BaseBackendSchema` — `NODE_ENV`, `PORT`, `LOG_LEVEL` 공통 최소 Zod 스키마; `.extend()`로 앱별 확장
- `defineSettings(schema, env)` — 스키마 검증 후 설정 객체 반환 (env-kit re-export)
- `maskConfig(settings, options?)` — 로그 출력 시 민감 키 마스킹

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-settings.md`](../../../docs/reference/packages/backend-settings.md)
