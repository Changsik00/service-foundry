---
type: reference
aliases: [아키텍처, system architecture, 시스템 구조]
tags: [service-foundry, reference, platform, architecture]
---

# Architecture — service-foundry 시스템 구조

> 💡 **한 줄 요약**: 운영 가능한 Node/TS 모노레포. **framework-agnostic core(`packages/backend`,`packages/shared`,`packages/frontend`)** 를 **framework adapter(`packages/nestjs`)** 가 감싸고, **apps(`api`/`web`/`worker`)** 가 조립한다.
> **상위 허브**: [[index]] · **결정 근거**: [[adr/0002-monorepo-foundations|ADR-0002]] · [[adr/0003-package-layout-and-naming|ADR-0003]] · [[adr/0015-framework-adapter-naming-and-layout|ADR-0015]] · [[adr/0022-multi-tenancy-strategy|ADR-0022]] · [[adr/0023-auth-authority-modes|ADR-0023]] · [[adr/0024-tenant-isolation-enforcement|ADR-0024]]
> **엔지니어링 원칙**(TS-first · "설치 버전=SoT" · 셋업)은 루트 [`ARCHITECTURE.md`](../../ARCHITECTURE.md) §0 정본.

## 1. 레이어 모델

이 레포의 핵심 규율은 **의존 방향이 한쪽으로만 흐른다**는 것이다 (depcruise 로 정적 강제 — [[adr/0001-linting-formatting-strategy|ADR-0001]]).

```
apps/            (api · web · worker)                  ← 조립·부트스트랩
  │  ▼ 의존
packages/nestjs/ (auth · database · http-client · …)        ← framework adapter (NestJS @Module)
  │  ▼ 의존
packages/backend/(auth-* · database · queue · cache · …)    ← framework-agnostic core (node 전용)
  │  ▼ 의존
packages/shared/ (errors · utils · validation · contracts)  ← FE/BE 공유 primitive
  ▲
packages/frontend/(ui · http-client · auth-react · …)  ─────┘ (shared 만 의존, backend 금지)
packages/config/ (typescript-config · vitest-config · …)    ← leaf preset (런타임 의존 0)
```

> ⚠️ **불변(invariant)**: `frontend → backend` import 금지, `backend core → nestjs adapter` 역참조 금지, `pure → adapter` 단방향 ([[adr/0015-framework-adapter-naming-and-layout|ADR-0015]]). 위반은 dependency-cruiser 가 CI/pre-commit 에서 차단.

## 2. 카테고리 의존 그래프

```mermaid
flowchart TD
    subgraph apps
      api[apps/api]
      web[apps/web]
      worker[apps/worker]
    end
    subgraph nestjs["packages/nestjs (adapter)"]
      njs[auth · auth-firebase · auth-supabase · database · http-client · logger · security · settings]
    end
    subgraph backend["packages/backend (core)"]
      be[auth-* · authz · database · queue · cache · observability · …]
    end
    subgraph frontend["packages/frontend"]
      fe[ui · http-client · auth-react · auth-store · auth-firebase · auth-supabase · …]
    end
    subgraph shared["packages/shared"]
      sh[errors · utils · validation · contracts · auth-contracts · factory]
    end
    config["packages/config (presets)"]

    api --> njs --> be --> sh
    api --> be
    worker --> be
    web --> fe --> sh
    api -.uses.-> sh
    config -.extends.-> apps
    config -.extends.-> backend
```

## 3. Auth 패키지 클러스터 (가장 큰 응집 영역)

Auth 는 "Auth Engine(외부 라이브러리: jose/argon2/otplib/@simplewebauthn) + Auth Platform(자체 구축)" 으로 나뉘는 **Consistent Wrapped SDK** 전략을 따른다 ([[adr/0006-auth-strategy|ADR-0006]], [[explainers/frontend/auth-sdk-provider-adapters]]).

```mermaid
flowchart LR
    apiapp[apps/api] --> najwt[nestjs-auth]
    najwt --> ajwt[backend-auth-jwt]
    najwt --> actr[auth-contracts]
    apiapp --> asess[backend-auth-session]
    apiapp --> aoauth[backend-auth-oauth]
    apiapp --> amfa[backend-auth-mfa]
    apiapp --> apk[backend-auth-passkey]
    apiapp --> apwd[backend-auth-password]
    apiapp --> arl[backend-auth-rate-limit]
    apiapp --> aaudit[backend-auth-audit]
    asess --> bdb[backend-database]
    aoauth --> bdb
    arl --> bdb
    aaudit --> bdb
    ajwt --> errs[errors]
    asess --> errs
    actr --> val[validation] --> errs
```

세부 동작 원리는 explainers 참조:
[[explainers/auth/session-rotation-chain]] · [[explainers/auth/jwt-verify-edDSA]] · [[explainers/auth/oauth-pkce-flow]] · [[explainers/auth/mfa-totp-challenge]] · [[explainers/auth/passkey-webauthn]] · [[explainers/auth/cookie-strategy]]

### 3.1 인증 권위 모드 (auth authority modes)

