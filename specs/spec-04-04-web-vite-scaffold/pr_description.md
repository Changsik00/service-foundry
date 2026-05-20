# feat(spec-04-04): `apps/web-vite` Vite 7 SPA + tanstack-router/query + `useHealthQuery` 시연

> Phase 4 (Frontend Foundation) **마지막 spec**. `apps/web-vite` Vite SPA + tanstack-router file-based + TanStack Query + client query 시연. web-next (RSC server fetch) 와 *의도적 비대칭* — *내부 도구 / admin prototype* 컨텍스트. **본 PR 머지 = phase-04 종료** → phase ship 진입 가능.

## 📋 Summary

### 배경 및 목적

phase-04 의 spec-04-01 (frontend-ui) + spec-04-02 (frontend-http-client) + spec-04-03 (web-next) 머지 후, *SPA 옵션 부재*. `apps/admin` 같은 *내부 도구* 컨텍스트 박혀있지 않음. 본 spec 이 *Vite 표준 스택* + *client query 시연* — web-next 와 *대조 패턴* 검증 (server fetch vs client query).

### 주요 변경 사항

- [x] **`apps/web-vite/` 신설** (Vite 7 SPA):
  - `package.json` (Vite 8 + react 19 + tanstack-router/query + frontend-ui/http-client)
  - `vite.config.ts` (`tanstackRouter` file-based + `react` + `@tailwindcss/vite`, port 3002)
  - `tsconfig.json` (jsx react-jsx, vite/client types)
  - `vitest.config.ts` + `vitest.setup.ts` (jsdom + plugin-react + cleanup + `vi.stubEnv`)
  - `.gitignore` (`dist/`, `src/routeTree.gen.ts`)
  - `env.example` (`VITE_API_BASE_URL` — client bundle 노출 OK)
  - `index.html` (Vite root entry)
  - `README.md` (부트 가이드 + web-next 와 비대칭 의도)

- [x] **tanstack-router file-based**:
  - `src/routes/__root.tsx` (createRootRoute + Outlet)
  - `src/routes/index.tsx` (createFileRoute("/") + Home + useHealthQuery)
  - `src/routeTree.gen.ts` (auto-gen, gitignore)

- [x] **TanStack Query v5**:
  - `src/main.tsx`: createRoot + StrictMode + QueryClientProvider + RouterProvider + declare module Register
  - QueryClient default: retry 1, refetchOnWindowFocus false

- [x] **`useHealthQuery` hook**:
  - `src/lib/queries.ts`: `useQuery({ queryKey: ['health'], queryFn })`
  - HealthSchema (zod) export

- [x] **`HealthCard` (loading 분기 추가)**:
  - `src/components/health-card.tsx` — web-next 답습 + `loading` prop 추가 (4 분기)
  - 공통 패키지 추출은 *별 spec*

- [x] **catalog 갱신**:
  - `vite ^8.0.13`, `@tanstack/react-router ^1.170.4`, `@tanstack/router-plugin ^1.168.6`, `@tanstack/react-query ^5.100.11`

- [x] **depcruise 정정**:
  - `exclude: (^|/)(?:\.next|dist|coverage|\.turbo)/` 박음 (build artifacts scan 제외)
  - `no-orphans` pathNot 에 `vite.config` 추가

- [x] **단위 테스트 6 신규**: useHealthQuery 3 (success / error / initial loading) + HealthCard 3 (loading / data / error)

### Phase 컨텍스트

