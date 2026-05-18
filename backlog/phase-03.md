# phase-03: Backend Foundation

> Node 전용 인프라 패키지군의 *기반*. ADR-0005(NestJS+Drizzle 단일) 확정 후 진입 가능.
> 본 phase는 **auth 제외** — auth 영역은 phase-05~08에 분산.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-03` |
| **상태** | Planning (진입 가능 — ADR-0005/0006 확정 완료) |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-03-backend-foundation` |
| **Base Branch 모드** | Phase Base Branch 모드 — Spec PR이 phase branch로 머지, 모든 Spec 완료 후 phase branch가 main으로 |

## 🎯 배경 및 목표

### 현재 상황

- Phase 2 (Shared Primitives) 완료. `@repo/utils` / `@repo/errors` / `@repo/validation` / `@repo/contracts` / `@repo/auth-contracts` 박힘.
- **ADR-0005 확정** (spec-x-auth-foundation-prep): **NestJS + Drizzle (단일 ORM)**.
- **ADR-0006 확정**: Auth Platform 전략 (Consistent Wrapped SDK + Internal Session). 그러나 auth 영역은 phase-05~08에 분산되므로 본 phase에선 *제외*.
- `packages/backend/*`는 실제 서비스가 의존할 *인프라 빌딩 블록*. 본 phase는 *non-auth 기반*.

### 목표 (Goal)

NestJS + Drizzle 기반의 *non-auth backend 인프라 패키지 6개* + `apps/api` scaffold. 본 phase 종료 시 *apps/api가 `/health` 응답* + Drizzle 마이그레이션 동작 + observability tracer 활성.

### 성공 기준 (Success Criteria) — 정량 우선

1. `packages/backend/*` 6개 패키지(settings / logger / http-client / database / observability / security) 모두 작성 + 단위 테스트 PASS.
2. dependency-cruiser 룰 검증: `packages/backend/*`는 `packages/frontend/*`를 import하지 않음 (ARCHITECTURE.md §3.2).
3. `packages/backend/database` (Drizzle) 마이그레이션 워크플로 동작 확인 + PostgreSQL 연결.
4. `packages/backend/settings` (node-settings wrap)이 `.env.example` 자동 생성과 K8s manifest drift 검출을 dogfood.
5. `apps/api` scaffold가 본 패키지들 wire up → booted NestJS app이 `/health`에 200 응답 + tracer 활성.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-03-01` | backend-settings | P? | Active | `specs/spec-03-01-backend-settings/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-03-01 — backend-settings

- **요점**: node-settings wrap (env validation + runtime config + `.env.example` 자동 생성 + K8s manifest drift 검출).
- **방향성**: backend의 다른 모든 패키지가 의존. dogfooding — service-foundry의 차별화 포인트 일부를 본 패키지로 흡수.
- **참조**: ARCHITECTURE.md §2.3, locked stack memory (node-settings).
- **연관 모듈**: `packages/backend/settings`

### spec-03-02 — backend-logger

- **요점**: pino + request-id 미들웨어 + redaction + dev pretty.
- **방향성**: NestJS interceptor adapter.
- **참조**: ARCHITECTURE.md §2.3.
- **연관 모듈**: `packages/backend/logger`

### spec-03-03 — backend-http-client

- **요점**: undici 기반, retry / timeout / trace / typed response.
- **방향성**: external API 호출 표준화. *auth는 본 spec 밖* — auth-{provider} 패키지가 자체 SDK 사용.
- **연관 모듈**: `packages/backend/http-client`

### spec-03-04 — backend-database

- **요점**: Drizzle client + schema 컨벤션 + 마이그레이션 워크플로.
- **방향성**: ADR-0005 결정 (Drizzle 단일). PostgreSQL 연결.
- **참조**: ADR-0005.
- **연관 모듈**: `packages/backend/database`

### spec-03-05 — backend-observability

- **요점**: OTel SDK boot, tracer, metrics, `/health` `/ready` endpoint.
- **방향성**: 누구에게나 의존받되 다른 packages를 import하지 않음 (순환 방지 — ARCHITECTURE.md §3.2).
- **연관 모듈**: `packages/backend/observability`

