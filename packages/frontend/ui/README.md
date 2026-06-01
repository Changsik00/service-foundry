# @repo/frontend-ui

> Tailwind v4 + Radix UI 기반 Button/Card/Form/Input/Toaster 등 공유 컴포넌트 + `cn()` 유틸.

## 설치 / import
```ts
// globals.css 또는 layout.tsx
import "@repo/frontend-ui/styles.css";

import { Button, Card, Form, FormField, Input, Label, Toaster, toast, ThemeProvider, useTheme, cn } from "@repo/frontend-ui";
```

## 핵심 API
- `cn(...inputs)` — `clsx` + `tailwind-merge` 클래스 병합 유틸
- `Button` / `buttonVariants` — CVA 기반 버튼 컴포넌트
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` — 카드 레이아웃 컴포넌트
- `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` — `react-hook-form` 통합 폼
- `Input`, `Label` — 기본 입력 필드 및 레이블
- `Toaster` / `toast` — sonner 기반 토스트 알림
- `ThemeProvider` / `useTheme` / `ThemeToggle` — 다크모드 테마 컨텍스트
- `HealthCard` — 헬스체크 상태 표시 블록
- `./styles.css` — Tailwind globals import 포인트

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-ui.md`](../../../docs/reference/packages/frontend-ui.md)
