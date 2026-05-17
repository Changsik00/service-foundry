# phase-04: Apps

> 실제로 booted되는 *서비스 진입점*. backend/frontend 패키지를 wire up하여 vertical-slice가 동작하는 reference application 셋을 만든다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-04` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 미정 |

## 🎯 배경 및 목표

### 현재 상황

Phase 2 + Phase 3가 끝나면 backend 인프라와 shared schema가 갖춰진다. Phase 4는 *조립*. apps/api(reference backend) + frontend packages(`ui` / `sdk` / `auth`) + 3개 web app(web-next / web-vite / admin) + apps/worker + apps/edge-api(Hono). 본 phase가 끝나면 사용자가 새 서비스를 띄울 때 *어떤 패키지를 어떻게 끼우는지* 보고 따라할 수 있다.

### 목표 (Goal)

apps/api가 packages/backend/* 전부를 wire up하고, apps/web-next + apps/web-vite가 packages/frontend/* 전부를 wire up하여, login → protected route → logout의 vertical-slice가 처음부터 끝까지 동작.

### 성공 기준 (Success Criteria) — 정량 우선

1. apps/api 부트 + `/health` 응답 + login endpoint로 JWT 발급.
2. apps/web-next + apps/web-vite 모두 동일한 `@repo/frontend/sdk` + `@repo/frontend/auth` 사용해 login 동작.
3. `docs/features/0001-login.md` vertical-slice가 작동: FE 폼 → API → Postgres → JWT → protected route → logout.
4. apps/worker 부트 + BullMQ job 처리 가능.
5. apps/edge-api(Hono) 별도 minimal `/health` 응답 (Cloudflare Workers 부트는 별 시나리오로 검증 — Icebox 결정 후).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-04-01 — apps-api

- **요점**: framework 보류 (ADR-0005 결과 따름). backend 패키지 전부 wire up하는 reference.
- **방향성**: 도메인은 최소(user/session)로 시작. 추가 도메인은 후속 spec.
- **참조**: ADR-0005, ARCHITECTURE.md §2.5.
- **연관 모듈**: `apps/api`

### spec-04-02 — apps-worker

- **요점**: BullMQ 워커 + observability + database.
- **방향성**: api와 동일 settings/logger 사용. 1개 sample job으로 booted 확인.
- **연관 모듈**: `apps/worker`

### spec-04-03 — frontend-ui

- **요점**: shadcn + tailwind + 공유 React 컴포넌트.
- **방향성**: tailwind 위치 결정(Icebox 이슈) 확정 후 진입.
- **참조**: ARCHITECTURE.md §2.4.
- **연관 모듈**: `packages/frontend/ui`

### spec-04-04 — frontend-sdk

- **요점**: contracts 기반 typed API client (zod → OpenAPI → codegen).
- **방향성**: `@repo/shared/contracts`가 SoT. codegen 명령은 turbo task로 등록.
- **연관 모듈**: `packages/frontend/sdk`

### spec-04-05 — frontend-auth

- **요점**: React provider + useSession hook + refresh interceptor + route guard (auth 3-package 중 3번째).
- **방향성**: `@repo/shared/auth-contracts` + `@repo/frontend/sdk` 의존.
- **참조**: ADR-0006, ARCHITECTURE.md §2.4.
- **연관 모듈**: `packages/frontend/auth`

### spec-04-06 — apps-web-next

- **요점**: Next.js App Router + tanstack-query + sdk + auth + ui.
- **방향성**: SSR + client component 혼용 reference.
- **연관 모듈**: `apps/web-next`

### spec-04-07 — apps-web-vite

- **요점**: Vite + tanstack-router + tanstack-query + sdk + auth + ui.
- **방향성**: SPA reference. apps/admin과 같은 스택을 공유 (분리 여부는 Icebox 이슈).
- **연관 모듈**: `apps/web-vite`

### spec-04-08 — apps-admin

- **요점**: web-vite와 같은 스택, 별도 layout.
- **방향성**: Icebox 이슈("apps/admin 별도 앱 vs apps/web-vite route") 결정 결과 따름.
- **연관 모듈**: `apps/admin` (또는 `apps/web-vite` 안의 route)

### spec-04-09 — apps-edge-api

- **요점**: Hono 기반 edge / serverless 예제.
- **방향성**: Icebox 이슈("scope: 같은 /api 모방 / 다른 엔드포인트 / Cloudflare Workers 전용") 결정 결과 따름.
- **연관 모듈**: `apps/edge-api`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| apps/admin 분리 여부 | 별도 앱 / web-vite route | 미정 (Icebox) | UI/권한 분리 비용 vs 코드 공유 이득의 trade-off 평가 후 결정 |
| tailwind 위치 | ui 패키지 전용 / 앱별 설치 | 미정 (Icebox) | 번들 사이즈 + customization 자유도 평가 후 결정 |
| apps/edge-api scope | /api 모방 / 다른 / CF Workers 전용 | 미정 (Icebox) | Hono의 차별화 가치(edge 부트 속도)를 보이는 최소 데모로 결정 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: vertical-slice login

- **Given**: 모든 spec-04-* 머지됨.
- **When**: web-next 또는 web-vite에서 login 폼 제출 → API → Postgres → JWT → protected route → logout.
- **Then**: 모든 단계 200 응답, JWT 만료 후 refresh 자동, logout 후 protected route 401.
- **연관 SPEC**: spec-04-01, spec-04-04, spec-04-05, spec-04-06 또는 spec-04-07

### 시나리오 2: depcruise FE→BE 금지

- **Given**: 모든 spec-04-* 머지됨.
- **When**: `pnpm exec depcruise --validate packages/frontend/`.
- **Then**: `packages/backend/*` import 0건 (ARCHITECTURE.md §3.2).
- **연관 SPEC**: spec-04-03, spec-04-04, spec-04-05

### 시나리오 3: worker job

- **Given**: spec-04-02 머지됨.
- **When**: API가 BullMQ로 sample job enqueue → worker 처리.
- **Then**: job DONE 상태 + observability trace 연결됨.
- **연관 SPEC**: spec-04-01, spec-04-02

### 통합 테스트 실행

```bash
# 가정: tooling/docker(Phase 5)가 아직 없으면 외부 Postgres/Redis 인스턴스 필요
pnpm --filter @apps/api dev &
pnpm --filter @apps/web-next dev &
# 또는 playwright/e2e 셋업(spec-04 후반에 도입)
```

## 🔗 의존성

- **선행 phase**: phase-02 + phase-03.
- **외부 시스템**: PostgreSQL, Redis (tooling/docker는 Phase 5).
- **연관 ADR**:
  - `docs/adr/0003-package-layout-and-naming.md` (apps/* 구조)
  - `docs/adr/0005-backend-framework-and-orm-strategy.md` (apps/api framework)
  - `docs/adr/0006-auth-strategy.md` (frontend/auth + backend/auth wire)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| FE/BE 동시 부트 dev 경험 복잡 | 신규 기여자 onboarding 비용 | tooling/docker(Phase 5)로 일괄 부트 |
| codegen 누락으로 sdk가 contracts와 drift | 컴파일 통과하나 런타임 실패 | codegen을 lefthook 또는 turbo task로 강제 |
| Icebox 3 이슈 미결로 spec-04-08/09 지연 | phase 완료 지연 | Phase 4 진입 시점에 Icebox 일괄 정리 (queue.md) |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-04-01 ~ spec-04-09) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] `docs/features/0001-login.md` 작성 + vertical-slice 동작
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
