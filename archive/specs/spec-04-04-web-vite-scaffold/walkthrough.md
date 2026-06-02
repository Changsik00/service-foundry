# Walkthrough: spec-04-04 web-vite-scaffold

> phase-04 **마지막 spec**. `apps/web-vite` Vite 7 SPA + tanstack-router file-based + TanStack Query + `useHealthQuery` client query 시연. web-next (RSC server fetch) 와 *의도적 비대칭* — *내부 도구 / admin prototype* 컨텍스트.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Vite 버전 | ^7 / ^8 | **^8.0.13** (latest) | boilerplate long-term. React 19 + tanstack-router 호환 |
| router | file-based / code-based | **file-based** | auto-gen routeTree, Next App Router 패턴 유사, 학습 곡선 ↓ |
| Query 도입 | 본 spec / 별 spec | **본 spec** | SPA 자연 — client query 시연이 *web-next 와 대조* 의도 |
| dev port | 3002 / 5173 | **3002** | api 3000 / web-next 3001 와 분리 — 세 개 동시 부트 가능 |
| build target | SPA / SSR | **SPA** | Vite default — static host 호환. apps/admin 패턴 |
| HealthCard | 공통 패키지 추출 / 복사 | **복사** (loading 분기 추가) | 본 spec scope ↓. 추출은 별 spec |
| httpClient 위치 | per-query / module-level singleton | **singleton** (`src/lib/http-client.ts`) | query 마다 인스턴스화 회피 |
| env 노출 | server-only / VITE_ prefix | **`VITE_API_BASE_URL`** (client bundle 노출 OK) | SPA — server-only env 불가. public API base 노출 자연 |
| TS jsx | preserve / react-jsx | **react-jsx** | Vite 표준 (web-next 의 `preserve` 와 다름) |
| tailwind plugin | postcss / vite | **`@tailwindcss/vite`** | Vite 표준 (web-next 의 `@tailwindcss/postcss` 와 다름) |
| build script | `tsc && vite build` / `vite build` 만 | **`vite build`** | typecheck 와 build 분리. routeTree.gen.ts 가 build 안에서 자동 생성 |
| routeTree.gen.ts | commit / gitignore | **gitignore** | auto-gen, build 시 재생성. commit 대상 아님 |
| QueryClient default | retry/refetch 박음 / 기본 | **retry: 1, refetchOnWindowFocus: false** | 개발 친화 default |
| commit 단위 | task별 1 | 5 commit | TDD Red/Green + scaffold/router/chore 분리 |

### ADR 승격 가이드

- [x] **없음** — Vite + tanstack-router/query *표준 패턴 답습*. 신규 ADR 가치 없음.

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| spec-04-04 진입 | "스팩 하나 남은거지? 진행하자" |
| tanstack-router 패턴 | A: File-based |
| TanStack Query 도입 | A: 본 spec 안 도입 |
| dev port | 3002 |
| build target | A: SPA |
| Plan Accept | 즉시 |

## 🔁 진행 과정

### T1 — 브랜치 생성 (commit 없음)

- `git checkout -b spec-04-04-web-vite-scaffold` (시작: `phase-04-frontend-foundation`)

### T2 — catalog + scaffold (`24e1fef`)

- catalog 추가: `vite ^8.0.13`, `@tanstack/react-router ^1.170.4`, `@tanstack/router-plugin ^1.168.6`, `@tanstack/react-query ^5.100.11`
- `apps/web-vite/` 박음 (package.json/vite.config/tsconfig/vitest/.gitignore/env.example/index.html/main.tsx stub/lib/http-client.ts/README)
- vite.config.ts: tanstackRouter + react + tailwindcss vite plugin + port 3002
- 27 → 28 workspace projects

### T3 — file-based router + Query provider (`bc090f1`)

- `src/routes/__root.tsx` (createRootRoute + Outlet)
- `src/routes/index.tsx` (createFileRoute("/") + Home stub)
- `src/main.tsx` 본체: createRoot + StrictMode + QueryClientProvider + RouterProvider + declare module Register
- `pnpm --filter @apps/web-vite build` 한 번 실행 → `routeTree.gen.ts` 자동 생성 확인
- build script 정정: `tsc && vite build` → `vite build` 만 (tsc 는 typecheck script 별도)

