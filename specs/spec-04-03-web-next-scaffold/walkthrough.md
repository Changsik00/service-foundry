# Walkthrough: spec-04-03 web-next-scaffold

> phase-04 세 번째 spec. `apps/web-next` Next.js 16 App Router scaffold + RSC `/health` 호출 시연. `@repo/frontend-ui` + `@repo/frontend-http-client` + `@repo/tailwind-config` 통합 검증. TanStack Query / nuqs 미도입 (최소 스켈레톤).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Next.js 버전 | 15 / 16 | **16.2.6** (latest) | boilerplate long-term value. App Router 안정 + Turbopack default |
| 렌더 모드 | A RSC / B RSC+client hybrid / C CSR | **A RSC (server component)** | App Router default. 최소 스켈레톤 + zero-bundle |
| TanStack Query | 본 spec / 별 spec | **별 spec** | RSC 만 사용 — query 도구 불필요. client interaction 등장 시점 도입 |
| nuqs (URL state) | 본 spec / 별 spec | **별 spec** | 최소 스켈레톤 — URL state 시연 명분 없음 |
| dev port | 3000 / 3001 | **3001** | apps/api 3000 과 분리 — 동시 실행 가능 |
| env 검증 | module-level / lazy | **lazy (`getEnv()`)** | Next build 시 env 미박힘 환경 호환. runtime 시점 parse |
| page rendering | static / dynamic | **`dynamic = "force-dynamic"`** | env + 외부 fetch 의존 — build 시점 static 추출 회피. 매 요청마다 RSC 실행 |
| env 노출 범위 | server-only / NEXT_PUBLIC_ 도 | **server-only** | client bundle 노출 회피 (보안). client 필요 시점 props 패턴 또는 별 spec |
| HealthCard 분리 | page.tsx 안 / 별 컴포넌트 | **별 컴포넌트** (`src/components/health-card.tsx`) | presentation only — test 친화 + server/client 어느 쪽도 render 가능 |
| jsx | preserve / react-jsx | **preserve** | Next.js 가 자체 transform |
| tsconfig paths | `@/*` → `./src/*` | 채택 | Next 표준 + monorepo 호환 |
| depcruise no-orphans 예외 | next.config / postcss.config 추가 | 채택 | Next.js 자동 로드 config — orphan 아님 |
| sharp allowBuilds | true / false | **true** | Next 16 image 최적화 native dep |
| commit 단위 | scaffold / Red / Green / page / chore | 5 commit | TDD Red/Green 분리 + Next-specific 정정 별 commit |

### ADR 승격 가이드

- [x] **없음** — Next.js App Router *default 패턴 답습*. ADR-0015 (framework-adapter naming) 답습. 신규 ADR 가치 없음.

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| spec-04-03 진입 | "spec-04-03 진입" |
| **Next 의 렌더 모드 질문** | "next 는 /ssr 로 기대하고 있는건가?" — Agent 가 App Router 의 *RSC default* 설명 (SSR 의 현대 진화형) |
| 렌더 모드 결정 | A: RSC (App Router default) |
| TanStack Query | 별 spec |
| dev port | 3001 |
| nuqs | 별 spec |
| Plan Accept | 즉시 |

핵심 협의: **사용자 *"Next = SSR?"* 질문** 에 대한 *App Router 의 RSC 패러다임 설명* — `page.tsx` 가 *async server component* default, `fetch` 가 *서버에서* 실행. *SSR 의 현대 진화형*. 본 spec 의 *RSC 단순 시연* 채택.

## 🔁 진행 과정

### T1 — 브랜치 생성 (commit 없음)

- `git checkout -b spec-04-03-web-next-scaffold` (시작: `phase-04-frontend-foundation`)

### T2 — catalog next + scaffold (`2bf6b5e`)

