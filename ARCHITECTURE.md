# service-foundry — Architecture

> [!WARNING]
> **작업 중 — 일부 stale.** 이 문서는 ADR 0001–0006이 작성되기 전, 그리고 `packages/<category>/<pkg>` 그룹핑 + `*-config` suffix 네이밍 + Biome/Knip/dependency-cruiser 툴체인으로 옮기기 전에 쓰여졌다.
>
> **현재 권위 있는 출처:**
> * [`docs/adr/0001-linting-formatting-strategy.md`](./docs/adr/0001-linting-formatting-strategy.md) — Lint / format / dead code / boundary
> * [`docs/adr/0002-monorepo-foundations.md`](./docs/adr/0002-monorepo-foundations.md) — pnpm / turborepo / Node / lefthook / changesets / tsx
> * [`docs/adr/0003-package-layout-and-naming.md`](./docs/adr/0003-package-layout-and-naming.md) — 폴더 레이아웃 + 네이밍 (아래 §3, §6를 대체)
> * [`docs/adr/0004-typescript-and-compilation-strategy.md`](./docs/adr/0004-typescript-and-compilation-strategy.md) — TS / tsup / compiled-vs-JIT
> * [`docs/adr/0005-backend-framework-and-orm-strategy.md`](./docs/adr/0005-backend-framework-and-orm-strategy.md) — Backend framework + ORM (보류)
> * [`docs/adr/0006-auth-strategy.md`](./docs/adr/0006-auth-strategy.md) — Auth (보류)
> * [`docs/turborepo-rules.md`](./docs/turborepo-rules.md) — Turborepo 룰 요약 (영문)
> * [`backlog/queue.md`](./backlog/queue.md) — Phase 대시보드, Icebox (open questions)
> * [`backlog/phase-01.md`](./backlog/phase-01.md) ~ [`backlog/phase-06.md`](./backlog/phase-06.md) — phase별 SPEC 작업 지도
>
> 아래 섹션은 **개념적인** 패키지 모양과 의존성 룰을 기술한다. §3~§6의 폴더 이름·패키지 이름·도구 선택은 ADR보다 먼저 작성된 것이라 Phase 3(ADR-005/006 결정 후)에 **전면 재작성**될 예정. 그때 이 배너를 제거한다.

---

## 0. 툴체인 원칙 — TypeScript-first, everywhere

이 레포는 **end-to-end TypeScript**다. 기여자가 untyped JS나 셸 글루로 떨어질 필요가 없는 게 목표.

* **Runtime**: Node 22 LTS, ESM only (`NodeNext`). [ADR-0002](./docs/adr/0002-monorepo-foundations.md) §3, [ADR-0004](./docs/adr/0004-typescript-and-compilation-strategy.md) 참조.
* **소스**: 모든 `packages/*/*`와 `apps/*`는 TypeScript로 작성. `strict: true` + `noUncheckedIndexedAccess` 필수. `// @ts-nocheck` 금지. `any`는 정당한 이유 없이 쓰지 않음.
* **Configs as code**: `vitest.config.ts`, `tsup.config.ts`, `playwright.config.ts` 등은 TypeScript로 작성하고 `@repo/<tool>-config` preset을 extend. JSON은 JSON만 읽는 도구(Biome, Knip)에만 한정.
* **Scripts**: `tooling/scripts/*`의 비-trivial 스크립트는 TypeScript로 작성, `node --import tsx ./script.ts` 또는 `pnpm tsx ./script.ts`로 실행. Bash는 lifecycle 글루(lefthook hook 본문, CI 오케스트레이션)에만.
* **타입 체크는 빌드 단계 없음**: `tsc --noEmit`이 타입 정확성의 SoT. `turbo run typecheck`로 위임. tsup 번들링은 *별개* 관심사 — [ADR-0004](./docs/adr/0004-typescript-and-compilation-strategy.md) §7 참조.
* **`paths` 금지, project references 금지**: ADR-0004 따름. 패키지 간 resolution은 pnpm + 각 패키지의 `exports` 필드로만 — 런타임 resolution과 동일.

### 0.1 라이브러리 버전이 진실의 출처(SoT)

> **기능 구현은 *설치된 라이브러리 버전의 API*에 맞춰 한다. ADR 예시에 맞추지 말 것. 작년에 본 스니펫에 의존하지 말 것.**

`pnpm-workspace.yaml`의 catalog가 권위 있는 버전 pin. ADR은 작성 시점의 **의도**(어떤 도구를 왜 골랐는지)를 기록한다. 메이저 버전이 올라가 public API가 바뀌면:

