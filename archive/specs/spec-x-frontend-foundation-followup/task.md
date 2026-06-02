# Task List: spec-x-frontend-foundation-followup

> 3 항목 bundle. spec-x — main 직접 PR.

## Pre-flight

- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 (sdd specx new 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-x-frontend-foundation-followup` (시작: `main`)
- Commit 없음

---

## Task 2: catalog 갱신 (next-themes)

- [ ] `pnpm-workspace.yaml` catalog 에 `next-themes` 추가
- [ ] `pnpm install`
- [ ] Commit: `chore(spec-x): catalog 에 next-themes 추가`

---

## Task 3: HealthCard 공통 추출 (@repo/frontend-ui/blocks)

- [ ] `packages/frontend/ui/src/blocks/health-card.tsx` 박음 (web-vite 답습 + loading 분기 통합)
- [ ] `packages/frontend/ui/src/blocks/health-card.test.tsx` (3 test)
- [ ] `packages/frontend/ui/src/index.ts` barrel — HealthCard / HealthCardProps / HealthData
- [ ] `apps/web-next/src/components/health-card.tsx` 삭제 + page.tsx import 정정
- [ ] `apps/web-vite/src/components/health-card.tsx` 삭제 + routes/index.tsx import 정정
- [ ] apps/web-vite test 의 health-card.test.tsx 도 삭제 (ui 패키지가 보유)
- [ ] apps/web-next test 의 health-card.test.tsx 도 삭제 (ui 패키지가 보유)
- [ ] `pnpm test` PASS — 단위 test ui 패키지 안 박힘
- [ ] Commit: `refactor(spec-x): HealthCard 를 @repo/frontend-ui/blocks 로 이동 (중복 해소)`

---

## Task 4: TanStack Query (web-next) 도입

- [ ] `apps/web-next/package.json` dependencies — `@tanstack/react-query` 추가
- [ ] `apps/web-next/src/components/providers.tsx` — `'use client'` + QueryClientProvider
- [ ] `apps/web-next/src/lib/http-client.ts` (singleton — `'use client'` ok)
- [ ] `apps/web-next/src/lib/queries.ts` (useHealthQuery)
- [ ] `apps/web-next/src/components/health-card-client.tsx` (`'use client'` + useHealthQuery + HealthCard)
- [ ] `apps/web-next/src/app/layout.tsx` — `<Providers>` wrap
- [ ] `apps/web-next/src/app/page.tsx` — RSC HealthCard 유지 + `<HealthCardClient>` 도 표시 (hybrid 시연)
- [ ] 단위 test — `queries.test.tsx` (web-vite 답습)
- [ ] `pnpm --filter @apps/web-next typecheck && test` PASS
- [ ] Commit: `feat(spec-x): TanStack Query (web-next) — client component + useHealthQuery + RSC hybrid`

---

## Task 5: Dark mode toggle (next-themes)

### 5-1. ThemeToggle component
- [ ] `packages/frontend/ui/package.json` peerDependencies — `next-themes` 추가
- [ ] `packages/frontend/ui/src/blocks/theme-toggle.tsx` (`'use client'` + useTheme + Button + sun/moon)
- [ ] `packages/frontend/ui/src/blocks/theme-toggle.test.tsx` (render + click → setTheme)
- [ ] index.ts barrel export
- [ ] Commit: `feat(spec-x): ThemeToggle component (@repo/frontend-ui/blocks)`

### 5-2. web-next ThemeProvider + ThemeToggle 박음
- [ ] `apps/web-next/package.json` dependencies — `next-themes` 추가
- [ ] `apps/web-next/src/components/providers.tsx` — `<ThemeProvider>` wrap (QueryClientProvider 외부)
- [ ] `apps/web-next/src/app/layout.tsx` — `<html suppressHydrationWarning>`
- [ ] `apps/web-next/src/app/page.tsx` — `<ThemeToggle>` 박음
- [ ] 부트 검증 (수동)

### 5-3. web-vite ThemeProvider + ThemeToggle 박음
- [ ] `apps/web-vite/package.json` dependencies — `next-themes`
- [ ] `apps/web-vite/src/main.tsx` — `<ThemeProvider>` wrap
- [ ] `apps/web-vite/src/routes/index.tsx` — `<ThemeToggle>` 박음
- [ ] 부트 검증 (수동)

- [ ] Commit: `feat(spec-x): next-themes + ThemeToggle 박음 (web-next + web-vite)`

---

## Task 6: 통합 검증

- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` PASS
- [ ] `pnpm exec depcruise` 0 violations
- [ ] `pnpm dev` 부트 검증 — 3 app + ThemeToggle 동작 + HealthCard 표시
- [ ] `sdd test passed`
- [ ] Commit: 없음 (검증만, 필요시 정정 1)

---

## Task 7: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push + PR (base = main)
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task** | 7 |
| **예상 commit** | 6 (T2 catalog + T3 HealthCard 이동 + T4 Query + T5-1 ThemeToggle + T5-2/3 wire-up + T7 ship; T1/T6 commit 없음) |
| **현재 단계** | Planning (Plan Accept 대기) |
