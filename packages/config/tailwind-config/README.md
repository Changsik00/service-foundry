# @repo/tailwind-config

> Tailwind v4 CSS-first 공유 글로벌 스타일 + 프리셋 — 모든 프론트엔드 앱의 테마 토큰 단일 출처.

## 설치 / import

```css
/* globals.css (앱 진입 CSS) */
@import "@repo/tailwind-config/globals.css";
```

```ts
// tailwind.config.ts (선택 — content path / plugin 공유 시)
import preset from "@repo/tailwind-config/preset";
export default { presets: [preset] };
```

## 핵심 export

- `@repo/tailwind-config/globals.css` — `@theme` directive 기반 토큰 정의 (다크모드 포함)
- `@repo/tailwind-config/preset` — content path / plugin 공유용 JS 프리셋 (현재 minimal)

## 자세히

- 레퍼런스: [`docs/explainers/platform/config-packages-presets.md`](../../../docs/explainers/platform/config-packages-presets.md)