1. catalog 버전을 올린다.
2. 해당 API를 쓰는 코드를 새 API에 맞춘다.
3. ADR 예시도 새 API를 반영하도록 갱신한다.
4. 이전에 박힌 결정이 업그레이드로 뒤집혔다면 해당 ADR에 짧은 노트를 추가한다.

실제 사례:

* Biome `1.x → 2.x`에서 `--apply`가 `--write`로 변경됨. lefthook 훅은 `--write`여야 함. ADR 예시가 `--apply`로 남아있다면 그건 문서 버그(고칠 것), 코드 버그가 아님.
* tsup `7.x → 8.x`에서 `Options` 타이핑이 바뀌어 preset signature가 달라짐. *설치된* 버전의 `defineConfig` signature가 정답.
* Vitest `4.x`에서 legacy CommonJS reporter loading이 제거됨. `3.x`용으로 쓰인 preset이 catalog가 `4.x`면, preset이 바뀌어야 함.

**Rule of thumb**: 설치된 버전 기준으로 `pnpm install`/`tsc --noEmit`/테스트 스위트가 그린이면 코드는 옳다. 동작하는 코드와 모순되는 ADR 스니펫이 있다면 고쳐야 할 건 ADR.

이 원칙은 이 레포에서 작업하는 **AI 에이전트에게 특히 중요**: Biome / Vitest / tsup / knip / dependency-cruiser / turborepo처럼 빠르게 움직이는 도구는 *기억된 API 모양을 신뢰하지 말 것*. 비-trivial config를 작성하기 전에 항상 설치 버전에서 재유도(`pnpm exec <tool> --help`, 패키지의 `dist/index.d.ts`, 한 줄 probe 등)할 것.

### 0.2 기여자 초기 셋업

1. Node 22 LTS (`.nvmrc` 기준으로 `nvm use` 또는 `fnm use`). `engines.node`가 `>=22.0.0 <23`로 잠겨있어 Node 23/24는 명시적으로 out of scope ([ADR-0002 §3](./docs/adr/0002-monorepo-foundations.md)).
2. `corepack enable` → `packageManager` 필드 기준으로 pnpm 11.1.2 자동 활성화.
3. `pnpm install`.
4. (선택, IDE) VS Code: Biome 익스텐션, TypeScript "Use Workspace Version" 활성화.

전역 TypeScript 설치 불필요 — `typescript`가 catalog 통해 workspace devDep로 들어와 있음. 에디터가 워크스페이스 TS를 자동으로 잡도록 "use workspace version" 프롬프트에 동의하면 됨.

---

## 1. 폴더 구조 (legacy sketch — Phase 3에 재작성 예정)

