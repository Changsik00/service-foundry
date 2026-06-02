# feat(spec-04-03): `apps/web-next` Next.js 16 App Router + RSC `/health` 시연

> Phase 4 (Frontend Foundation) 세 번째 spec. `apps/web-next` 신설 — Next.js 16 App Router + RSC default + tailwind v4 + shadcn (`@repo/frontend-ui`) + http-client (`@repo/frontend-http-client`) 통합. *최소 스켈레톤* — TanStack Query / nuqs / Auth 별 spec.

## 📋 Summary

### 배경 및 목적

phase-04 의 spec-04-01 (`@repo/frontend-ui`) + spec-04-02 (`@repo/frontend-http-client`) 머지 후, *frontend app 부재* — boilerplate 의 *public site* 옵션 없음. 본 spec 이 *통합 검증 시점* — Next.js 환경에서 *모든 frontend 패키지가 함께 동작* 확인.

### 주요 변경 사항

- [x] **`apps/web-next/` 신설** (Next.js 16 App Router):
  - `package.json` (`@apps/web-next` private, Next 16 + React 19 + frontend-ui/http-client deps)
  - `next.config.ts` / `postcss.config.mjs` (`@tailwindcss/postcss`)
  - `tsconfig.json` (jsx preserve, Next plugin, paths `@/*`)
  - `vitest.config.ts` + `vitest.setup.ts` (jsdom + plugin-react + cleanup)
  - `env.example` + `src/env.ts` (zod 검증, lazy `getEnv()`)

- [x] **App Router 구조**:
  - `src/app/layout.tsx` (root + html lang="ko" + metadata + globals.css)
  - `src/app/page.tsx` — **async server component (RSC)**:
    - `createHttpClient` + `/health` fetch
    - `HealthSchema` zod parse 시연
    - try/catch → AppError → 친화 메시지
    - `export const dynamic = "force-dynamic"` (매 요청마다 RSC 실행)
  - `src/app/globals.css` (`@import "@repo/frontend-ui/styles.css"`)

- [x] **`HealthCard` (presentation)**:
  - `src/components/health-card.tsx` (shadcn Card)
  - 3 분기 (data / error / 둘 다 없음)
  - presentation only — server/client 어느 쪽도 render 가능

- [x] **catalog 갱신**: `next: ^16.2.6`, `sharp: true` (allowBuilds)

- [x] **depcruise 정정**: `no-orphans` 예외에 `next|postcss` config 추가 (Next 자동 로드)

- [x] **단위 테스트 2 신규**: HealthCard render (정상 / error variant)

### Phase 컨텍스트

- **Phase**: `phase-04` Frontend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-04-frontend-foundation`
- **본 SPEC 역할**: phase-04 의 *통합 검증 첫 시점* — `frontend-ui` + `frontend-http-client` + `tailwind-config` 가 *Next 환경에서 함께 동작* 확인

## 🎯 Key Review Points

1. **🎯 사용자 *"next 는 SSR 로 기대하는건가?"* 질문 → App Router RSC 패러다임 설명**: Next.js App Router (v13+) 의 *default = RSC (Server Component)* — fetch 가 *서버에서* 실행 + HTML 에 결과 렌더. *zero-bundle*. SSR 의 현대 진화형. 본 spec 의 `page.tsx` 가 이 패턴 답습.

2. **RSC + http-client + UI 통합 완전 검증**: 수동 부트 시 `curl :3001` 의 HTML 응답에 `<Card>` / `<CardHeader>` / 모든 markup *이미 박혀있음* — *true RSC*. `createHttpClient` 가 *server* 에서 호출 + AppError catch + friendly message 표시 ✓.

3. **`force-dynamic` 필수 — env + 외부 fetch 의존**: build 시점 static 추출 회피. 매 요청마다 RSC 실행 — *현대 SSR* 의 자연. cache/revalidate 패러다임은 별 spec.

4. **env lazy (`getEnv()`)**: module-level zod parse → build 시점 env 미박힘 환경 fail. `getEnv()` 함수로 lazy parse — *runtime 시점*. 후속 Next.js spec 답습 패턴.

5. **dev port 3001 — apps/api 3000 과 분리**: 동시 부트 가능. README 가이드 박음.

6. **server-only env**: `NEXT_PUBLIC_` 안 박음 — client bundle 노출 회피. client 필요 시 별 spec 또는 props 패턴.

7. **`HealthCard` presentation only**: `'use client'` 미박힘 — server/client 어느 쪽도 render 가능. *Next App Router 의 hybrid* 답습. test 친화.

8. **depcruise no-orphans 예외 — `next|postcss` config**: Next.js 자동 로드 config 가 *orphan* 으로 warn → exception 추가. 후속 Next 패키지 자동 적용.

9. **`pnpm exec depcruise` 0 violations** (120 modules / 202 deps, +13 / +19): ADR-0015 룰 통과.

10. **`next build` ✓** — `/` Dynamic / `/_not-found` Static. Turbopack default.

11. **scope 최소 — 미도입 항목**: TanStack Query / nuqs / dark mode toggle / Playwright / Server Action 모두 *별 spec*. 최소 스켈레톤 + 통합 검증 우선.

12. **commit 5개**: scaffold → Red → Green → page → chore (env lazy + dynamic + depcruise). TDD 분리 + Next-specific 정정 명확.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
pnpm --filter @apps/web-next build
```

