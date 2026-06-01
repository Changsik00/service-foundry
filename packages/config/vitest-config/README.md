# @repo/vitest-config

> 패키지·앱 유형별 공유 Vitest 설정 프리셋 — Node 환경과 React(jsdom) 환경 각각 제공.

## 설치 / import

```ts
// vitest.config.ts (Node 패키지)
import { nodePreset } from "@repo/vitest-config/node";
export default nodePreset;

// vitest.config.ts (React 앱/패키지)
import { reactPreset } from "@repo/vitest-config/react";
export default reactPreset;
```

## 핵심 export

- `nodePreset` — `@repo/vitest-config/node`: `environment: "node"`, CI 타임아웃(30s), v8 커버리지
- `reactPreset` — `@repo/vitest-config/react`: `environment: "jsdom"`, v8 커버리지

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