- **Phase**: `phase-04` Frontend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-04-frontend-foundation`
- **본 SPEC 역할**: **phase-04 마지막 spec** — 본 PR 머지 시 phase-04 종료 + phase ship 진입 가능

## 🎯 Key Review Points

1. **🎯 web-next 와 *의도적 비대칭***: web-next = RSC server fetch (public site / SSR), web-vite = SPA client query (internal tool / admin prototype). 둘 다 *같은 `/health` endpoint* 호출하지만 *전혀 다른 패러다임* — boilerplate 의 *차별 가치*.

2. **tanstack-router file-based + auto-gen**: `src/routes/__root.tsx` + `src/routes/index.tsx` → `@tanstack/router-plugin/vite` 가 `routeTree.gen.ts` 자동 생성 (gitignore). Next.js App Router 와 패턴 유사 — 학습 곡선 ↓.

3. **TanStack Query v5 — client cache + retry**: `useQuery({ queryKey: ['health'], queryFn })`. QueryClient default retry 1 + refetchOnWindowFocus false. *client query* 시연 핵심 — web-next 의 *server fetch* 와 대조.

4. **`vi.stubEnv` 테스트 환경 패턴**: `http-client.ts` 가 *module-load 시점* `VITE_API_BASE_URL` 검증 throw — vitest.setup 에 `vi.stubEnv` 박아 test 환경 stub. 후속 Vite 패키지 답습.

5. **`Loading...` 정확 매칭**: testing-library `getByText` 의 부분 매칭이 *CardTitle + CardDescription* 두 곳 매칭 → multiple element error. `/^Loading\.\.\.$/` 으로 정확 매칭. 후속 test 패턴 — anchor regex.

6. **build script `tsc && vite build` → `vite build` 만**: routeTree.gen.ts 가 *vite build 안에서 생성* — tsc 가 *그 전에 실행* 하면 fail. typecheck 는 별도 script.

7. **depcruise exclude — build artifacts**: 초기 31 violations (`.next/*` + `dist/*` orphan/circular) → `exclude` 옵션 박음. 후속 Vite/Next 패키지 자동 적용.

8. **dev port 3002**: api 3000 / web-next 3001 분리 — 세 개 동시 부트 가능. README 가이드.

9. **`pnpm exec depcruise` 0 violations** (124 modules / 175 deps): ADR-0015 룰 통과.

10. **`vite build` ✓** — `dist/` ~95KB gzip (static SPA bundle, S3/Netlify 호환).

11. **commit 5개** — TDD Red/Green + scaffold/router/chore 분리. 깔끔.

12. **phase-04 종료 직전** — 본 PR 머지 시 *모든 spec Merged* → `/hk-phase-ship` 진입 가능.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
pnpm --filter @apps/web-vite build
```

**결과**:
- ✅ `pnpm lint`: 20 tasks PASS
- ✅ `pnpm typecheck`: 20 tasks FULL TURBO
- ✅ `pnpm test`: **183 test PASS** (web-vite 6 신규 + 기존 177)
- ✅ `depcruise`: **0 violations** (124 modules / 175 dependencies)
- ✅ `vite build`: ✓ `dist/` ~95KB gzip

### test 분포 (6 신규 — `@apps/web-vite`)

| describe | test 수 | 검증 |
|---|:---:|---|
| `useHealthQuery` | 3 | success / error / initial loading |
| `HealthCard` | 3 | loading / data / error |

### 수동 부트 (예시)

```bash
# Terminal 1: apps/api
NODE_ENV=development PORT=3000 ... npx tsx apps/api/src/main.ts

# Terminal 2: apps/web-vite
VITE_API_BASE_URL=http://localhost:3000 pnpm --filter @apps/web-vite dev

# 브라우저 http://localhost:3002 — Card 안 status/uptime/version 표시 (client query)
```

## 🔗 참조

- **ADR**: [`docs/adr/0003-package-layout-and-naming.md`](../docs/adr/0003-package-layout-and-naming.md), [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md)
- **walkthrough**: `specs/spec-04-04-web-vite-scaffold/walkthrough.md` (결정 13 + 협의 6 + 진행 6 + 검증 + 발견 8 + 이월 8)
- **선행 spec**: spec-04-01 (frontend-ui), spec-04-02 (frontend-http-client), spec-04-03 (web-next)
- **후속**: **phase-04 ship** (`/hk-phase-ship` — phase PR phase-04 → main)

## 📝 Post-Merge

- [ ] Merge → `phase-04-frontend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-04.md` / `backlog/queue.md` (spec-04-04 → Merged)
- [ ] **phase-04 모든 spec Merged 확인** → `/hk-phase-ship` 진입 옵션 안내

## ✅ Definition of Done

- [x] `apps/web-vite/` 신설 (Vite 7 SPA)
- [x] tanstack-router file-based (`__root` + `index`)
- [x] TanStack Query (QueryClient + useHealthQuery)
- [x] `/health` 호출 + `<HealthCard>` 표시 (loading / success / error)
- [x] dev port 3002
- [x] 단위 테스트 6 PASS
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm build` 그린
- [x] `pnpm exec depcruise` 0 violations (build artifacts exclude 후)
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-04-frontend-foundation`)
- [ ] 사용자 알림