### spec-03-06 — backend-security

- **요점**: helmet / cors / 기본 rate-limit preset.
- **방향성**: NestJS module 형태로 export. *auth-specific* rate-limit (login attempt 등)은 phase-05 `auth-security` 패키지에서.
- **연관 모듈**: `packages/backend/security`

### spec-03-07 — apps-api-scaffold

- **요점**: `apps/api` NestJS app + 본 phase 6 패키지 wire up + `/health` 라우트.
- **방향성**: phase-09 (Apps + Admin Tools)에서 본 scaffold를 *확장* (auth wire-up / business endpoint 추가).
- **연관 모듈**: `apps/api`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Framework | NestJS / Fastify / Hono | NestJS | ADR-0005 (Decorator-based DI가 auth-nestjs Guards/Decorators 패턴에 자연 적합) |
| ORM | Drizzle 단일 / Prisma+Drizzle 둘 다 | **Drizzle 단일** | ADR-0005 (auth-session storage 강결합 + 두 ORM 운영 비용 + memory 정정) |
| Database | PostgreSQL / MySQL | PostgreSQL | ADR-0005 §3 |
| `cache` 패키지 | phase-03 / phase-05+ | **phase-05 또는 후속** | 본 phase는 *non-auth*. Redis는 auth-session storage option에서 필요 시점 박기 |
| `queue` 패키지 | phase-03 / phase-09 | **phase-09** | apps/worker가 본 패키지 사용. 본 phase scope 밖 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: backend 부트

- **Given**: spec-03-01 ~ spec-03-07 머지됨.
- **When**: `apps/api` 부트 + `/health` 호출.
- **Then**: 200 응답 + observability tracer 활성 + logger structured log 확인.
- **연관 SPEC**: 전체

### 시나리오 2: depcruise 의존성 룰

- **Given**: 전 spec 머지됨.
- **When**: `pnpm exec depcruise --validate packages/backend/`.
- **Then**: `packages/frontend/*` import 0건 + `observability`가 다른 backend 패키지를 import하지 않음.
- **연관 SPEC**: 전체

### 시나리오 3: Drizzle 마이그레이션

- **Given**: spec-03-04 머지됨 + 로컬 PostgreSQL.
- **When**: `pnpm db:migrate` (또는 동등 명령).
- **Then**: schema 적용 + drizzle-kit 검증 그린.
- **연관 SPEC**: spec-03-04

### 통합 테스트 실행

```bash
pnpm test --filter="@repo/backend/*"
pnpm exec depcruise --validate packages/backend/
# E2E는 apps/api 부트 후 가능
```

## 🔗 의존성

- **선행 phase**: phase-02 (shared primitives).
- **외부 시스템**: PostgreSQL (개발용 docker-compose는 phase-10에서 정식화).
- **연관 ADR**:
  - `docs/adr/0005-backend-framework-and-orm-strategy.md` (Accepted — NestJS + Drizzle)
  - `docs/adr/0006-auth-strategy.md` (Accepted — auth는 phase-05~08)
  - `docs/adr/0003-package-layout-and-naming.md`
- **연관 design note**: `docs/notes/auth-foundation-architecture.md` (auth 영역 참조 자료 — 본 phase에서 직접 사용 안 하나 phase-05 진입 시 참조)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| `apps/api` scaffold가 *auth wire-up 없이* 부트만 함 | phase-09에서 *auth 다시 wire up* | phase-03 spec-03-07은 *minimal scaffold*. phase-09에서 확장 시점 인지 |
| Drizzle schema 컨벤션 미확정 시 phase-05 auth-session 진입 시 schema 충돌 | rework | spec-03-04에서 *schema 컨벤션 docs* + 마이그레이션 디렉토리 구조 확정 |
| `backend-security`의 일반 rate-limit과 `auth-security`의 auth rate-limit 중복 | 두 패키지 의존성 충돌 | spec-03-06에서 *일반 rate-limit만* (path-agnostic). auth-specific은 phase-05 |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-03-01 ~ spec-03-07) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
