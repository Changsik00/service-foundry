---
id: ADR-0015
type: convention
date: 2026-05-19
status: accepted
---

# ADR-0015: Framework Adapter Naming & Layout

## 📚 Context

ADR-0003(패키지 레이아웃 & 네이밍)이 5 카테고리(`config` / `shared` / `backend` / `frontend` / `testing`)를 박았다. *framework adapter 패키지*에 대한 룰은 부재.

phase-03 진행 중 발견:

1. **spec-03-01 (backend-settings)** — `BackendSettingsModule.forRoot()` DynamicModule + `BACKEND_SETTINGS` symbol + `@nestjs/common` dep을 `packages/backend/settings/` 안에 박음 (이미 머지). 같은 패턴이 spec-x-auth-foundation-prep 시점부터 자연스럽게 답습.
2. **spec-03-02 (backend-logger)** — 같은 패턴으로 `PinoLoggerService` / `BackendLoggerModule` 박음. PR #10 review에서 사용자 catch — *"packages 에서는 어느 플렛폼에 붙을지는 몰라.. 따라서 이런 연관성은 배제 해야 해"*.
3. 1차 해법: `packages/backend/logger-nestjs/` 어댑터 패키지 분리 (`@repo/backend-logger-nestjs`). suffix 패턴.
4. 사용자 재제기 — *"nestjs-logger, nestjs-settings 이렇게 가는게 좀 더 낫지 않을까?"* — **영문법 (adj+noun) + NPM dominant 패턴 (`@nestjs/config` / `react-query` / `express-session`) 모두 prefix가 정답** 확인. suffix는 컨벤션 위반.

문제:

- *명명 컨벤션 부재* → spec마다 ad-hoc 결정 → 일관성 없음, 향후 다른 framework 어댑터 (Fastify / Hono / React) 추가 시 *"또 어떻게?"* 매번 결정.
- *카테고리 분류 모호* → 어댑터를 `backend/` 안에 둘지 / 별 카테고리 (`nestjs/`) 에 둘지 가이드 없음.
- *sunk cost trap* → 이미 박힌 `backend-logger-nestjs` 유지 시 모든 후속 framework adapter가 같은 어색한 패턴 답습.

**기초 박는 phase-03 시점에 룰 명문화 — 후속 spec이 흔들리지 않게 한다** (memory `feedback_platform_agnostic_packages` 보강).

## ✅ Decision

```txt
카테고리:           packages/<framework>/<name>     # 신규 — framework adapter
패키지 이름:        @repo/<framework>-<name>       # framework-first prefix
의존 방향:          <framework>/<X> → <tier>/<X>   # 단방향 (어댑터 → pure)
역방향:             <tier>/<X> → <framework>/<X>   # 금지 (pure는 framework dep 0)
교차 tier:          nestjs/* → frontend/*          # 금지 (implicit tier 침범)
                   react/* → backend/*            # 금지
```

### 1. 카테고리 — `packages/<framework>/<name>`

기존 5 카테고리에 *framework adapter 카테고리*를 추가:

```
packages/
  config/      # role-based (현행)
  shared/      # cross-tier (현행)
  backend/     # pure backend tier (framework dep 0)
  frontend/    # pure frontend tier (framework dep 0)
  nestjs/      # NestJS framework adapter (implies backend)        ← 신규
  react/       # React framework adapter (implies frontend)        ← 신규 (미래)
  testing/     # 현행
```

framework 카테고리는 *implicit tier 함의*:
- `nestjs/` — NestJS는 server framework → backend
- `react/` — React는 browser framework → frontend
- 미래: `fastify/` / `vue/` / `hono/` 등 — 카테고리 추가 자유

### 2. 명명 — framework-first prefix

| 카테고리 | dir-name | pkg-name |
|---|---|---|
| `config/` | `<name>-config` | `@repo/<name>-config` |
| `shared/` | `<name>` | `@repo/<name>` (prefix 없음) |
| `backend/` | `<name>` | `@repo/backend-<name>` |
| `frontend/` | `<name>` | `@repo/frontend-<name>` |
| **`nestjs/`** | `<name>` | `@repo/nestjs-<name>` |
| **`react/`** | `<name>` | `@repo/react-<name>` |
| `testing/` | `<name>` | `@repo/<name>` (기존 패턴) |

예:

```
packages/backend/logger/          → @repo/backend-logger        (pure)
packages/nestjs/logger/           → @repo/nestjs-logger         (NestJS 어댑터)
packages/backend/settings/        → @repo/backend-settings      (pure)
packages/nestjs/settings/         → @repo/nestjs-settings       (NestJS 어댑터)
```