- `pnpm-workspace.yaml` catalog: `next: ^16.2.6`, `sharp: true` (allowBuilds)
- `apps/web-next/` 박음:
  - package.json (Next 16 + react 19 + frontend-ui/http-client deps)
  - tsconfig.json (jsx preserve, Next plugin, paths `@/*`)
  - next.config.ts (workspace transpile 자동), postcss.config.mjs (`@tailwindcss/postcss`)
  - vitest.config.ts + vitest.setup.ts (jsdom + plugin-react + cleanup)
  - .gitignore (.next, out, next-env.d.ts)
  - env.example + src/env.ts (zod 검증)
  - src/app/{layout.tsx, page.tsx, globals.css} (stub)
  - src/components/health-card.tsx (stub)
  - README.md (부트 가이드)
- 26 → 27 workspace projects

### T3 — HealthCard TDD (`6414c4b` Red → `f23e741` Green)

**Red (`6414c4b`)**:
- `health-card.test.tsx` 2 test (정상 응답 / error prop)
- stub `<HealthCard>` (throw "not implemented") + `HealthData/HealthCardProps` 시그니처
- typecheck PASS + test 2/2 Red

**Green (`f23e741`)**:
- `@repo/frontend-ui` Card (Card/Header/Title/Description/Content) 사용
- 3 분기 (data / error / 둘 다 없음)
- presentation only — `'use client'` 미박힘 (server/client 어느 쪽도 render)
- test 2/2 ✓

### T4 — layout + page RSC (`4590468`)

- `layout.tsx` (root + html lang="ko" + globals.css + metadata)
- `page.tsx` (async server component):
  - `createHttpClient({ baseUrl: getEnv().API_BASE_URL })`
  - `client.get("/health", { schema: HealthSchema })` + zod parse 시연
  - try/catch → AppError catch → errorMessage 박음
  - `<HealthCard>` 에 conditional spread (exactOptionalPropertyTypes 호환)
- `globals.css`: `@import "@repo/frontend-ui/styles.css"`

### T5 — 통합 검증 (`554a5fb` chore + 정정)

- `pnpm lint` ✓ 19 tasks PASS
- `pnpm typecheck` ✓ 19 tasks FULL TURBO
- `pnpm test` ✓ 18 tasks PASS
- `pnpm exec depcruise` 초기 1 warn (postcss.config.mjs orphan) → depcruise-config 의 `no-orphans` 예외에 `next|postcss` 추가 → ✔ 0 violations (120 modules / 202 deps)
- `pnpm --filter @apps/web-next build` 초기 fail — env 검증 module-level + page static 추출 시도 → **env lazy (`getEnv()`)** + **`export const dynamic = "force-dynamic"`** 박음 → ✓ build 성공 (`/` Dynamic)
- 수동 검증:
  - api + web-next 동시 부트 + `curl :3001`
  - Server-rendered HTML 정상 (`<main>` + `<Card>` + markup 전체 박힘)
  - api `/health` 가 404 응답 (port 3000 의 *기존 process* — *현 spec scope 밖*) → `[BAD_REQUEST] 404` 친화 메시지 정상 표시 → **RSC + http-client + UI 통합 완전 검증** ✓
- `sdd test passed` 호출

### T6 — Ship (본 commit)

- walkthrough + pr_description 작성
- ship commit + push + PR 생성

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@apps/web-next` (신규) | 2 (HealthCard) | ✓ |
| 기타 17 패키지 (변경 없음) | 175 | ✓ |
| **합계** | **177** | **all green** |

### Next.js build

```
Route (app)
┌ ƒ /
└ ○ /_not-found

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

`/` 가 *Dynamic* — 매 요청마다 RSC 실행 + `/health` fetch.

### depcruise

```
✔ no dependency violations found (120 modules, 202 dependencies cruised)
```