### T4 — useHealthQuery + HealthCard TDD (`2a1c69f` Red → `8c94b16` Green)

**Red (`2a1c69f`)**:
- `src/lib/queries.test.tsx` 3 test (success / error / initial loading) — QueryClient wrapper + fetch mock
- `src/components/health-card.test.tsx` 3 test (loading / data / error)
- 초기 transform fail — `http-client.ts` 가 module-load 시점 `VITE_API_BASE_URL` 검증 throw → `vitest.setup.ts` 에 `vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000")` 박음
- stub queries.ts + health-card.tsx (throw "not implemented") + 시그니처
- typecheck PASS + 4/6 test Red (stub queryFn throw 가 isError 자연 → 2 test pass)

**Green (`8c94b16`)**:
- queries.ts 본체: `useQuery({ queryKey: ['health'], queryFn: () => httpClient.get(...) })`
- health-card.tsx: web-next 답습 + `loading` 분기 추가 (4 분기 — loading / error / data / null)
- routes/index.tsx 본체: useHealthQuery + HealthCard 전달 (conditional spread)
- 초기 1 test fail — `loading` test 의 regex 가 "Loading..." 과 "로딩 중" 모두 매칭 → `/^Loading\.\.\.$/` 으로 구체화
- test 6/6 ✓

### T5 — 통합 검증 (`d6216bf` chore + 정정)

- `pnpm lint` ✓ 20 tasks
- `pnpm typecheck` ✓ 20 tasks FULL TURBO
- `pnpm test` ✓ 19 tasks (183 test PASS — web-vite 6 신규 + 기존 177)
- `pnpm --filter @apps/web-vite build` ✓ (`dist/` 출력, 약 95KB gzip)
- `pnpm exec depcruise` 초기 31 violations (1 error / 30 warn):
  - `.next/*` (Next build artifacts) + `dist/*` (Vite build) orphan / circular
  - **해결**: depcruise options 의 `exclude` 박음 — `(^|/)(?:\.next|dist|coverage|\.turbo)/`
  - `vite.config.ts` 도 orphan → `no-orphans` pathNot 에 `vite` 추가
  - 재실행: ✔ 0 violations (124 modules / 175 deps)
- 수동 검증: 사용자 부탁 시 *brower + curl* 박을 수 있음 (본 commit 의 시연 충분 — RSC 와 *대조 검증* 은 phase ship 시점)
- `sdd test passed` 호출

### T6 — Ship (본 commit)