인증 권위는 3 모드로 교체 가능 — `AUTH_MODE` env: **native**(자체 JWT/세션) · **firebase** · **supabase**. 동일 `CoreAuthSDK` 계약을 각 모드 어댑터가 구현(Consistent Wrapped SDK)해 앱 코드는 모드에 무관 ([[adr/0023-auth-authority-modes|ADR-0023]] · [[adr/0026-provider-mode-active-org-transport|ADR-0026]]).

## 3.5 멀티테넌시 & 격리 (RLS)

org 스코프 멀티테넌트. 격리는 **PostgreSQL RLS** 가 정본 강제선 ([[adr/0022-multi-tenancy-strategy|ADR-0022]] · [[adr/0024-tenant-isolation-enforcement|ADR-0024]]):

- **런타임 role 분리**: 앱 런타임은 비-슈퍼유저 `app_runtime` 로 접속(RLS 적용 대상). 마이그레이션만 owner/superuser. 슈퍼유저 런타임은 RLS 를 우회하므로 production 기동 가드가 거부.
- **요청-스코프 tx + ALS**: 요청마다 `app.current_org` 를 세팅한 트랜잭션을 AsyncLocalStorage 로 전파 → 모든 쿼리가 자동으로 org 격리.
- **검증**: api e2e 가 실제 런타임 role 로 cross-org 거부를 확인. dev·web-e2e 도 `app_runtime` 로 동작(spec-x-dev-rls-app-runtime).
- 세부 결정: [[adr/0024-tenant-isolation-enforcement|ADR-0024]] · [[adr/0022-multi-tenancy-strategy|ADR-0022]].

## 4. 런타임 토폴로지 (apps)

| app | 역할 | 스택 | 진입 |
|---|---|---|---|
| `api` | 인증/도메인 REST 백엔드 | NestJS 11 + Drizzle + PostgreSQL | `GET /health`, auth endpoints, `/metrics` |
| `web` | SSR 웹 (메인) | Next.js 16 App Router + React 19 | `/`, `/login` |
| `worker` | 비동기 작업 소비자 | BullMQ consumer | 큐 소비 |

로컬 인프라(postgres·redis·prometheus·grafana·tempo·loki)는 `tooling/docker` compose 로 기동 ([[explainers/platform/docker-compose-local-infra]]).

**배포**: `tooling/k8s` 에 api·worker·postgres·redis 샘플 매니페스트(+migrate Job)와 로컬 kind 검증 스크립트 제공(phase-22). 이미지는 `turbo prune + pnpm --prod` 멀티스테이지로 슬림화(api ~803MB).

## 5. 횡단 규약 (cross-cutting)

| 관심사 | 규약 | 출처 |
|---|---|---|
| 에러 | `Result<T,E>` 흐름제어 + `AppError` 데이터모델 | [[adr/0008-result-type|ADR-0008]] · [[adr/0009-app-error-design|ADR-0009]] · [[adr/0020-error-handling-convention|ADR-0020]] |
| 검증 | zod 4 + `parse → Result` | [[adr/0010-validation-zod-result-integration|ADR-0010]] |
| 관측성 | request-id 전파 + pino + OTel + prom-client | [[explainers/backend/request-id-propagation]] · [[explainers/backend/otel-tracing-init-order]] |
| 빌드 | turbo pipeline + tsup(backend)/JIT(shared·frontend) | [[adr/0004-typescript-and-compilation-strategy|ADR-0004]] · [[explainers/platform/monorepo-build-turbo-tsup]] |
| DB | Drizzle 마이그레이션 + pool lifecycle | [[explainers/backend/drizzle-migrations-lifecycle]] |
| 포트/어댑터 | Notifier·Cache·Queue·Storage·RateLimiter·SecretsProvider 포트 | [[explainers/backend/notification-port-adapter]] 외 |

## 6. 패키지 카테고리 요약

> 카테고리별 역할 (전수 목록·개수는 drift 원천 → 정본은 [[index]] §reference/packages 카탈로그):

- **backend** — node 전용 인프라/도메인 core (auth-* · authz(org 권한 정책) · database · queue · cache · observability · notification · …).
- **nestjs** — backend core 를 NestJS `@Module` 로 감싼 adapter ([[adr/0016-nestjs-adapter-standard-module-pattern|ADR-0016]], [[explainers/platform/nestjs-adapter-module-pattern]]). native(auth) 외 firebase/supabase 모드 검증 모듈(auth-firebase·auth-supabase) 포함 ([[adr/0023-auth-authority-modes|ADR-0023]]).
- **frontend** — UI + http-client + auth SDK 래퍼 (auth-react · auth-store · auth-firebase · auth-supabase · auth-testing 등).
- **shared** — errors · utils · validation · contracts · auth-contracts · factory.
- **config** — typescript/vitest/biome/tsup/tailwind/depcruise/knip preset (런타임 의존 0).

## 연결된 개념
- [[reference/stack]] — 의존성 도입 근거
- [[index]] — 전체 카탈로그
- [[explainers/platform/config-packages-presets]] — config preset 패턴

> 소스: 전체 spec(phase-01~22) walkthrough + `pnpm-workspace.yaml` + `docs/adr/*`
