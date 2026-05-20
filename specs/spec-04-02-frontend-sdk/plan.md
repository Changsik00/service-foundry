# Implementation Plan: spec-04-02 frontend-sdk

## 📋 Branch Strategy

- 신규 브랜치: `spec-04-02-frontend-sdk`
- 시작 지점: `phase-04-frontend-foundation` (Phase Base Branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] **fetch 라이브러리**: **ky `^1.x`** 채택 (NeoAuth 답습 + 형편없는 점 정정)
> - [x] **client 패턴**: factory (`createSdk({ baseUrl })`)
> - [x] **error**: `@repo/errors` AppError 변환 layer (NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION)
> - [x] **contracts 바인딩**: explicit (호출자가 `{ schema }` 명시)

> [!WARNING]
> - [ ] **reqId propagation 안 박음** — frontend 환경에 AsyncLocalStorage 없음. 호출자가 `headers: { "x-request-id": ... }` 명시. SSR (Next Server) 환경에서 trace context 통합 시 *별 spec*
> - [ ] `peer dep zod: ^4.0.0` — catalog 와 일치 박음. peer drift 모니터링 필요
> - [ ] **backend (undici) vs frontend (ky) 비대칭** — cross-env 한계 자연. 추후 backend 도 ky 이주 검토는 별 spec
> - [ ] 본 spec 은 *unopinionated SDK* — TanStack Query 등 *query layer* 안 박음. app 영역

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```mermaid
flowchart LR
    SDK["@repo/frontend-sdk"] -->|globalThis.fetch| F[Fetch API]
    SDK -->|@repo/errors| AE[AppError]
    SDK -->|peer: zod ^4| Z[(zod 4)]

    Caller["호출자 (Next/Vite app)"] -->|createSdk options| SDK
    Caller -->|sdk.get path, schema| SDK
    Caller -.imports.-> Contracts["@repo/contracts (zod schemas)"]
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **fetch 라이브러리** | **ky `^1.x`** | maintained (sindresorhus), retry/timeout/hooks 내장, fetch 기반, 3KB gzip. NeoAuth 답습 |
| **client 패턴** | factory (`createSdk(options)`) | 1회 호출, app 공유. Server/Client Component 모두 자연. NeoAuth 의 *module-level side effect* 정정 |
| **API surface** | backend-http-client 와 *동일* (`request/get/post/put/delete/patch`) | 학습 비용 ↓, monorepo 일관 |
| **retry/timeout** | ky 옵션 매핑 (default `retry.limit: 3`, `timeout: 10_000`) | backend-http-client *정책* 답습 — *알고리즘은 ky 내장* |
| **POST/PATCH no-retry default** | ky `retry.methods: ['get', 'put', 'delete', 'head', 'options', 'trace']` | idempotency safety, backend-http-client 답습 |
| **retry status codes** | ky `retry.statusCodes: [408, 429, 500, 502, 503, 504]` | 5xx + rate-limit |
| **error 변환** | `hooks.beforeError` — ky HTTPError/TimeoutError → AppError | NeoAuth 의 *plain object throw* 정정. 표준 Error subclass |
| **error codes** | NETWORK / TIMEOUT / UPSTREAM / BAD_REQUEST / VALIDATION | backend-http-client 의 5 코드 답습 (ADR-0009) |
| **schema binding** | explicit (`schema?: ZodType<T>`) | 호출자가 `@repo/contracts` 의 schema 명시 import — 가장 간단, 확장 자유. NeoAuth 의 *cast only* 정정 |
| **schema 미박힘 시** | raw JSON 반환 (TS type `T` unsafe cast) | 호출자 책임. SDK 단순화 |
| **reqId propagation** | 안 박음 — 호출자가 `headers` 명시 | frontend 환경 한계 (AsyncLocalStorage 없음) |
| **snake_case 변환** | **안 박음** — 호출자 정책 | NeoAuth 가 박음 — *도메인 영역*, SDK 책임 아님 |
| **`.result` unwrap** | **안 박음** — 호출자 정책 | NeoAuth 가 호출자에게 강제 — SDK 단순 유지 |

### 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — ADR-0009 (AppError) + ADR-0015 (framework-adapter naming) 답습. 신규 ADR 가치 없음.

## 📂 Proposed Changes

### `@repo/frontend-sdk` (신규)

#### [NEW] `packages/frontend/sdk/package.json`
```json
{
  "name": "@repo/frontend-sdk",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": { "types": "./src/index.ts", "default": "./src/index.ts" },
    "./package.json": "./package.json"
  },
  "dependencies": {
    "@repo/errors": "workspace:*",
    "ky": "catalog:"
  },
  "peerDependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "catalog:",
    "@repo/biome-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@repo/vitest-config": "workspace:*",
    "@types/node": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:",
    "zod": "catalog:"
  }
}
```

**catalog 갱신** (`pnpm-workspace.yaml`):
- `ky: ^1.7.5` (또는 npm view 최신 — install 시점 확정)

#### [NEW] `packages/frontend/sdk/tsconfig.json`
- `@repo/typescript-config/base` extends
- `lib: ["DOM", "DOM.Iterable", "ES2023"]`

#### [NEW] `packages/frontend/sdk/vitest.config.ts`
- `@repo/vitest-config/node` (jsdom 불필요 — fetch mock 으로 충분)

#### [NEW] `packages/frontend/sdk/src/index.ts`
- 메인 module — 모든 export

```ts
// 의사코드 — 실 구현은 task 단계
import { AppError } from "@repo/errors";
import ky, { HTTPError, TimeoutError, type KyInstance } from "ky";
import type { ZodType } from "zod";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD";

