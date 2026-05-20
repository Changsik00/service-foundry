# Implementation Plan: spec-04-01 frontend-ui

## 📋 Branch Strategy

- 신규 브랜치: `spec-04-01-frontend-ui`
- 시작 지점: `phase-04-frontend-foundation` (Phase Base Branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **tailwind 위치 (Icebox 해소)**: 공유 preset (`@repo/tailwind-config`) 채택
> - [x] **tailwind 버전**: v4 (CSS-first)
> - [x] **shadcn 패턴**: shared ui registry (`@repo/frontend-ui` 가 components 보유)
> - [x] **#19 Phase 4 후보 채택**: `sonner` + `react-hook-form` (Form 통합) — 본 spec 안 박음

> [!WARNING]
> - [ ] tailwind v4 는 `@tailwindcss/vite` (Vite) + `@tailwindcss/postcss` (Next.js) — 양쪽 plugin 다름. spec-04-03/04 진입 시 confirm 필요
> - [ ] `react: ^19` peer dep — Next.js 15 / Vite 5+ 호환 (locked stack memory). 단 `@testing-library/react` v16+ 만 React 19 호환
> - [ ] tailwind v4 의 `@theme` directive — *CSS 파일에서* config. 기존 v3 의 `tailwind.config.ts` 와 패러다임 다름. dev 가 *학습 가치* 인지 또는 *부담* 인지 인지 필요

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```mermaid
flowchart TB
    subgraph cfg["packages/config/tailwind-config (신규)"]
        Globals["globals.css (@theme tokens)"]
        Preset["preset (선택, JS export)"]
    end

    subgraph ui["packages/frontend/ui (신규)"]
        CN["lib/utils.ts (cn)"]
        Comp["components/* (Button, Input, Label, Card, Form, Toaster)"]
        Index["src/index.ts (barrel export)"]
    end

    ui -.|@import in styles.css|.-> cfg
    Comp -->|CVA + Radix| Deps[("class-variance-authority<br/>@radix-ui/react-*<br/>react-hook-form<br/>@hookform/resolvers<br/>sonner<br/>clsx + tailwind-merge")]
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **tailwind 위치** | `@repo/tailwind-config` 공유 preset | Icebox 해소 — monorepo 표준 패턴, 일관 테마 + 앱별 자유 |
| **tailwind 버전** | v4 (CSS-first) | 장기 자산. shadcn v4 호환. `@theme` directive 박음 |
| **shadcn 패턴** | shared ui registry | `packages/frontend/ui` 가 components 보유 — monorepo 가치 |
| **`components.json`** | `packages/frontend/ui` 에 박음 | shadcn `add` 명령 호환 |
| **컴포넌트 build** | tsc / *no build* (raw .tsx export) | service-foundry 의 *workspace dep src 노출* 패턴 답습 — Next.js / Vite 가 transpile |
| **Form 통합** | react-hook-form + `@hookform/resolvers/zod` | shadcn 공식. `@repo/validation` zod schema 재사용 |
| **Toaster** | sonner | shadcn 생태계 표준. `<Toaster />` 1줄 |
| **`cn` util** | clsx + tailwind-merge | shadcn 표준 — class 병합 + tailwind 중복 해소 |
| **Radix primitives** | per-component 박음 (Label / Slot 등 필요시) | shadcn add 패턴 답습 |
| **CSS variables** | `--background`, `--foreground`, `--primary` 등 (shadcn 표준) | light/dark mode 토대 — dark toggle 은 별 spec |
| **test 환경** | vitest + jsdom + `@testing-library/react` | `@repo/vitest-config/node` 와 별도 — `@repo/vitest-config/react` 신설 (또는 인라인) |
| **`'use client'`** | 모든 component | Next.js App Router Server Component 안 import 자연 |

### 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — ADR 격상 후보는 phase-04 ship 시점 또는 spec-04-NN 답습 후 검토

## 📂 Proposed Changes

### `@repo/tailwind-config` (신규)

#### [NEW] `packages/config/tailwind-config/package.json`
```json
{
  "name": "@repo/tailwind-config",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./globals.css": "./src/globals.css",
    "./preset": "./src/preset.ts",
    "./package.json": "./package.json"
  },
  "dependencies": {
    "tailwindcss": "catalog:"
  }
}
```

#### [NEW] `packages/config/tailwind-config/src/globals.css`
```css
@import "tailwindcss";

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(240 10% 3.9%);
  --color-primary: hsl(240 5.9% 10%);
  --color-primary-foreground: hsl(0 0% 98%);
  /* ... shadcn 표준 CSS variables */
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: hsl(240 10% 3.9%);
    /* ... dark mode */
  }
}
```

#### [NEW] `packages/config/tailwind-config/src/preset.ts`
- `content` paths preset (호출자 가 자체 content 추가)
- *optional* — v4 는 대부분 `@theme` 안에서 처리, preset 의 의미 적음. 필요시 박음

### `@repo/frontend-ui` (신규)

#### [NEW] `packages/frontend/ui/package.json`
```json
{
  "name": "@repo/frontend-ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./styles.css": "./src/styles.css",
    "./package.json": "./package.json"
  },
  "scripts": {
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "catalog:",
    "@radix-ui/react-label": "catalog:",
    "@radix-ui/react-slot": "catalog:",
    "@repo/tailwind-config": "workspace:*",
    "@repo/validation": "workspace:*",
    "class-variance-authority": "catalog:",
    "clsx": "catalog:",
    "react-hook-form": "catalog:",
    "sonner": "catalog:",
    "tailwind-merge": "catalog:",
    "tailwindcss": "catalog:"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*",
    "@testing-library/jest-dom": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "jsdom": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "zod": "catalog:"
  }
}
```

#### [NEW] `packages/frontend/ui/tsconfig.json`
- `jsx: "preserve"` (Next.js 가 trans), `lib: ["DOM", "DOM.Iterable", "ES2022"]`
- `@repo/typescript-config/base` extends

#### [NEW] `packages/frontend/ui/vitest.config.ts`
- `@repo/vitest-config/react` (신설) 또는 인라인 `environment: "jsdom"` + `setupFiles: ["./vitest.setup.ts"]`

#### [NEW] `packages/frontend/ui/vitest.setup.ts`
- `import "@testing-library/jest-dom/vitest"`

#### [NEW] `packages/frontend/ui/src/styles.css`
- `@import "@repo/tailwind-config/globals.css"` (호출자가 이 파일 import)

#### [NEW] `packages/frontend/ui/src/lib/utils.ts`
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

#### [NEW] `packages/frontend/ui/src/components/button.tsx`
- shadcn Button (CVA + Slot)
- variant: default/destructive/outline/secondary/ghost/link
- size: default/sm/lg/icon

#### [NEW] `packages/frontend/ui/src/components/input.tsx`
- baseline text input

#### [NEW] `packages/frontend/ui/src/components/label.tsx`
- Radix Label wrap

#### [NEW] `packages/frontend/ui/src/components/card.tsx`
- Card / CardHeader / CardTitle / CardDescription / CardContent / CardFooter

#### [NEW] `packages/frontend/ui/src/components/form.tsx`
- shadcn Form (react-hook-form 통합)
- `Form` / `FormField` / `FormItem` / `FormLabel` / `FormControl` / `FormDescription` / `FormMessage`

#### [NEW] `packages/frontend/ui/src/components/toaster.tsx`
- sonner `Toaster` wrap — default options (richColors / position 등)
- export `toast` from sonner

#### [NEW] `packages/frontend/ui/src/index.ts`
- barrel export: utils + 모든 components

#### [NEW] `packages/frontend/ui/components.json`
- shadcn CLI 호환:
  ```json
  {
    "style": "default",
    "tailwind": { "css": "src/styles.css", "baseColor": "neutral" },
    "rsc": true,
    "aliases": { "components": "./src/components", "utils": "./src/lib/utils" }
  }
  ```

### `@repo/vitest-config` (확장)

#### [NEW] `packages/config/vitest-config/react.ts`
- jsdom environment + setupFiles + react plugin 박음
- node preset 과 별도 export

### 단위 테스트

#### [NEW] `packages/frontend/ui/src/components/button.test.tsx`
- render Button → 텍스트 + class 확인
- variant prop → 적절 class 적용
- asChild prop → Slot 동작

#### [NEW] `packages/frontend/ui/src/components/form.test.tsx`
- `useForm` + `zodResolver` 패턴
- submit → onValid 호출 / submit invalid → onInvalid 호출

#### [NEW] `packages/frontend/ui/src/components/toaster.test.tsx`
- Toaster render + smoke (toast 호출 후 DOM 검증)

#### [NEW] `packages/frontend/ui/src/lib/utils.test.ts`
- `cn` 병합 동작 — clsx + tailwind-merge

### catalog 갱신

#### [MODIFY] `pnpm-workspace.yaml`
catalog 신규:
- `tailwindcss: ^4.0.0`
- `@tailwindcss/postcss: ^4.0.0` (Next.js)
- `@tailwindcss/vite: ^4.0.0` (Vite, spec-04-04 진입 시 사용)
- `react: ^19.1.0`
- `react-dom: ^19.1.0`
- `@types/react: ^19.1.0`
- `@types/react-dom: ^19.1.0`
- `class-variance-authority: ^0.7.1`
- `clsx: ^2.1.1`
- `tailwind-merge: ^3.4.0`
- `@radix-ui/react-label: ^2.1.4`
- `@radix-ui/react-slot: ^1.1.4`
- `react-hook-form: ^7.66.0`
- `@hookform/resolvers: ^5.3.0`
- `sonner: ^2.0.7`
- `jsdom: ^28.0.0`
- `@testing-library/react: ^17.0.0`
- `@testing-library/jest-dom: ^6.10.0`

### depcruise (검토)

#### [MAYBE] `packages/config/depcruise-config/base.cjs`
- 기존 `frontend-no-react` 룰 확인 — `packages/frontend/*` → `react` import 허용해야 함 (frontend 패키지가 react 쓰는 게 자연)
- 룰 충돌 시 정정 commit (별 task)

## 🧪 검증 계획

### 단위 테스트
```bash
pnpm --filter @repo/frontend-ui test  # vitest jsdom Button/Form/Toaster
pnpm test                              # 전체
```

### 수동 검증
1. `grep "export.*Button\|export.*Form\|export.*Toaster" packages/frontend/ui/src/index.ts` — 4+ hit
2. `cat packages/frontend/ui/components.json` — shadcn `add` 호환 확인
3. `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .` — 0 violations
4. `pnpm lint && pnpm typecheck` — 모두 그린

## 🔁 Rollback Plan

- 본 spec 은 *신규 패키지 2개 추가* — 기존 코드 영향 0
- 롤백 시 PR revert + catalog 정리. 영향 0

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
