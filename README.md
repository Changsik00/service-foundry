# service-foundry

> 새 서비스(api / web / worker)를 빠르게 띄울 수 있는, **운영 가능한** Node/TS 모노레포 보일러플레이트.

개인용 보일러플레이트. "기술 데모"가 아니라 "운영 가능한 기본 시스템"이 목표. 실무에서 결국 다 쓰게 되는 것들(env validation, observability, auth, tracing, queue, graceful shutdown 등)을 미리 깔아둔다 — **YAGNI 면제**.

폴리글랏(Python RAG/ML) 합류 가능성은 인지하되 현재 스코프는 Node/TS 단독 ([ADR-0007](./docs/adr/0007-polyglot-strategy.md)).

---

## 📚 지식베이스 (먼저 여기)

이 레포의 설계 의도·동작 원리·결정 근거는 **Obsidian 친화 지식베이스**로 정리되어 있다. 단일 진입점:

### → [`docs/index.md`](./docs/index.md) — 전체 카탈로그(MOC)

- **[아키텍처](./docs/reference/architecture.md)** — 시스템 구조 + 패키지 의존 그래프
- **[reference/](./docs/reference/)** — "무엇인가": 패키지(`packages/<category>/<pkg>`) + 앱 3개(api·web·worker) + [의존성 도입 근거](./docs/reference/stack.md)
- **[explainers/](./docs/explainers/)** — "어떻게 동작하나": auth / backend / frontend / platform 메커니즘
- **[adr/](./docs/adr/)** — "왜 그렇게 정했나": 결정 기록 (`docs/adr/` 전수)
- 작성 규약은 [`docs/CONVENTIONS.md`](./docs/CONVENTIONS.md)

---

## 무엇이 들어있나

**앱 3개**

| app | 역할 | 스택 |
|---|---|---|
| [`apps/api`](./apps/api) | 인증/도메인 REST 백엔드 | NestJS 11 + Drizzle + PostgreSQL |
| [`apps/web`](./apps/web) | SSR 웹 (메인 콘솔) | Next.js 16 + React 19 |
| [`apps/worker`](./apps/worker) | 비동기 작업 소비자 | BullMQ consumer |

**패키지** (`packages/<category>/<pkg>`, import 는 `@repo/*` flat)

| 카테고리 | 수 | 내용 |
|---|---|---|
| `backend/` | 26 | auth-* (session·jwt·oauth·mfa·passkey·password·rate-limit·audit) + authz·tenant·schema·database·queue·cache·outbox·idempotency·lifecycle·notification·observability·secrets·storage·… |
| `nestjs/` | 9 | backend core 를 감싼 NestJS `@Module` 어댑터 (tenant 포함) |
| `frontend/` | 8 | ui · http-client · auth-react · auth-firebase · auth-supabase · auth-testing |
| `shared/` | 6 | errors · utils(Result) · validation · contracts · auth-contracts · factory |
| `config/` | 7 | typescript · vitest · biome · tsup · tailwind · depcruise · knip preset |

**핵심 역량**: 인증 파운데이션(세션 rotation·JWT·OAuth·MFA·Passkey) · 멀티테넌시(조직/멤버십/초대 + Postgres RLS 격리) · RBAC/ABAC 인가 · 데이터 UX(업로드·검색·페이지네이션·CSV export) · 어드민+빌링(감사로그·피처플래그·플랜) · public_id 외부 식별자 체계 · 관측성(OTel·Prometheus·Grafana) · 백엔드 포트(Queue·Cache·Outbox·Idempotency·Lifecycle) · CI/CD(검증 게이트 + changesets 릴리스 + GHCR docker + k8s 배포 예제).

---

## Quickstart

```bash
# 전제: Node 24 LTS, pnpm 11.1.2 (corepack 자동 활성화)
fnm use            # .nvmrc 기준 Node 24 (nvm 쓰면 nvm use)
corepack enable
pnpm install

# 검사
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

로컬 인프라(postgres·redis·prometheus·grafana·tempo·loki) + 개발 서버:

```bash
pnpm infra:up      # docker compose 인프라 기동
pnpm dev           # 전체 앱 dev (또는 dev:api / dev:web)
pnpm infra:down
```

새 패키지/앱 스캐폴딩: `pnpm new` (turbo gen) — [generators 설명](./docs/explainers/platform/turbo-gen-scaffolding.md).

> ⚠️ `engines.node` 는 `>=24.0.0 <25` 로 잠겨 있다. `.nvmrc`(24)에 맞춰 활성화할 것.

---

## Layout

```
service-foundry/
├─ apps/          # api · web · worker
├─ packages/
│  ├─ backend/    # node 전용 인프라/도메인 core (framework-agnostic)
│  ├─ nestjs/     # NestJS @Module 어댑터 (backend core wrap)
│  ├─ frontend/   # ui · http-client · auth SDK
│  ├─ shared/     # FE/BE 공유 primitive (errors · utils · validation · contracts)
│  └─ config/     # 빌드/린트/테스트 preset
├─ tooling/       # docker compose · generators · scripts
├─ docs/          # 지식베이스 (index.md = 진입점) + adr
├─ backlog/       # phase 계획 (harness-kit SDD)
└─ specs/         # spec 작업 로그
```

의존 방향은 단방향(`frontend ↛ backend`, `core ↛ adapter`)이며 dependency-cruiser 로 정적 강제된다 ([ADR-0015](./docs/adr/0015-framework-adapter-naming-and-layout.md)).

---

## 결정 (ADRs)

확정된 결정은 [`docs/adr/`](./docs/adr/) 에 있다 (본문 영어 — AI 컨텍스트 친화). 핵심:

- [ADR-0002](./docs/adr/0002-monorepo-foundations.md) — pnpm 11 + turborepo + Node 24
- [ADR-0003](./docs/adr/0003-package-layout-and-naming.md) — `packages/<category>/<pkg>` + `@repo/*`
- [ADR-0005](./docs/adr/0005-backend-framework-and-orm-strategy.md) — NestJS + Drizzle + PostgreSQL
- [ADR-0006](./docs/adr/0006-auth-strategy.md) — Consistent Wrapped SDK
- [ADR-0008](./docs/adr/0008-result-type.md) · [ADR-0009](./docs/adr/0009-app-error-design.md) · [ADR-0020](./docs/adr/0020-error-handling-convention.md) — 에러 처리
- [ADR-0013](./docs/adr/0013-session-lifecycle.md) · [ADR-0014](./docs/adr/0014-auth-security-baseline.md) — auth 보안

전체 목록은 [`docs/index.md`](./docs/index.md#decisions-adr).

---

## 개발 규약

이 레포는 [harness-kit](./.harness-kit/) SDD 거버넌스를 따른다 (phase → spec → plan → task → ship). 작업 단위는 `backlog/`(계획)와 `specs/`(로그)에 기록된다.