**결과**:
- ✅ `pnpm lint`: 19 tasks PASS
- ✅ `pnpm typecheck`: 19 tasks FULL TURBO
- ✅ `pnpm test`: **177 test PASS** (web-next 2 신규 + 기존 175)
- ✅ `depcruise`: **0 violations** (120 modules / 202 dependencies)
- ✅ `next build`: ✓ (`/` Dynamic, `/_not-found` Static)

### test 분포 (2 신규)

| describe | test 수 | 검증 |
|---|:---:|---|
| `HealthCard` | 2 | 정상 응답 → status/uptime/version / error prop → message |

### 수동 부트 검증

```bash
# Terminal 1
NODE_ENV=development PORT=3000 LOG_LEVEL=info \
  DATABASE_URL=postgres://localhost:5432/test \
  HTTP_CLIENT_BASE_URL=http://localhost:9999 \
  npx tsx apps/api/src/main.ts

# Terminal 2
cd apps/web-next && API_BASE_URL=http://localhost:3000 pnpm dev

# Terminal 3
curl http://localhost:3001
# → <Card> + <CardHeader>API Health</CardHeader> + status/uptime/version 표시
```

## 🔗 참조

- **ADR**: [`docs/adr/0003-package-layout-and-naming.md`](../docs/adr/0003-package-layout-and-naming.md), [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md)
- **walkthrough**: `specs/spec-04-03-web-next-scaffold/walkthrough.md` (결정 14 + 협의 7 + 진행 6 + 검증 + 발견 8 + 이월 9)
- **선행 spec**: spec-04-01 (frontend-ui), spec-04-02 (frontend-http-client)
- **후속 spec**: spec-04-04 web-vite-scaffold (Vite SPA + tanstack-router)

## 📝 Post-Merge

- [ ] Merge → `phase-04-frontend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-04.md` / `backlog/queue.md` (spec-04-03 → Merged)
- [ ] 사용자 알림 + spec-04-04 (web-vite) 진입 옵션

## ✅ Definition of Done

- [x] `apps/web-next/` 신설 (Next.js 16 App Router)
- [x] `src/app/page.tsx` RSC + `/health` 호출 + Card 표시 (force-dynamic)
- [x] env 검증 (zod lazy `getEnv()`)
- [x] dev port 3001
- [x] 수동 검증: `curl :3001` server HTML + Card + error variant 정상
- [x] 단위 테스트 2 PASS (HealthCard)
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm build` 그린
- [x] `pnpm exec depcruise` 0 violations (next|postcss config 예외 추가)
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-04-frontend-foundation`)
- [ ] 사용자 알림
