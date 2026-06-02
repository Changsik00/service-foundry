# Implementation Plan: spec-04-03 web-next-scaffold

## 📋 Branch Strategy

- 신규 브랜치: `spec-04-03-web-next-scaffold`
- 시작 지점: `phase-04-frontend-foundation` (Phase Base Branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **Next.js 16 + App Router** (Next 의 default = RSC, "SSR 의 진화형")
> - [x] **렌더 모드: RSC (Server Component)** — `/health` 호출이 *서버에서*. *최소 스켈레톤*
> - [x] **TanStack Query 미도입** — RSC 만 쓰면 query 도구 불필요. 별 spec
> - [x] **nuqs 미도입** — URL state 시연 명분 없음. 별 spec
> - [x] **dev port: 3001** (api 3000 과 분리)

> [!WARNING]
> - [ ] **api 가 *함께* 부트되어야 시연 완성** — `apps/api` (port 3000) + `apps/web-next` (port 3001) 동시 실행. README + dev 가이드 박음
> - [ ] `API_BASE_URL` server-only env (NEXT_PUBLIC_ 없음 — 보안). zod 로 검증
> - [ ] Next.js 16 — 비교적 최근 major. *boilerplate 의 long-term value* 우선
> - [ ] Turbopack default (Next 16+) — webpack 옵션 박지 않음. *production build* 만 점검

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```mermaid
flowchart TB
    subgraph apps["apps/"]
        WN["@apps/web-next (신규)"]
        API[("@apps/api (기존, port 3000)")]
    end

    subgraph pkg["packages/"]
        TWConfig["@repo/tailwind-config"]
        UI["@repo/frontend-ui"]
        HC["@repo/frontend-http-client"]
        Errors["@repo/errors"]
    end

    WN -->|page.tsx async RSC| HC
    WN -->|<Card/Button>| UI
    WN -->|@import styles.css| UI
    UI -.uses.-> TWConfig
    HC -->|fetch http://localhost:3000/health| API
    HC -.uses.-> Errors

    Browser((Browser)) -->|GET http://localhost:3001/| WN
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **Next 버전** | `next ^16.2.6` (latest) | boilerplate long-term value. App Router 안정 + Turbopack default |
| **app dir 구조** | `src/app/` (App Router) | Next 공식 권장. Page Router 미사용 |
| **렌더 모드** | RSC (async server component) | App Router default. 최소 스켈레톤에 자연 |
| **layout.tsx** | root layout + `<html lang="ko">` + globals.css import | Next 표준 |
| **globals.css** | `@import "@repo/frontend-ui/styles.css"` | tailwind v4 entry (spec-04-01 답습) |
| **page.tsx 시연** | `createHttpClient` + `/health` + Card UI | 가장 단순 + 모든 frontend 패키지 통합 |
| **env 검증** | zod schema (별 `src/env.ts`) | runtime 안전. NEXT_PUBLIC_ 없음 (server-only) |
| **dev port** | 3001 | apps/api 3000 과 분리 |
| **css processor** | `@tailwindcss/postcss` (Next default) | tailwind v4 + Next.js 공식 통합 |
| **단위 test 환경** | jsdom + `@testing-library/react` (frontend-ui 답습) | `<HealthCard>` render 검증 |
| **HealthCard 분리** | `src/components/health-card.tsx` (presentation only) | RSC 의 `page.tsx` 가 직접 data fetch, *순수 view* 만 컴포넌트화 — test 친화 |
| **build 검증** | `next build` task 통합 검증에 포함 | RSC + Turbopack build 동작 확인 |

### 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — Next.js App Router *default 패턴 답습*. 신규 ADR 가치 없음.

## 📂 Proposed Changes

### `apps/web-next` (신규)

#### [NEW] `apps/web-next/package.json`
```json
{
  "name": "@apps/web-next",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack --port 3001",
    "build": "next build",
    "start": "next start --port 3001",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@repo/errors": "workspace:*",
    "@repo/frontend-http-client": "workspace:*",
    "@repo/frontend-ui": "workspace:*",
    "@repo/tailwind-config": "workspace:*",
    "next": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*",
    "@tailwindcss/postcss": "catalog:",
    "@testing-library/jest-dom": "catalog:",
    "@testing-library/react": "catalog:",
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "jsdom": "catalog:",
    "tailwindcss": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

**catalog 갱신** (`pnpm-workspace.yaml`):
- `next: ^16.2.6` (또는 install 시점 최신)

#### [NEW] `apps/web-next/tsconfig.json`
Next 공식 권장 + monorepo 호환:
```json
{
  "extends": "@repo/typescript-config/base",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "plugins": [{ "name": "next" }],
    "types": ["node"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### [NEW] `apps/web-next/next.config.ts`
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // monorepo workspace dep transpile (Next 16+ 기본 동작 — 명시 박지 않아도 OK)
};

export default nextConfig;
```

#### [NEW] `apps/web-next/postcss.config.mjs`
```js
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

#### [NEW] `apps/web-next/vitest.config.ts`
- `@repo/vitest-config/react` + `@vitejs/plugin-react` + setupFiles (frontend-ui 답습)

#### [NEW] `apps/web-next/vitest.setup.ts`
- `import "@testing-library/jest-dom/vitest"` + `afterEach(cleanup)`

#### [NEW] `apps/web-next/.gitignore`
- `.next/`, `out/`, `next-env.d.ts`, `*.log`

#### [NEW] `apps/web-next/env.example`
```
API_BASE_URL=http://localhost:3000
```

#### [NEW] `apps/web-next/src/env.ts`
```ts
import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

#### [NEW] `apps/web-next/src/app/globals.css`
```css
@import "@repo/frontend-ui/styles.css";
```

#### [NEW] `apps/web-next/src/app/layout.tsx`
- root layout + `<html lang="ko">` + globals.css import
- metadata title 박음

#### [NEW] `apps/web-next/src/app/page.tsx`
- **async server component** — `createHttpClient` + `.get` + Card 표시
- error handling: try/catch → AppError → 친화 메시지

#### [NEW] `apps/web-next/src/components/health-card.tsx`
- `<HealthCard data={...}>` presentation only (test 친화)
- props: `{ status, uptime, version }` 또는 `{ error: string }`

#### [NEW] `apps/web-next/src/components/health-card.test.tsx`
- 단위 test 2:
  - 200 응답 데이터 → status/uptime/version 표시
  - error prop → error message 표시

#### [NEW] `apps/web-next/README.md`
- 부트 가이드:
  ```bash
  # Terminal 1: apps/api
  pnpm --filter @apps/api start
  # Terminal 2: apps/web-next
  pnpm --filter @apps/web-next dev
  ```
- port 3001 명시 + http://localhost:3001
- RSC 패러다임 한 줄
- TanStack Query / nuqs 별 spec 예고

### catalog 갱신

#### [MODIFY] `pnpm-workspace.yaml`
- `next: ^16.2.6` 추가

### depcruise (검토)

- 기존 룰 (ADR-0015 답습) 그대로. `apps/*` 가 `packages/backend/*` import 안 함 — 변경 불필요 예상

## 🧪 검증 계획

### 단위 테스트
```bash
pnpm --filter @apps/web-next test  # HealthCard render 2 test
pnpm test                          # 전체
```

### 수동 검증 (필수)
```bash
# 1. apps/api 부트 (Terminal 1)
NODE_ENV=development PORT=3000 LOG_LEVEL=info \
  DATABASE_URL=postgres://localhost:5432/test \
  HTTP_CLIENT_BASE_URL=http://localhost:9999 \
  npx tsx apps/api/src/main.ts &

# 2. apps/web-next 부트 (Terminal 2)
API_BASE_URL=http://localhost:3000 \
  pnpm --filter @apps/web-next dev

# 3. 브라우저 http://localhost:3001 — Card 안 status/uptime/version 표시 확인

# 4. build 검증
pnpm --filter @apps/web-next build
```

### CI/lint/typecheck/depcruise
```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

## 🔁 Rollback Plan

- 본 spec 은 *신규 app 1개* — 기존 코드 영향 0
- 롤백 시 PR revert + catalog `next` 제거. 영향 0

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