### 3. 의존 방향 — 어댑터 → pure 단방향

depcruise 룰 (Task 5에서 박음):

| from → to | 허용 | 사유 |
|---|:---:|---|
| `nestjs/<X>` → `backend/<X>` | ✅ | 어댑터가 pure 의존 |
| `backend/<X>` → `nestjs/<X>` | ❌ | pure가 framework 의존 = platform-agnostic 위반 |
| `react/<X>` → `frontend/<X>` | ✅ | 동일 패턴 |
| `frontend/<X>` → `react/<X>` | ❌ | 동일 |
| `nestjs/<X>` → `frontend/<X>` | ❌ | tier 침범 (server↔browser) |
| `react/<X>` → `backend/<X>` | ❌ | 동일 |
| `nestjs/<X>` → `nestjs/<Y>` | ⚠️ case-by-case | 어댑터끼리 의존 — 필요 시 허용, 패턴 발견 시 재검토 |

### 4. 미래 확장

- 새 framework 도입 (예: Fastify) — `packages/fastify/` 카테고리 + `@repo/fastify-<name>` 패턴
- 같은 도메인 다중 framework — `nestjs/logger` + `fastify/logger` + `hono/logger` 공존 가능 (모두 같은 `backend/logger` pure 의존)

## 🔁 Alternatives Considered

| 옵션 | 패키지 명명 | 이유 / 거부 사유 |
|---|---|---|
| **A. suffix** | `@repo/backend-logger-nestjs` | 처음 박힌 패턴. 영문법 어색 (noun + adj 역어순). NPM 비표준. → **거부** |
| **B1. prefix + backend- 유지** | `@repo/backend-nestjs-logger` | 영문법 OK. dir = `packages/backend/nestjs-logger/`. `backend-nestjs-` 이중 prefix 장황. → **거부** |
| **B2. prefix + 어댑터만 backend- 생략** | `@repo/nestjs-logger` (dir = `packages/backend/nestjs-logger/`) | pkg name 깔끔. dir-pkg 불일치 (다른 패키지는 일치, 어댑터만 불일치 — 일관성 균열). → **거부** |
| **B3. prefix + 별 카테고리** | `@repo/nestjs-logger` (dir = `packages/nestjs/logger/`) | pkg name + dir 모두 일관. NPM 표준 (`@nestjs/config` / `react-query` 패턴). → **채택** |

## 🎯 Consequences

### 장점

- *영문법 + NPM 표준* 일관 → 외부 dev가 즉시 mental model 파악
- *카테고리 = framework* 매핑 → grep / 디렉토리 정렬 시 framework adapter 묶음 즉시 보임
- *pure ↔ adapter 단방향 정적 보장* (depcruise) → platform-agnostic 깨지지 않음
- 미래 framework 추가 시 *같은 패턴 답습* → spec 단위 결정 부담 0

### 단점

- *카테고리 수 증가* — 6 → 7+ (`nestjs/` 추가, 미래 `react/` `fastify/` 등). ADR-0003 §재검토 기준 *"카테고리가 5개를 넘어감"* 트리거 — 본 ADR로 명시적 트리거 + 결정.
- *기존 박힌 패키지 위반* — `@repo/backend-logger-nestjs` (PR #10 머지됨) + `@repo/backend-settings` 안 NestJS 코드 (PR #9 머지됨). 본 ADR ship 시점에 *위반 상태* 인정. 후속 spec (재구성 spec) 에서 정정.

## 🔁 Revisit Triggers

- 같은 도메인에서 *adapter끼리 의존*이 빈번해짐 (예: nestjs/logger ↔ nestjs/observability) — adapter-tier 카테고리 도입 검토
- *framework dep이 2개 이상*인 패키지 등장 (예: NestJS + Drizzle 어댑터) — 명명 정책 재검토 (`@repo/nestjs-drizzle-database`?)
- ADR-0003 §6 *카테고리 배치 규칙* 갱신 필요성 (본 ADR이 이미 부분 갱신)
- `shared/` 도입 결정 시 — 본 ADR도 함께 재검토 (현재 `packages/utils` `packages/errors` 등이 `packages/shared/<name>`로 이동할지)

## 📚 관련 문서

- [ADR-0003](./0003-package-layout-and-naming.md) — 기존 5 카테고리 (본 ADR로 갱신됨)
- memory `feedback_platform_agnostic_packages` — packages/backend/* 의 framework agnostic 원칙
- spec-03-02 walkthrough §사용자 협의 주제 4-5 — 본 ADR 트리거 논의
- ARCHITECTURE.md §3.2 — depcruise tier 룰
