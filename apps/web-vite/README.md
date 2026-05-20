# @apps/web-vite

phase-04 의 Vite 7 SPA scaffold. **client query** 패턴 시연 — `useHealthQuery()` 가 `apps/api` 의 `/health` 호출 + Card 표시.

> **web-next 와 의도적 비대칭**:
> - **`@apps/web-next`** → RSC (server fetch) — *public site* / SSR 영역
> - **`@apps/web-vite`** → SPA (client query) — *internal tool* / admin prototype 영역 (phase-09 `apps/admin` 의 prototype)

## 부트 방법

```bash
# Terminal 1: apps/api (port 3000)
NODE_ENV=development PORT=3000 LOG_LEVEL=info \
  DATABASE_URL=postgres://localhost:5432/test \
  HTTP_CLIENT_BASE_URL=http://localhost:9999 \
  npx tsx apps/api/src/main.ts

# Terminal 2: apps/web-vite (port 3002)
VITE_API_BASE_URL=http://localhost:3000 \
  pnpm --filter @apps/web-vite dev
```

브라우저: `http://localhost:3002` — `<HealthCard>` 가 `useHealthQuery` 의 *loading → success / error* 상태 분기 표시.

> ⚠️ `.env.example` 이 아닌 `env.example` 로 commit 됨 (Claude Code 차단 우회). 사용 시 `.env` 로 rename 또는 export.

## env 변수

| 변수 | 타입 | 기본값 | 범위 |
|---|---|---|---|
| `VITE_API_BASE_URL` | URL | (필수) | **client bundle 노출 OK** (`VITE_` prefix — public API base) |

## 아키텍처

```tsx
// src/main.tsx (entry)
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>

// src/routes/index.tsx
function Home() {
  const { data, error, isLoading } = useHealthQuery();
  return <HealthCard data={data} error={error?.message} loading={isLoading} />;
}
```

- **Vite 7 SPA**: static HTML + JS bundle. `dist/` 출력 — S3 / Netlify / Cloudflare Pages 호환
- **tanstack-router file-based**: `src/routes/__root.tsx` + `src/routes/index.tsx` — `@tanstack/router-plugin/vite` 가 `routeTree.gen.ts` 자동 생성 (gitignore)
- **TanStack Query v5**: `useQuery({ queryKey: ['health'], queryFn })` — client cache + refetch + retry
- **`createHttpClient` singleton** (`src/lib/http-client.ts`): module-level 인스턴스 — 매 query 마다 인스턴스화 회피

## scope 밖

| 항목 | 시점 |
|---|---|
| nuqs (URL state) | 별 spec |
| Vite SSR | 별 spec |
| dark mode toggle | 별 spec |
| Playwright E2E | 별 spec |
| route 다수 (nested / dynamic param) | 별 spec |
| apps/admin 분리 정책 | phase-09 (Icebox 이슈) |
| HealthCard 공통 패키지 추출 | 별 spec |

## 테스트

```bash
pnpm --filter @apps/web-vite test       # useHealthQuery + HealthCard (jsdom)
pnpm --filter @apps/web-vite build      # tsc + vite build → dist/
```
