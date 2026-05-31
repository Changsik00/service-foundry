---
type: reference
aliases: ["@repo/frontend-ui", "공유 UI 컴포넌트"]
tags: [service-foundry, reference, frontend]
---

# @repo/frontend-ui — shadcn 스타일 공유 React 컴포넌트 레지스트리

> 💡 **한 줄 요약**: Tailwind v4 + Radix UI 기반 Button/Card/Form/Input/Toaster 등 공유 컴포넌트 + `cn()` 유틸.
> **위치**: `packages/frontend/ui` · **상위**: [[architecture]]

## 책임 (Responsibility)

모노레포 내 Next.js/Vite 앱들이 공유하는 UI 컴포넌트 레지스트리다. `class-variance-authority`로 변형(variant)을 정의하고, `react-hook-form` + `@repo/validation` Zod 스키마와 통합된 `Form` 컴포넌트를 제공한다. 별도 CSS entry(`./styles.css`)를 통해 Tailwind globals를 주입한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `cn(...inputs)` | fn | `clsx` + `tailwind-merge` 클래스 병합 유틸 |
| `Button`, `ButtonProps`, `buttonVariants` | component | CVA 기반 버튼 |
| `Input`, `InputProps` | component | 기본 입력 필드 |
| `Label`, `LabelProps` | component | Radix Label 래퍼 |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | component | 카드 레이아웃 |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` | component | react-hook-form 통합 폼 |
| `Toaster`, `toast` | component/fn | sonner 기반 토스트 |
| `ThemeProvider`, `ThemeProviderProps`, `useTheme` | component/hook | 다크모드 테마 컨텍스트 |
| `HealthCard`, `HealthCardProps`, `HealthData` | component/type | 헬스체크 상태 표시 블록 |
| `ThemeToggle` | component | 테마 토글 버튼 |
| `./styles.css` | CSS entry | Tailwind globals import 포인트 |

## 의존

- 내부: [[config-tailwind-config]], [[shared-validation]]
- 외부: `react-hook-form`, `@hookform/resolvers`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `sonner`, `tailwindcss`
- peer: `react`, `react-dom`, `next-themes` (optional), `zod`

## 사용 예

```tsx
// globals.css 또는 layout.tsx
import "@repo/frontend-ui/styles.css";

import { Button, Form, FormField, toast } from "@repo/frontend-ui";
```

## 연결된 개념

- [[config-tailwind-config]] — Tailwind preset + globals CSS
- [[shared-validation]] — Zod 폼 검증 통합 (`@hookform/resolvers/zod`)
- [[adr/0015-framework-adapter-naming-and-layout]] — 패키지 위치 결정

> 소스: spec-04-01 · `packages/frontend/ui/src/index.ts`
