# phase-03: Backend Primitives

> Node 전용 인프라 패키지군. **ADR-0005 / ADR-0006 결정 전까지 블록 상태**.
> framework + ORM + auth 전략이 확정되어야 첫 SPEC을 끊을 수 있다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-03` |
| **상태** | Planning (블로커 해소 대기) |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 (Phase 본문 작성 시 결정) |

## 🎯 배경 및 목표

### 현재 상황

`packages/backend/*`는 실제 서비스가 의존할 *인프라 빌딩 블록*이다. 그러나 결정 트리거가 두 개 보류 중:

- **ADR-0005** — backend framework (NestJS vs Fastify) + ORM (Drizzle vs Prisma) 동시 결정.
- **ADR-0006** — auth 전략 (`@nestjs/passport` vs `better-auth` 등). 본 ADR은 ADR-0005의 framework 결정에 강하게 의존하므로 *동시 결정*이 합리적.

두 결정 없이 첫 backend 패키지를 끊으면 framework-coupling이 잘못 박힐 위험이 크다.

### 목표 (Goal)

ADR-0005 / ADR-0006이 확정되면 10개 backend 패키지를 순차적으로 작성. 각 패키지는 framework module(또는 plugin)을 export하여 apps/api(Phase 4)가 wire up.

### 성공 기준 (Success Criteria) — 정량 우선

1. `packages/backend/*` 10개 패키지 모두 작성 + 단위 테스트 PASS.
2. dependency-cruiser 룰 검증: `packages/backend/*`는 `packages/frontend/*`를 import하지 않음 (ARCHITECTURE.md §3.2).
3. `packages/backend/auth`는 `shared/auth-contracts` + `shared/errors`만 의존 (+ JWT/argon2 lib).
4. `packages/backend/settings` (node-settings wrap)이 `.env.example` 자동 생성과 K8s manifest drift 검출을 dogfood.
5. apps/api(Phase 4)에서 본 패키지들을 wire up해 booted Fastify/NestJS app이 `/health`에 응답.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`
> ⚠️ 본 phase의 모든 SPEC은 블로커 해소 *이후* 시작.

### 🚧 선행 결정 (블로커)

1. **ADR-0005 spike 실행** → NestJS+Drizzle vs Fastify+Drizzle 최종 결정. PostgreSQL은 이미 확정 (ADR-0005 §3).
2. **ADR-0006 결정** → ADR-0005와 동시. Token 전략(JWT access + refresh / Redis denylist)과 password hashing(argon2)은 이미 확정 (ADR-0006).
3. **`docs/conventions/backend-module-layout.md` 작성** → ADR-0005 결정 직후. framework별 module/plugin export 컨벤션 정의.

### spec-03-01 — backend-settings

- **요점**: node-settings wrap (env validation + runtime config + `.env.example` 자동 생성 + K8s manifest drift 검출).
- **방향성**: backend의 다른 모든 패키지가 의존. dogfooding — service-foundry의 차별화 포인트 일부를 본 패키지로 흡수.
- **참조**: ARCHITECTURE.md §2.3, locked stack memory (node-settings).
- **연관 모듈**: `packages/backend/settings`

### spec-03-02 — backend-logger

- **요점**: pino + request-id 미들웨어 + redaction + dev pretty.
- **방향성**: framework agnostic core + framework adapter(NestJS interceptor 또는 Fastify hook).
- **참조**: ARCHITECTURE.md §2.3.
- **연관 모듈**: `packages/backend/logger`

### spec-03-03 — backend-http-client

- **요점**: undici 기반, retry / timeout / auth / trace / typed response.
- **방향성**: external API 호출 표준화.
- **연관 모듈**: `packages/backend/http-client`

### spec-03-04 — backend-auth

- **요점**: framework module (NestJS Module 또는 Fastify plugin), JWT issue/verify, RBAC guard.
- **방향성**: ADR-0006 결정 따름. shared/auth-contracts schema 사용. argon2 + Redis denylist.
- **참조**: ADR-0006, ARCHITECTURE.md §2.3.
- **연관 모듈**: `packages/backend/auth`

### spec-03-05 — backend-cache

- **요점**: ioredis wrapper (ttl, namespace, JSON, distributed lock).
- **방향성**: backend-auth의 refresh token denylist + 일반 캐시.
- **연관 모듈**: `packages/backend/cache`

### spec-03-06 — backend-queue

- **요점**: BullMQ wrapper (job 정의, 워커 boot helper).
- **방향성**: apps/worker(Phase 4)가 본 패키지 사용.
- **연관 모듈**: `packages/backend/queue`

### spec-03-07 — backend-database-prisma

- **요점**: Prisma client singleton + 마이그레이션 워크플로.
- **방향성**: ADR-0005의 ORM 결정에 따라 Drizzle/Prisma 둘 다 패키지를 둠 (locked stack memory).
- **연관 모듈**: `packages/backend/database-prisma`

### spec-03-08 — backend-database-drizzle

- **요점**: Drizzle client + schema + 마이그레이션.
- **방향성**: Prisma와 병행. 앱은 둘 중 하나를 선택해 import.
- **연관 모듈**: `packages/backend/database-drizzle`

### spec-03-09 — backend-security

- **요점**: helmet / cors / rate-limit preset.
- **방향성**: framework별 module/plugin 형태로 export.
- **연관 모듈**: `packages/backend/security`

### spec-03-10 — backend-observability

- **요점**: OTel SDK boot, tracer, metrics, `/health` `/ready`.
- **방향성**: 누구에게나 의존받되 다른 packages를 import하지 않음 (순환 방지 — ARCHITECTURE.md §3.2).
- **연관 모듈**: `packages/backend/observability`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Drizzle / Prisma 둘 다 / 하나만 | 하나만 / 둘 다 | 둘 다 (locked) | 보일러플레이트는 양쪽 사용자를 모두 지원. 앱은 선택해서 import |
| Database | PostgreSQL / MySQL | PostgreSQL | ADR-0005 §3 |
| Auth token 전략 | JWT only / JWT + refresh | JWT access + refresh (Redis denylist) | ADR-0006 |
| Password hashing | bcrypt / argon2 | argon2 | ADR-0006 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: backend 부트

- **Given**: spec-03-01 ~ spec-03-10 머지됨 + 가상 Fastify(or NestJS) app 부트 코드.
- **When**: app 부트 + `/health` 호출.
- **Then**: 200 응답 + observability tracer 활성 + logger structured log 확인.
- **연관 SPEC**: 전체

### 시나리오 2: depcruise 의존성 룰

- **Given**: 전 spec 머지됨.
- **When**: `pnpm exec depcruise --validate packages/backend/`.
- **Then**: `packages/frontend/*` import 0건 + `observability`가 다른 backend 패키지를 import하지 않음.
- **연관 SPEC**: 전체

### 시나리오 3: auth round-trip

- **Given**: spec-03-04 + spec-03-05 머지됨.
- **When**: login → JWT 발급 → protected endpoint 호출 → logout (refresh token denylist 등록).
- **Then**: 401 → 200 → 401 시퀀스 확인.
- **연관 SPEC**: spec-03-04, spec-03-05

### 통합 테스트 실행

```bash
pnpm test --filter="@repo/backend/*"
pnpm exec depcruise --validate packages/backend/
# E2E는 apps/api(Phase 4) 부트 후 가능 — 본 phase는 단위 + depcruise까지
```

## 🔗 의존성

- **선행 phase**: phase-02 (shared primitives, 특히 auth-contracts).
- **외부 시스템**: PostgreSQL, Redis (개발용 docker-compose는 Phase 5에서 정식화).
- **연관 ADR**:
  - `docs/adr/0005-backend-framework-and-orm-strategy.md` (**보류** — 본 phase 시작 블로커)
  - `docs/adr/0006-auth-strategy.md` (**보류** — 본 phase 시작 블로커)
  - `docs/adr/0003-package-layout-and-naming.md` (auth 3-package split)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| ADR-0005 spike 결과가 SPEC 분할/순서를 뒤집음 | 본 phase 본문 재작업 | spike 결과 받은 직후 본 phase의 SPEC 요점 섹션 갱신. 머지된 SPEC 없으면 비용 낮음 |
| Prisma + Drizzle 동시 유지의 schema 동기화 부담 | 마이그레이션 시 불일치 | 각자 폴더에 독립 schema. 공통 wrapper(`pnpm db:migrate`)는 Icebox 이슈(queue.md) — 결정 후 적용 |
| framework module export 컨벤션 불일치 | apps/api wire up 어려움 | `docs/conventions/backend-module-layout.md` 작성 후 spec 진입 |

## 🏁 Phase Done 조건

- [ ] ADR-0005 + ADR-0006 확정
- [ ] `docs/conventions/backend-module-layout.md` 작성
- [ ] 모든 SPEC(spec-03-01 ~ spec-03-10) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
