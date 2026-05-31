# @repo/tsup-config

> Node 라이브러리 패키지용 공유 tsup 빌드 프리셋 — ESM 단일 포맷 + `.d.ts` + sourcemap.

## 설치 / import

```ts
// tsup.config.ts
import { nodeLibPreset } from "@repo/tsup-config/node-lib";

export default nodeLibPreset({
  entry: ["src/index.ts"],
  // 필요 시 오버라이드
});
```

## 핵심 export

- `nodeLibPreset(overrides?)` — `@repo/tsup-config/node-lib` 에서 export. ESM, target `node22`, dts, sourcemap, treeshake 기본 설정

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
