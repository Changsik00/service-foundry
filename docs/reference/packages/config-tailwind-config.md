---
type: reference
aliases: ["@repo/tailwind-config", "tailwind 공유 프리셋"]
tags: [service-foundry, reference, config, tailwind]
---

# @repo/tailwind-config — monorepo 공용 Tailwind v4 CSS 프리셋

> 💡 **한 줄 요약**: shadcn 호환 디자인 토큰(light/dark)과 base 레이어를 `globals.css` 로 제공하는 Tailwind v4 CSS-first 프리셋.
> **위치**: `packages/config/tailwind-config` · **상위**: [[architecture]]

## 책임 (Responsibility)

Tailwind v4 의 CSS-first 패러다임(`@theme` directive)을 활용하여 전체 monorepo 프론트엔드 앱이 공통 디자인 토큰을 공유하도록 한다. `globals.css` 에는 shadcn 표준 CSS 변수(`--color-*`, `--font-*`, `--radius-*`) 및 dark mode 토글(`.dark` / `data-theme="dark"`)이 정의되어 있다. JS preset(`preset.ts`)은 v4 에서 content paths 자동 감지로 인해 현재 비어 있으며 향후 plugin/content 공유용 확장점이다.

## 제공 preset / export

| export | 파일 | 설명 |
|---|---|---|
| `./globals.css` | `src/globals.css` | shadcn 디자인 토큰 + dark mode + base 레이어 |
| `./preset` | `src/preset.ts` | JS preset 객체 (현재 `content: []` — 확장점) |

`globals.css` 주요 내용:

- `@import "tailwindcss"` — v4 core 임포트
- `@theme { ... }` — `--color-background/foreground/primary/secondary/muted/accent/destructive/border/input/ring`, `--font-sans/mono`, `--radius-sm/md/lg/xl`
- `.dark, [data-theme="dark"] { ... }` — 동일 변수 dark 값 재정의
- `@layer base` — `border-color`, `body` 기본 스타일

## 의존

- 내부: 없음 (런타임 의존 없음)
- 외부: `tailwindcss` v4 (direct dependency — CSS 번들링 시 필요, [[stack]])

## 사용 예

```css
/* apps/web/src/app/globals.css */
@import "@repo/tailwind-config/globals.css";

/* 이후 커스텀 토큰 override 가능 */
@theme {
  --color-primary: hsl(220 90% 50%);
}
```

```ts
// tailwind.config.ts (v4 JS 설정이 필요한 경우)
import { preset } from "@repo/tailwind-config/preset";
export default { presets: [preset] };
```

## 연결된 개념

- [[explainers/platform/config-packages-presets]] — 프리셋 패키지 동작 원리
- [[reference/architecture]] — 프론트엔드 레이어
- [[adr/0003-package-layout-and-naming|ADR-0003]] — 패키지 레이아웃

> 소스: spec-01-02 · `packages/config/tailwind-config/src/`
