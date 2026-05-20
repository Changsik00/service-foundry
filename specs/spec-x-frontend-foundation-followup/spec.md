# spec-x-frontend-foundation-followup: phase-04 의 *논의 가치 이연* 3 항목 정리

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-frontend-foundation-followup` |
| **Phase** | (없음 — spec-x) |
| **Branch** | `spec-x-frontend-foundation-followup` |
| **상태** | Planning |
| **타입** | Feature (bundle) |
| **작성일** | 2026-05-20 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

phase-04 ship 시점에 *6 이연 항목* 중 **3 항목 (논의 가치)** 박았음:
- TanStack Query (web-next)
- HealthCard 공통 추출
- Dark mode toggle UI

사용자 협의 — *"이연 왜 많지?"* → A 채택 (phase PR 머지 + follow-up 정정).

### 문제점

- **TanStack Query 비대칭** — phase-04.md 가 *"tanstack-query + sdk + ui"* 명시했는데 web-next 는 *RSC 만* 박음. *client interaction* 부재
- **HealthCard 중복** — web-next + web-vite 가 *복사 + 분기 추가* 박음 (loading prop 차이). DRY 위반
- **Dark mode UI 부재** — `@repo/tailwind-config` 의 `.dark` CSS variable 박혀있지만 *toggle UI 없음* — light/dark 전환 불가

### 해결 방안 (요약)

3 항목 단일 spec-x bundle. **사용자 결정** (3 항목 모두 추천 채택):

1. **HealthCard → `@repo/frontend-ui/blocks/health-card.tsx`** (기존 패키지 확장, 새 패키지 안 박음)
2. **TanStack Query (web-next)** — `'use client'` HealthCardClient + `useHealthQuery` 패턴 (web-vite 와 동일 + RSC↔client hybrid 진짜 가치)
3. **Dark mode** — `next-themes` 채택 (Next.js 생태계 표준, SSR-safe, flash-of-wrong-theme 자동 방지, shadcn 공식 권장)

## 🎯 요구사항

### Functional Requirements

1. **HealthCard 공통 추출** (`@repo/frontend-ui`):
   - `packages/frontend/ui/src/blocks/health-card.tsx` 신설 — `loading` prop 포함 (web-vite 의 분기 답습, web-next 는 prop 없으면 *기본 동작*)
   - `index.ts` barrel export 갱신
   - `apps/web-next/src/components/health-card.tsx` 삭제 + import 정정
   - `apps/web-vite/src/components/health-card.tsx` 삭제 + import 정정
   - 단위 test 이동 — `packages/frontend/ui/src/blocks/health-card.test.tsx`

2. **TanStack Query (web-next)**:
   - `@tanstack/react-query` + `@tanstack/react-query-devtools` (선택) dependency 추가
   - `apps/web-next/src/components/providers.tsx` — `'use client'` + `QueryClientProvider` wrap
   - `apps/web-next/src/app/layout.tsx` — `<Providers>` 박음
   - `apps/web-next/src/lib/http-client.ts` — singleton (web-vite 답습, *client-safe*)
   - `apps/web-next/src/lib/queries.ts` — `useHealthQuery` hook (web-vite 답습)
   - `apps/web-next/src/components/health-card-client.tsx` — `'use client'` 컴포넌트 + `useHealthQuery`
   - 단, *page.tsx 는 RSC 유지* — *client component 가 그 안에서 마운트*. *RSC + client hybrid 패턴* 시연
   - 단위 test (jsdom) — `useHealthQuery` web-vite 답습

3. **Dark mode toggle**:
   - `next-themes` dependency (web-next + web-vite)
   - `apps/web-next/src/components/providers.tsx` — `<ThemeProvider>` 추가 (QueryClientProvider 와 함께)
   - `apps/web-next/src/app/layout.tsx` — `<html suppressHydrationWarning>` (next-themes 권장)
   - `apps/web-vite/src/main.tsx` — `<ThemeProvider>` 추가
   - `packages/frontend/ui/src/blocks/theme-toggle.tsx` — Button + sun/moon icon
   - `apps/web-next/src/routes/index.tsx` (web-vite) + `apps/web-next/src/app/page.tsx` (web-next) — `<ThemeToggle>` 박음 (page 우측 상단 또는 header)
   - 단위 test — `ThemeToggle` render

### Non-Functional Requirements

1. depcruise 0 violations
2. test 전체 PASS (기존 + 신규)
3. lint / typecheck 그린
4. `pnpm dev` 정상 부트 + 수동 검증 (`/health` 표시 + theme toggle 동작)

## 🚫 Out of Scope

- **TanStack Query devtools** — 별 spec (선택적)
- **HealthCard prefetch + HydrationBoundary 패턴** — *기본 client query* 만 박음, 고급 SSR 캐시 별 spec
- **Theme persistence cross-app** (web-next ↔ web-vite localStorage 공유): 별 spec
- **System theme 감지 외 더 풍부한 옵션** (예: 자동 시간 기반): next-themes 기본 동작 사용
- **i18n / SEO meta**: phase-04 ship 시 이연

## ✅ Definition of Done

- [ ] `@repo/frontend-ui/blocks/health-card.tsx` 신설 + index.ts export
- [ ] `apps/web-next/src/components/health-card.tsx` 삭제 + import 정정
- [ ] `apps/web-vite/src/components/health-card.tsx` 삭제 + import 정정
- [ ] TanStack Query (web-next): `<QueryClientProvider>` + `useHealthQuery` + `HealthCardClient`
- [ ] `next-themes` 도입 (web-next + web-vite) + `<ThemeProvider>` wrap + `<ThemeToggle>` UI
- [ ] 단위 테스트 PASS (HealthCard ui 패키지 안 / useHealthQuery web-next / ThemeToggle)
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` 그린
- [ ] `pnpm exec depcruise` 0 violations
- [ ] `pnpm dev` 정상 부트 + 수동 검증
- [ ] walkthrough.md / pr_description.md 작성 및 ship commit
- [ ] PR 생성 (base = `main`)
- [ ] 사용자 검토 요청 알림 완료