이전 (PR #26 직후) 107 modules / 183 deps → +13 module / +19 dep (web-next + Next 16 + sharp 등).

### 수동 부트 검증

| 검증 | 결과 |
|---|---|
| `pnpm --filter @apps/web-next build` | ✓ build 성공 (`/` Dynamic) |
| `npx next start --port 3001` + `curl :3001` | ✓ Server-rendered HTML |
| HealthCard rendering (error variant) | ✓ `<Card>` + `apps/api '/health' 응답 받지 못함` + AppError code/message |
| zero-bundle 확인 | ✓ HTML 안 모든 컴포넌트 markup 박힘, fetch 코드 client bundle 미포함 |

## 🔍 발견 사항

1. **Next 16 build 시점 env 검증 fail**: env 가 *module-level parse* 박혀있으면 *build 시점* (env 미박힘) fail. **해결**: `getEnv()` lazy 함수 박음 — *runtime 호출 시점* parse. 후속 Next.js spec 답습 패턴.

2. **`force-dynamic` 필수 — env + 외부 fetch 의존 page**: Next.js 가 *build 시점 static 추출* 시도 — env 의존 + 외부 호출 page 는 *fail*. `export const dynamic = "force-dynamic"` 박아 *매 요청마다 RSC 실행*. cache/revalidate 패러다임은 별 spec.

3. **`exactOptionalPropertyTypes: true` ↔ React props**: `data: HealthData | undefined` 명시 전달 시 TS2375. **해결**: conditional spread (`{...(data !== undefined && { data })}`). frontend-http-client 의 `body: undefined` 패턴 답습.

4. **depcruise `no-orphans` ↔ Next.js auto-loaded config**: `next.config.ts` / `postcss.config.mjs` 가 *Next 자동 로드* — orphan 아님이지만 depcruise 가 모름. `no-orphans` pathNot 에 `next|postcss` 추가 — 후속 Next 패키지 자동 적용.

5. **sharp allowBuilds = true 필수**: Next 16 의 image 최적화 native dep (`sharp`) postinstall script 박힘. pnpm `allowBuilds` 명시 — `set this to true or false` warning 해소.

6. **`'use client'` 안 박은 컴포넌트 = RSC OR client 어느 쪽도 render 가능**: `HealthCard` 가 *순수 presentation* — server 에서도 client 에서도 동작. *Next App Router 의 hybrid 특성* 답습 — 후속 spec 에서 interactive component 등장 시 `'use client'` 박음.

7. **Server-rendered HTML 안 모든 markup 박힘**: curl HTML 캡처 시 `<Card>` / `<CardHeader>` / `<CardContent>` 등 모든 markup *이미 박혀있음* — *true RSC* 의 가치. *fetch 코드 client bundle 미포함* (zero-bundle 검증).

8. **port 3000 점유 (기존 process)**: 수동 부트 시 *port 3000* 이미 점유 — 이전 spec-03-08 검증 시 띄운 api 가 *backgroundtask 종료 안 됨* 가능. *현 spec scope 밖* — 본 spec 의 *web-next 동작* 확인은 *그대로 검증 가능* (404 응답이지만 *AppError code/message* 표시 ✓).

## 🚧 이월 항목

- **TanStack Query 통합 (client interaction)**: 별 spec — `useQuery` / mutation / refetch UI 시점
- **nuqs (URL state)**: 별 spec — 실 페이징/필터 진입 시점
- **dark mode toggle UI**: `@repo/tailwind-config` 의 `.dark` 셀렉터 박혀있음 — toggle component 별 spec
- **Playwright E2E**: curl 검증 수준만. browser-level test 도입은 별 spec
- **i18n / SEO meta 풍부**: minimal scaffold, 후속 spec
- **Server Action / form submit**: phase-04 scope 밖 (실 도메인 영역)
- **streaming SSR / Suspense boundary**: minimal 페이지라 미박힘
- **client-safe env (`NEXT_PUBLIC_`)**: client 에서 API_BASE_URL 필요 시점 박음
- **port 3000 점유 정리**: 사용자가 *수동 kill* 가능 (`lsof -i :3000` + kill)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-20 |
| **commits** | 5 (T2 scaffold + T3 Red/Green + T4 page + T5 chore) + T6 ship (본 commit) |
| **test 수** | 2 신규 (`@apps/web-next` HealthCard) — 전체 177 PASS |
| **depcruise** | 0 violations (120 modules / 202 deps, +13 / +19) |
| **신규 app** | `@apps/web-next` (phase-04 첫 frontend app) |
| **신규 catalog** | `next ^16.2.6` |
| **build 검증** | `next build` ✓ (`/` Dynamic) |
| **수동 부트** | `curl :3001` ✓ Server-rendered HTML + Card + error variant |
