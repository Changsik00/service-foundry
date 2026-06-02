# Implementation Plan: spec-x-frontend-foundation-followup

## 📋 Branch Strategy

- 신규 브랜치: `spec-x-frontend-foundation-followup` (시작: `main`)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **HealthCard → `@repo/frontend-ui/blocks/`** (기존 패키지 확장)
> - [x] **TanStack Query (web-next)**: `'use client'` + `useHealthQuery` (web-vite 패턴 답습, RSC↔client hybrid)
> - [x] **Dark mode**: `next-themes` (Next 생태계 표준)

> [!WARNING]
> - [ ] web-next 의 `page.tsx` 는 *RSC 유지* — `HealthCardClient` 는 *client component* 로 *그 안 마운트*. SSR HTML 안 *그 클라이언트 컴포넌트의 mount point* 박힘
> - [ ] `<html suppressHydrationWarning>` — next-themes 의 *권장 패턴* (theme attr 차이 무시)
> - [ ] HealthCard 추출 시 web-next/vite import 정정 필요 (각자 1 file)

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **HealthCard 위치** | `@repo/frontend-ui/blocks/health-card.tsx` | 기존 패키지 확장, monorepo 가치 |
| **HealthCard `loading` prop** | 박음 (web-vite 답습) | 옵션 — 호출자 책임. web-next 는 RSC 라 안 박음 / web-vite 는 client query 라 박음 |
| **TanStack Query (web-next) 패턴** | `'use client'` 컴포넌트 + RSC page.tsx 가 마운트 | *진짜 hybrid* 시연 |
| **QueryClientProvider 위치** | `providers.tsx` (`'use client'`) — layout 안 박음 | Next App Router 표준 |
| **`useHealthQuery` 위치** | `apps/web-next/src/lib/queries.ts` (web-vite 와 동일 패턴) | 공통화는 *별 spec* — 본 spec 은 *복사 + 분기 가치 확인* |
| **next-themes 시점** | layout 안 `<ThemeProvider>` wrap (next-next), main.tsx 안 (web-vite) | 표준 |
| **`<ThemeToggle>` 위치** | `@repo/frontend-ui/blocks/theme-toggle.tsx` | UI primitive 와 분리 (block) |
| **icon** | `lucide-react` (shadcn 표준) | 다만 별 dep 추가 — 평가 후 결정 (또는 *Unicode emoji* 박음 — 의존성 0) |
| **catalog 신규** | `next-themes`, (선택) `lucide-react` | minimal |

## 📂 Proposed Changes

### `@repo/frontend-ui` 확장

#### [NEW] `packages/frontend/ui/src/blocks/health-card.tsx`
- web-next 의 health-card.tsx + web-vite 의 `loading` 분기 통합
- props: `{ data?, error?, loading? }` 4 분기 (loading / error / data / null)

#### [NEW] `packages/frontend/ui/src/blocks/health-card.test.tsx`
- web-vite 의 test 답습 (3 — loading / data / error)

#### [NEW] `packages/frontend/ui/src/blocks/theme-toggle.tsx`
- `'use client'`
- `useTheme()` (next-themes) + Button (frontend-ui) + sun/moon icon
- click → setTheme("light" / "dark")

#### [NEW] `packages/frontend/ui/src/blocks/theme-toggle.test.tsx`
- render + click 시 setTheme 호출 검증

#### [MODIFY] `packages/frontend/ui/package.json`
- `next-themes`: peerDependencies (Next 와 React 환경 지원)
- (옵션) `lucide-react`: dependencies

#### [MODIFY] `packages/frontend/ui/src/index.ts`
- barrel export 갱신: `HealthCard`, `HealthCardProps`, `HealthData`, `ThemeToggle`

### `apps/web-next`

#### [DELETE] `apps/web-next/src/components/health-card.tsx`
- @repo/frontend-ui/blocks 사용

#### [NEW] `apps/web-next/src/components/providers.tsx`
- `'use client'`
- `<ThemeProvider>` (next-themes) + `<QueryClientProvider>` wrap

#### [NEW] `apps/web-next/src/lib/http-client.ts`
- singleton createHttpClient (web-vite 답습)

#### [NEW] `apps/web-next/src/lib/queries.ts`
- `useHealthQuery` (web-vite 답습)

#### [NEW] `apps/web-next/src/components/health-card-client.tsx`
- `'use client'` 컴포넌트 + `useHealthQuery` + `<HealthCard>` 전달

#### [MODIFY] `apps/web-next/src/app/layout.tsx`
- `<html lang="ko" suppressHydrationWarning>` 박음
- `<Providers>` wrap

#### [MODIFY] `apps/web-next/src/app/page.tsx`
- 기존 RSC fetch 유지 + `<HealthCardClient>` 도 *함께* 렌더 (RSC + client hybrid 시연)
- 또는 *page.tsx 자체* 를 *client query 패턴으로 변경* — 사용자 결정 (본 plan: RSC + client *둘 다* 보여줌)
- `<ThemeToggle>` 박음 (header 또는 우측 상단)

#### [MODIFY] `apps/web-next/package.json`
- dependencies: `@tanstack/react-query`, `next-themes`

### `apps/web-vite`

#### [DELETE] `apps/web-vite/src/components/health-card.tsx`
- @repo/frontend-ui/blocks 사용

#### [MODIFY] `apps/web-vite/src/main.tsx`
- `<ThemeProvider>` (next-themes) wrap — QueryClientProvider 외부

#### [MODIFY] `apps/web-vite/src/routes/index.tsx`
- `<HealthCard>` 는 `@repo/frontend-ui/blocks` import
- `<ThemeToggle>` 박음

#### [MODIFY] `apps/web-vite/package.json`
- dependencies: `next-themes`

### catalog 갱신

#### [MODIFY] `pnpm-workspace.yaml`
- `next-themes: ^0.4.x` (또는 install 시점 최신)
- (옵션) `lucide-react: ^0.5xx.x`

## 🧪 검증

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
pnpm dev
# 브라우저:
# - http://localhost:2026/health (api JSON)
# - http://localhost:2027 (web-next: RSC Card + client Card + ThemeToggle)
# - http://localhost:2028 (web-vite: client Card + ThemeToggle)
# - ThemeToggle click 시 light/dark 전환 + localStorage 동기화
```

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough / pr_description ship
