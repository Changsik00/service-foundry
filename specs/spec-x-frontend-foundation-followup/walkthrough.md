# Walkthrough: spec-x-frontend-foundation-followup

> phase-04 의 *논의 가치 이연 3 항목* bundle. HealthCard 중복 해소 + TanStack Query (web-next) + Dark mode toggle.

## 📌 결정

| 이슈 | 해결 |
|---|---|
| HealthCard 위치 | `@repo/frontend-ui/blocks/health-card.tsx` (기존 패키지 확장) |
| TanStack Query (web-next) 패턴 | `'use client'` HealthCardClient + RSC page hybrid |
| Dark mode | `next-themes` (SSR-safe, system 감지, localStorage 자동) |
| ThemeToggle icon | Unicode emoji (☀️🌙) — dep 0 |
| client env (web-next) | `NEXT_PUBLIC_API_BASE_URL` 추가 — server-only `API_BASE_URL` 과 분리 |
| ThemeProvider 위치 | web-next: providers.tsx outer / web-vite: main.tsx outer (QueryClient 외부) |
| matchMedia mock | vitest.setup 에 추가 (jsdom 부재) |

## 💬 사용자 협의

| 시점 | 결정 |
|---|---|
| phase-04 ship 후 follow-up | "순서대로" — A (bundle) |
| HealthCard 위치 | A: @repo/frontend-ui/blocks |
| TanStack Query 패턴 | A: 'use client' + useQuery |
| Dark mode 라이브러리 | A: next-themes |
| Plan Accept | 즉시 |

## 🔁 진행

### T1 — 브랜치
- `git checkout -b spec-x-frontend-foundation-followup`

### T2 — catalog next-themes (`9fbe16c`)
- pnpm-workspace.yaml catalog: `next-themes ^0.4.6`
- spec/plan/task 문서 + queue auto-update 동봉

### T3 — HealthCard 공통 추출 (`cea7d4f`)
- `@repo/frontend-ui/blocks/health-card.tsx` 신설 (loading / error / data / null 4 분기)
- test 4 (web-vite 답습 + null 추가)
- index.ts barrel 갱신 — HealthCard / HealthCardProps / HealthData
- web-next + web-vite 의 *복사본 + test* 삭제 + import 정정 (@repo/frontend-ui)

### T4 — TanStack Query (web-next) (`355e73b`)
- `@tanstack/react-query` dependency 추가
- `NEXT_PUBLIC_API_BASE_URL` env 추가 (env.example + env.ts schema)
- `src/components/providers.tsx`: 'use client' QueryClientProvider (useState)
- `src/lib/http-client.ts`: 'use client' singleton (NEXT_PUBLIC_ env)
- `src/lib/queries.ts`: useHealthQuery (web-vite 답습)
- `src/components/health-card-client.tsx`: 'use client' + useHealthQuery + HealthCard
- `src/app/layout.tsx`: `<Providers>` + `suppressHydrationWarning`
- `src/app/page.tsx`: RSC HealthCard *그대로* + `<HealthCardClient>` 추가 → **RSC + client hybrid 시연**

### T5-1 — ThemeToggle component (`154c1fc`)
- `@repo/frontend-ui/blocks/theme-toggle.tsx`:
  - `'use client'` + `useTheme()` (next-themes)
  - mounted state — hydration mismatch 회피
  - sun (☀️) / moon (🌙) emoji + aria-label 토글
- test 2: render / click 토글
- vitest.setup.ts: `window.matchMedia` mock (next-themes 가 호출)
- peerDependencies: next-themes ^0.4.0 (optional via peerDependenciesMeta)

### T5-2/5-3 — web-next + web-vite wire-up (`aa35919`)
- 각 app package.json: `next-themes` catalog
- web-next providers.tsx: `<ThemeProvider>` outer wrap
- web-vite main.tsx: `<ThemeProvider>` outer wrap (QueryClient 외부)
- 두 app 의 page/route 안 `<ThemeToggle>` 박음 (absolute top-right)

### T6 — 통합 검증
- lint ✓ 20 tasks
- typecheck ✓ 20 tasks FULL TURBO
- test ✓ **181** PASS (HealthCard 4 신규 + ThemeToggle 2 신규, 기존 web-next/vite health-card test 6 삭제 = +0 -6 = -6, ui 12 → 18 = +6, total 183 - 8 + 6 = 181)
- depcruise ✓ 0 violations (130 modules / 189 deps)

### T7 — Ship (본 commit)

## 🧪 검증 결과

### test 분포

| 패키지 | 신규 | 비고 |
|---|---|---|
| `@repo/frontend-ui` | HealthCard 4 (loading/data/error/null) + ThemeToggle 2 | 12 → 18 |
| `@apps/web-next` | (변경 없음 — 기존 2 health-card test 삭제) | 2 → 0 |
| `@apps/web-vite` | (변경 없음 — 기존 6 health-card test 삭제) | 6 → 0 |
| 기타 14 패키지 | 변경 없음 | 동일 |
| **합계** | **181 PASS** | 이전 183 → +0 -2 (test 위치 이동) |

### depcruise

```
✔ no dependency violations found (130 modules, 189 dependencies cruised)
```

## 🔍 발견 사항

1. **`window.matchMedia` jsdom 부재** — next-themes 가 client 안에서 호출 → jsdom 환경 fail. **해결**: vitest.setup.ts 에 mock. 후속 client-lib (theme / responsive 등) 답습 패턴.

2. **NEXT_PUBLIC_ env 분리** — server-only `API_BASE_URL` (RSC) vs client `NEXT_PUBLIC_API_BASE_URL` (client component). dev 시 동일 URL, prod 시 server (docker internal) vs client (public) 분리 가능. boilerplate 의 *프로덕션-grade pattern* 박음.

3. **`@repo/frontend-ui` optional peer (next-themes)** — frontend-ui 가 *항상* next-themes 의존 박지 않음 — ThemeToggle 만 사용. `peerDependenciesMeta.optional: true` 박아 *theme 사용 안 하는 호출자* 도 호환.

4. **mounted state (hydration mismatch 회피)** — next-themes 의 `useTheme()` 가 *SSR 안에서 undefined* 반환 → hydration mismatch. `useEffect(() => setMounted(true), [])` + early return placeholder 박음. next-themes 공식 권장.

5. **RSC + client hybrid 패턴**: web-next 의 page.tsx 가 *RSC server fetch* (page.tsx async) + *client component (HealthCardClient)* 둘 다 박음. *진짜 hybrid* 시연 — 같은 endpoint 호출, *서버 한 번 + 클라 한 번* (cache 안 박힌 경우 *2 회*).

6. **HealthCard 의 `'use client'`** — block 안에 박음. *Next/Vite 둘 다 호환*. 호출자 (RSC) 가 import 시 *client island* 로 처리됨.

## 🚧 이월

- HealthCard 의 *RSC-only variant* 박을 가치 — `'use client'` 미박힘 version. 현 시점 *복합 컴포넌트* 라 hybrid 안전 동작
- `next-themes` 의 *system theme 외 옵션* (예: cookie 기반): 별 spec
- `<ThemeToggle>` icon: emoji → `lucide-react` 이주 검토
- TanStack Query *DevTools* 도입 (dev 친화)
- *Cross-app theme sync* (web-next ↔ web-vite localStorage 공유): 별 spec
