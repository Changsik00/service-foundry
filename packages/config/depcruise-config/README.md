# @repo/depcruise-config

> 모노레포 레이어 경계를 강제하는 공유 dependency-cruiser 프리셋.

## 설치 / import

```js
// .dependency-cruiser.cjs
const base = require("@repo/depcruise-config/base");

module.exports = {
  ...base,
  // 패키지별 추가 규칙
};
```

## 핵심 export

- `@repo/depcruise-config/base` (`base.cjs`) — `ARCHITECTURE.md §3` 레이어 경계 규칙 세트

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