export interface CreateSdkOptions {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
}

export interface SdkRequestOptions<TOutput = unknown> {
  method: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  retries?: number;
  timeoutMs?: number;
  schema?: ZodType<TOutput>;
}

export interface Sdk {
  request<T>(opts: SdkRequestOptions<T>): Promise<T>;
  get<T>(path: string, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  post<T>(path: string, body?: unknown, opts?: Partial<SdkRequestOptions<T>>): Promise<T>;
  // ... put / delete / patch
}

export const createSdk = (options: CreateSdkOptions): Sdk => {
  const instance = ky.create({
    prefixUrl: options.baseUrl,
    timeout: options.timeoutMs ?? 10_000,
    retry: {
      limit: options.retries ?? 3,
      methods: ["get", "put", "delete", "head", "options", "trace"],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    headers: options.headers,
    hooks: {
      beforeError: [
        (error) => {
          if (error instanceof TimeoutError) {
            throw new AppError({ code: "TIMEOUT", message: error.message });
          }
          if (error instanceof HTTPError) {
            const status = error.response.status;
            throw new AppError({
              code: status >= 500 ? "UPSTREAM" : "BAD_REQUEST",
              message: `${status}: ${error.message}`,
              statusCode: status,
            });
          }
          // network error 등
          throw new AppError({ code: "NETWORK", message: String(error) });
        },
      ],
    },
  });

  // wrap: ky chain → backend-http-client API surface
  // schema parse + AppError VALIDATION
  // ...
};
```

#### [NEW] `packages/frontend/sdk/src/index.test.ts`
- 단위 테스트 9+ (fetch mock):
  - GET 성공 + schema parse
  - 404 → AppError BAD_REQUEST
  - 500 → retry → UPSTREAM
  - timeout → TIMEOUT
  - network error → retry → NETWORK
  - schema validation fail → VALIDATION
  - POST default — retry 없음 (idempotency)
  - POST with retries opt — retry 동작
  - headers override

### depcruise (검토)

#### [VERIFY] `packages/config/depcruise-config/base.cjs`
- `frontend-no-backend` 룰 이미 박힘 (ADR-0015) — 확인만, 변경 없음 가정

## 🧪 검증 계획

### 단위 테스트
```bash
pnpm --filter @repo/frontend-sdk test
pnpm test  # 전체
```

### 수동 검증
1. `grep "export.*createSdk\|export.*Sdk" packages/frontend/sdk/src/index.ts` — factory + Sdk export
2. `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .` — 0 violations
3. `pnpm lint && pnpm typecheck` — 모두 그린

## 🔁 Rollback Plan

- 본 spec 은 *신규 패키지 1개* — 기존 코드 영향 0
- 롤백 시 PR revert. 영향 0

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
