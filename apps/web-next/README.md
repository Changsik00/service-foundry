# @apps/web-next

phase-04 의 Next.js 16 App Router scaffold. RSC (Server Component) 패턴으로 `apps/api` 의 `/health` 호출 + UI 표시 시연.

> **scope 제한**: 본 app 은 *통합 검증용 최소 스켈레톤*. TanStack Query / nuqs / Authentication 등은 별 spec.

## 부트 방법

### 1. env 파일 준비

```bash
cp apps/web-next/env.example apps/web-next/.env
```

> ⚠️ `.env.example` 이 아닌 `env.example` 로 commit 됨 (Claude Code 의 `.env*` Write 차단 우회).

### 2. 동시 부트 (2 터미널)

```bash
# Terminal 1: apps/api (port 3000)
NODE_ENV=development PORT=2026 LOG_LEVEL=info \
  DATABASE_URL=postgres://localhost:5432/test \
  HTTP_CLIENT_BASE_URL=http://localhost:9999 \
  npx tsx apps/api/src/main.ts

# Terminal 2: apps/web-next (port 2027)
API_BASE_URL=http://localhost:2026 \
  pnpm --filter @apps/web-next dev
```

### 3. 브라우저

`http://localhost:2027` — 페이지 안 `<HealthCard>` 가 `apps/api` 의 `/health` 응답 표시 (`status` / `uptime` / `version`).

## env 변수

| 변수 | 타입 | 기본값 | 범위 |
|---|---|---|---|
| `API_BASE_URL` | URL | (필수) | **server-only** (RSC / Route Handler / Server Action) |

> `NEXT_PUBLIC_` prefix 안 박힘 — 보안 (client bundle 노출 회피). client 에서 필요 시 별 spec 에서 `NEXT_PUBLIC_API_BASE_URL` 또는 props 패턴.

## 아키텍처 — Next.js App Router + RSC

```tsx
// src/app/page.tsx — async server component (RSC)
export default async function Home() {
  const client = createHttpClient({ baseUrl: env.API_BASE_URL });
  const health = await client.get("/health", { schema: HealthSchema });
  return <HealthCard data={health} />;
}
```

- **page.tsx**: async server component (default) — fetch 가 *서버에서* 실행 + HTML 에 결과 렌더
- **HealthCard**: presentation only — props 받음, server / client 어느 쪽에서도 render 가능 (`'use client'` 미박힘)
- **layout.tsx**: root layout + `globals.css` (tailwind v4 entry — `@repo/tailwind-config` 답습)

## scope 밖

| 항목 | 시점 |
|---|---|
| TanStack Query (client interaction) | client component 등장 시점 별 spec |
| nuqs (URL state) | 실 페이징/필터 진입 시점 별 spec |
| Authentication wire-up | phase-06 |
| Playwright E2E | 별 spec |
| dark mode toggle UI | 별 spec |
| i18n / SEO meta 풍부 | 별 spec |

## 테스트

```bash
pnpm --filter @apps/web-next test       # HealthCard render (jsdom)
pnpm --filter @apps/web-next build      # Next.js production build 검증
```