```
service-foundry/
├─ apps/
│  ├─ api/                # Fastify 백엔드           # NOTE: framework 보류 — ADR-005 참조
│  ├─ web/           # Next.js (App Router)
│  └─ worker/             # BullMQ 워커
│
├─ packages/
│  │
│  ├─ config-typescript/  # NOTE: 현재 @repo/typescript-config — ADR-003 참조
│  ├─ config-eslint/      # NOTE: 제거됨 — Biome 채택, ADR-001 참조
│  ├─ config-prettier/    # NOTE: 제거됨 — Biome 채택, ADR-001 참조
│  ├─ config-vitest/      # NOTE: 현재 @repo/vitest-config
│  ├─ config-tsup/        # NOTE: 현재 @repo/tsup-config
│  │
│  ├─ env/                # NOTE: 제거됨 — @repo/backend/settings에 흡수
│  ├─ config/             # NOTE: 제거됨 — @repo/backend/settings에 흡수
│  ├─ logger/             # NOTE: 현재 @repo/backend/logger
│  ├─ errors/             # NOTE: 현재 @repo/shared/errors
│  ├─ validation/         # NOTE: 현재 @repo/shared/validation
│  ├─ contracts/          # NOTE: 현재 @repo/shared/contracts
│  ├─ sdk/                # NOTE: 현재 @repo/frontend/sdk
│  ├─ http-client/        # NOTE: 현재 @repo/backend/http-client
│  ├─ auth/               # NOTE: 3개로 분리 — ADR-003 §6, ADR-006 §14 참조
│  ├─ database-prisma/    # NOTE: 현재 @repo/backend/database-prisma
│  ├─ database-drizzle/   # NOTE: 현재 @repo/backend/database-drizzle
│  ├─ cache/              # NOTE: 현재 @repo/backend/cache
│  ├─ queue/              # NOTE: 현재 @repo/backend/queue
│  ├─ observability/      # NOTE: 현재 @repo/backend/observability
│  ├─ security/           # NOTE: 현재 @repo/backend/security
│  ├─ testing/            # NOTE: 현재 @repo/testing/testing
│  ├─ utils/              # NOTE: 현재 @repo/shared/utils
│  └─ ui/                 # NOTE: 현재 @repo/frontend/ui
│
├─ tooling/
│  ├─ docker/             # 로컬 인프라 (pg/redis/grafana/prometheus)
│  ├─ scripts/            # repo 운영 스크립트
│  └─ generators/         # `pnpm new service` 같은 plop generator
│
├─ docs/                  # ADR, 운영 가이드
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

정확한 레이아웃은 [ADR-003](./docs/adr/0003-package-layout-and-naming.md) §2 참조.

---

## 2. 패키지 목록 & 역할 (legacy — 이름은 outdated, 역할은 유효)

> 아래 패키지 이름들은 ADR-003 이전의 flat 네이밍. 현재 이름은 `@repo/<pkg>` flat import 유지하면서 폴더만 카테고리로 그룹핑. **여기 서술된 역할은 여전히 옳음** — 위치만 바뀜.

### 2.1 config-* (도구 설정 preset)

| 패키지 (legacy)        | 역할                                                  | 현재 위치 |
| -------------------- | --------------------------------------------------- | -------- |
| `config-typescript`  | tsconfig preset (base / library / node-app / react-app) | `packages/config/typescript-config` |
| ~~`config-eslint`~~  | 제거됨 — Biome 채택                                   | — (ADR-001) |
| ~~`config-prettier`~~| 제거됨 — Biome 채택                                   | — (ADR-001) |
| `config-vitest`      | vitest preset (node / react)                         | `packages/config/vitest-config` |
| `config-tsup`        | 라이브러리 번들 preset                                | `packages/config/tsup-config` |
| (신규) `biome-config` | Biome 설정 preset                                    | `packages/config/biome-config` |
| (신규) `knip-config`  | Knip 설정 preset                                     | `packages/config/knip-config` |
| (신규) `depcruise-config` | dependency-cruiser 룰 preset                    | `packages/config/depcruise-config` |

### 2.2 shared primitives

| 패키지       | 역할                                                | 현재 |
| ----------- | ------------------------------------------------- | --- |
| `utils`     | Result, sleep, pick/omit 등 순수 유틸              | `packages/shared/utils` |
| `errors`    | `AppError` 계층 + JSON 직렬화 (BE/FE 공유)          | `packages/shared/errors` |
| `validation`| zod helper, 공통 schema (UUID, Email, Pagination 등) | `packages/shared/validation` |
| `contracts` | 도메인별 zod schema + DTO 타입 (BE/FE 공유 진입점)   | `packages/shared/contracts` |
| (신규) `auth-contracts` | Session/User/JwtPayload zod schema + Role enum | `packages/shared/auth-contracts` (ADR-006) |

### 2.3 backend primitives

| 패키지               | 역할                                                       | 현재 |
| ------------------- | -------------------------------------------------------- | --- |
| ~~`env`~~ + ~~`config`~~ → `settings` | node-settings wrap, env validation + runtime config + .env.example / K8s manifest 자동 생성 | `packages/backend/settings` |
| `logger`            | pino + request-id 미들웨어 + redaction + dev pretty        | `packages/backend/logger` |
| `http-client`       | undici 기반, retry / timeout / auth / trace / typed response | `packages/backend/http-client` |
| `auth`              | framework module (NestJS Module 또는 Fastify plugin), JWT issue/verify, RBAC guard | `packages/backend/auth` (ADR-006) |
| `database-prisma`   | Prisma client singleton + 마이그레이션 워크플로            | `packages/backend/database-prisma` |
| `database-drizzle`  | Drizzle client + schema + 마이그레이션                     | `packages/backend/database-drizzle` |
| `cache`             | ioredis wrapper (ttl, namespace, JSON, distributed lock)  | `packages/backend/cache` |
| `queue`             | BullMQ wrapper (job 정의, 워커 boot helper)                | `packages/backend/queue` |
| `observability`     | OTel SDK boot, tracer, metrics, `/health` `/ready`       | `packages/backend/observability` |
| `security`          | helmet / cors / rate-limit preset                         | `packages/backend/security` |

### 2.4 testing / frontend

| 패키지     | 역할                                                  | 현재 |
| -------- | --------------------------------------------------- | --- |
| `testing`| vitest 셋업, fixture, testcontainers (postgres/redis) | `packages/testing/testing` |
| `ui`     | shadcn + tailwind + 공유 React 컴포넌트                | `packages/frontend/ui` |
| `sdk`    | contracts 기반 typed API client (codegen으로 갱신)     | `packages/frontend/sdk` |
| (신규) `frontend/auth` | React provider + useSession hook + refresh interceptor + route guard | `packages/frontend/auth` (ADR-006) |

### 2.5 apps

| 앱          | 역할                                                          |
| ---------- | ------------------------------------------------------------ |
| `api`      | framework 보류 (ADR-005), backend package 통합 reference       |
| `web` | App Router + tanstack-query + sdk + auth + ui                |
| `worker`   | BullMQ 워커 + observability + database                       |
| (신규) `edge-api` | Hono 기반 edge / serverless 예제                         |

---

## 3. 의존성 규칙

### 3.1 레이어 (위 → 아래만 허용)

```
apps/*  (api, web, worker, edge-api)
   │
   ▼
composition packages:  shared/contracts, shared/auth-contracts,
                       frontend/sdk, frontend/auth, frontend/ui
   │
   ▼
infra primitives:      backend/http-client, backend/database-*,
                       backend/cache, backend/queue,
                       backend/observability, backend/security,
                       backend/auth, backend/logger, backend/settings
   │
   ▼
shared primitives:     shared/errors, shared/validation, shared/utils
   │
   ▼
config-*  (모두가 dev-deps로 참조; 런타임 의존 아님)
```

### 3.2 규칙

* `apps/*`는 `packages/*`에 의존한다. 그 반대는 절대 금지.
* `packages/*` 간 cycle 금지 — turborepo + dependency-cruiser로 enforce (ADR-001).
* `packages/config/*`는 내부 패키지에 의존하지 않는다.
* `packages/shared/*`는 런타임 의존성이 zod 외에 (최대한) 없어야 한다 (FE 번들 사이즈 보호).
* `packages/shared/*`는 Node-only API 금지 (FE 번들 안전).
* `packages/backend/auth`는 `shared/auth-contracts` + `shared/errors`만 의존 (+ JWT lib, password hash lib).
* `packages/backend/database-*`는 `backend/settings` + `backend/logger`만 의존.
* `packages/backend/observability`는 누구에게나 의존받되, **다른 packages를 import하지 않는다** (순환 방지).
* `packages/frontend/*`는 절대 `packages/backend/*`를 import하지 않는다. 공유는 `shared/*` 경유.

#### Framework adapter 룰 (2026-05-19 추가, ADR-0015)

* `packages/backend/*` / `packages/frontend/*` 는 **framework-agnostic** — `@nestjs/*` / `express` / `react` / `vue` 등 framework dep 금지 (pino / zod / drizzle-orm 같은 framework-agnostic lib만).
* framework adapter는 *별 카테고리*: `packages/nestjs/<name>` → `@repo/nestjs-<name>` (예: `@repo/nestjs-logger`).
* 의존 방향: **어댑터 → pure 단방향**.

```
nestjs/<X>  → backend/<X>     ✅ (어댑터가 pure 의존)
backend/<X> → nestjs/<X>     ❌ (pure가 framework 의존 — platform-agnostic 위반)
nestjs/<X>  → frontend/<X>   ❌ (server↔browser tier 침범)
react/<X>   → frontend/<X>   ✅
react/<X>   → backend/<X>    ❌
nestjs/<X>  → nestjs/<Y>     ⚠️ case-by-case
```

* **현재 임시 위반** (2026-05-19): `@repo/backend-logger-nestjs` (PR #10 머지) + `@repo/backend-settings`의 `BackendSettingsModule` (PR #9 머지) — 후속 spec (재구성 spec) 에서 `packages/nestjs/logger` + `packages/nestjs/settings` 로 이동 + pkg name 변경 예정.
* **어댑터 *내부* 모듈 구현 패턴** (ADR-0016): 표준 `@Module` decorator class 권장 (lifecycle hook 자연 + NestJS ecosystem 친화). ultra-thin adapter (token-only / 단순 wrap) 는 객체 리터럴 허용. 자세한 내용은 [ADR-0016](./docs/adr/0016-nestjs-adapter-standard-module-pattern.md).

### 3.3 export 컨벤션

* 모든 패키지는 `package.json`의 `exports` 필드로만 export. `main`만 쓰지 않음.
* sub-path export 적극 활용 (예: `@repo/contracts/user`).
* 타입은 `types` condition으로 따로 명시.
* compiled 패키지(`packages/backend/*`)는 `dist/`를 `exports`에서 가리키고 `files: ["dist"]`.
* JIT 패키지(`packages/shared/*`, `packages/frontend/*`)는 `./src/index.ts`를 직접 export.

자세한 컴파일 규칙은 [ADR-004](./docs/adr/0004-typescript-and-compilation-strategy.md) §7.