- walkthrough + pr_description 작성
- ship commit + push + PR 생성

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@apps/web-vite` (신규) | 6 (useHealthQuery 3 + HealthCard 3) | ✓ |
| 기타 18 패키지 (변경 없음) | 177 | ✓ |
| **합계** | **183** | **all green** |

### Vite build

```
dist/index.html                   0.46 kB │ gzip:  0.31 kB
dist/assets/index-...css          6.46 kB │ gzip:  2.14 kB
dist/assets/routes-...js        123.31 kB │ gzip: 36.60 kB
dist/assets/index-...js         300.29 kB │ gzip: 94.45 kB
```

총 ~95KB gzip — SPA bundle. static host (S3/Netlify/Cloudflare Pages) 호환.

### depcruise

```
✔ no dependency violations found (124 modules, 175 dependencies cruised)
```

이전 (PR #27 직후) 120 modules / 202 deps → +4 module / -27 dep (build artifacts exclude 영향 — 실 web-vite source +13 module).

### web-next 와 비교 (의도적 비대칭)

| 측면 | web-next | web-vite |
|---|---|---|
| 렌더 모델 | RSC (server) | SPA (client) |
| fetch 위치 | `page.tsx` async server | `useQuery` (client) |
| port | 3001 | 3002 |
| build 출력 | `.next/` (server + client) | `dist/` (static) |
| jsx | preserve | react-jsx |
| tailwind plugin | `@tailwindcss/postcss` | `@tailwindcss/vite` |
| env | server-only (`API_BASE_URL`) | client (`VITE_API_BASE_URL`) |
| router | App Router (Next 내장) | tanstack-router file-based |
| state | (없음) | TanStack Query v5 |
| typical 용도 | public site / SSR | internal tool / admin |

## 🔍 발견 사항

1. **Vite + import.meta.env module-load 시점 검증 ↔ test 환경**: `http-client.ts` 가 *module-load 시점* env throw — test 환경에서 *VITE_API_BASE_URL* 미박힘 → fail. **해결**: `vitest.setup.ts` 에 `vi.stubEnv()` 박음. 후속 Vite 패키지 답습 패턴.

2. **`build` script 분리 — tsc 빼기**: 초기 `tsc --noEmit && vite build` 박았는데 *routeTree.gen.ts* 가 *vite build 안에서 생성* → tsc 가 *그 전에 실행* → "Cannot find module routeTree.gen.js" fail. **해결**: build = `vite build` 만, typecheck 는 별도 script. routeTree 생성을 의존하지 않는 동작 분리.

3. **`routeTree.gen.ts` auto-gen + gitignore**: `@tanstack/router-plugin/vite` 가 *build/dev 시 매번 생성*. commit 대상 아님 — `.gitignore` 박음. typecheck 가 *처음 fail* 한다면 `vite build` 한 번 박은 후 typecheck.

4. **depcruise exclude `(\.next|dist|coverage|\.turbo)` 필수**: build artifacts scan 시 *대량 violation*. 본 spec 의 정정으로 후속 Vite/Next 패키지 자동 적용.

5. **`Loading...` vs `로딩 중` regex 모호**: testing-library `getByText(/로딩|loading/i)` 가 *CardTitle "Loading..." + CardDescription "로딩 중"* 두 번 매칭 → multiple element error. **해결**: 정확 매칭 `/^Loading\.\.\.$/`. 후속 test 패턴 — *부분 매칭 대신 anchor + 정확 텍스트*.

6. **`useHealthQuery` test 의 *isLoading* 검증 — synchronous**: query 시작 직후 *동기* 검증 — `await waitFor` 박지 않음. fetchMock 이 *never resolve* 박은 채로 *isLoading: true* 즉시 확인. TanStack Query 의 *initial state* 활용.

7. **conditional spread (`error` prop)**: `error: Error | null` 박혀있을 때 `error: error?.message` 로 변환 시 `exactOptionalPropertyTypes` 호환. `{...(error !== null && error !== undefined && { error: error.message })}` 박음. backend-http-client / web-next 답습 패턴 — *exactOptional 시대* 의 conditional spread 가 표준.

8. **web-next 와 *전혀 다른 build artifact*** — web-next: `.next/server/...` + `.next/static/...` (server + client 분리), web-vite: `dist/assets/...` (static only). depcruise 가 둘 다 *scan 대상* — exclude 박는 게 자연.

## 🚧 이월 항목

- **nuqs (URL state)**: phase-04 후속 또는 phase-09 (실 페이징/필터)
- **dark mode toggle UI**: 별 spec
- **Playwright E2E**: 별 spec
- **route 다수 시연** (nested / dynamic param): 별 spec
- **apps/admin 분리 정책**: phase-09 영역
- **`HealthCard` 공통 패키지 추출** (web-next + web-vite 통합): 별 spec — 본 spec 은 *복사 + loading 분기 추가*
- **Vite SSR**: 별 spec (필요 시)
- **client-safe env validation** — VITE_API_BASE_URL 가 *module-load throw* 패턴 — *lazy* 패턴 검토 (web-next 의 `getEnv()` 답습)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-20 |
| **commits** | 5 (T2 scaffold + T3 router/Query + T4 Red/Green + T5 chore) + T6 ship (본 commit) |
| **test 수** | 6 신규 (`@apps/web-vite` — useHealthQuery 3 + HealthCard 3) — 전체 183 PASS |
| **depcruise** | 0 violations (124 modules / 175 deps, build artifacts exclude 후 깔끔) |
| **신규 app** | `@apps/web-vite` (phase-04 마지막 spec) |
| **신규 catalog** | `vite ^8.0.13`, `@tanstack/react-router ^1.170.4`, `@tanstack/router-plugin ^1.168.6`, `@tanstack/react-query ^5.100.11` |
| **build 검증** | `vite build` ✓ (dist/ ~95KB gzip) |
| **phase-04 의의** | 본 spec 머지 = phase-04 모든 spec Merged → phase ship 진입 가능 |
