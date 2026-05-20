# phase-04: Frontend Foundation

> Frontend 패키지군의 *기반*. Vite/Next + apps/web-* scaffold + TanStack Query + UI 라이브러리 기본.
> 본 phase는 **auth 제외** — auth 영역은 phase-06 (Auth Integration)에서 통합.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-04` |
| **상태** | Planning (진입 시점) |
| **시작일** | 2026-05-20 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-04-frontend-foundation` |
| **Base Branch 모드** | Phase Base Branch 모드 — Spec PR이 phase branch로 머지, 모든 Spec 완료 후 phase branch가 main으로 |

## 🎯 배경 및 목표

### 현재 상황

- phase-03 (Backend Foundation) 완료 시점에 `apps/api`가 `/health` 응답 가능.
- 본 phase는 *frontend 인프라 기반*: UI 컴포넌트 라이브러리 + SDK(contracts 기반 typed API client) + apps/web-* scaffold.
- **auth는 phase-06**에서 `auth-react` Provider/hooks + Cookie 전략을 통합. 본 phase는 *auth 없이 frontend 부트 + non-auth API 호출*까지.
- `@repo/contracts` (phase-02)의 `UserProfile` + `paginatedResponse<T>` 사용 시연.

### 목표 (Goal)

`packages/frontend/*` 2 패키지(ui / sdk) + `apps/web-next` + `apps/web-vite` scaffold. 본 phase 종료 시 *web-next + web-vite가 부트* + `@repo/frontend/sdk`로 `apps/api` `/health` 또는 non-auth endpoint 호출 시연.

### 성공 기준 (Success Criteria) — 정량 우선

1. `packages/frontend/ui` (shadcn + tailwind 기반) + `packages/frontend/sdk` (contracts 기반 typed client) 작성 + 단위 테스트 PASS.
2. `apps/web-next` (Next.js App Router) + `apps/web-vite` (Vite + tanstack-router) 모두 부트 + 기본 페이지 렌더링.
3. 양 앱이 `@repo/frontend/sdk`로 phase-03 `apps/api`의 `/health` 호출 + 결과 표시.
4. dependency-cruiser 룰: `packages/frontend/*`는 `packages/backend/*` import 0건.
5. tailwind 위치 결정 (Icebox 이슈 해소) — `frontend/ui` 패키지 또는 앱별 설치.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-04-01` | frontend-ui | P? | Merged | `specs/spec-04-01-frontend-ui/` |
| `spec-04-02` | frontend-http-client | P? | Merged | `specs/spec-04-02-frontend-http-client/` |
| `spec-04-03` | web-next-scaffold | P? | Merged | `specs/spec-04-03-web-next-scaffold/` |
| `spec-04-04` | web-vite-scaffold | P? | Active | `specs/spec-04-04-web-vite-scaffold/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-04-01 — frontend-ui

- **요점**: shadcn + tailwind + 공유 React 컴포넌트 (Button / Input / Card 등 기본).
- **방향성**: tailwind 위치 결정(Icebox 이슈) 확정 후 진입.
- **참조**: ARCHITECTURE.md §2.4.
- **연관 모듈**: `packages/frontend/ui`

### spec-04-02 — frontend-http-client

- **요점**: ky 기반 typed HTTP client. backend-http-client 와 대칭. AppError 변환 + zod parse + retry/timeout.
- **방향성**: 명확한 scope — *HTTP client* 만. auth client / state / query 등은 별 패키지. `@repo/contracts` 가 SoT (호출자가 schema 명시 import).
- **연관 모듈**: `packages/frontend/sdk`

### spec-04-03 — apps-web-next-scaffold

- **요점**: Next.js App Router scaffold + tanstack-query + sdk + ui. 기본 페이지 + non-auth API 호출 시연.
- **방향성**: SSR + client component 혼용 reference. *auth wire-up은 phase-06*.
- **연관 모듈**: `apps/web-next`

### spec-04-04 — apps-web-vite-scaffold

- **요점**: Vite + tanstack-router + tanstack-query + sdk + ui. SPA reference.
- **방향성**: apps/admin과 같은 스택을 공유 (분리 여부는 phase-09에서).
- **연관 모듈**: `apps/web-vite`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| tailwind 위치 | ui 패키지 전용 / 앱별 설치 | 진입 시 결정 | 번들 사이즈 + customization 자유도 평가 후 결정. Icebox 이슈 해소 |
| sdk codegen | 본 phase / 후속 | 후속 | 본 phase는 *수동 wrap* — `@repo/contracts` zod schema → typed client. OpenAPI codegen은 phase-09 |
| `auth-react` 위치 | 본 phase / phase-06 | **phase-06** | Auth Integration phase로 분리 — auth 어휘 박힌 후 통합 |
| apps/admin / apps/edge-api / apps/worker | 본 phase / phase-09 | **phase-09** | apps 전체 wire-up은 phase-09 (Apps + Admin Tools) |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: frontend 부트

- **Given**: spec-04-01 ~ spec-04-04 머지됨 + phase-03 apps/api 부트 가능.
- **When**: `pnpm --filter @apps/web-next dev` + `pnpm --filter @apps/web-vite dev`.
- **Then**: 양 앱 부트 + 기본 페이지 렌더링 + sdk로 `/health` 호출 결과 표시.
- **연관 SPEC**: 전체

### 시나리오 2: depcruise FE→BE 금지

- **Given**: 전 spec 머지됨.
- **When**: `pnpm exec depcruise --validate packages/frontend/`.
- **Then**: `packages/backend/*` import 0건.
- **연관 SPEC**: spec-04-01, spec-04-02

### 통합 테스트 실행

```bash
pnpm --filter @apps/api dev &
pnpm --filter @apps/web-next dev &
pnpm --filter @apps/web-vite dev &
pnpm exec depcruise --validate packages/frontend/
```

## 🔗 의존성

- **선행 phase**: phase-02 (contracts) + phase-03 (Backend Foundation — apps/api 부트).
- **외부 시스템**: 없음 (phase-03의 PostgreSQL은 본 phase에서 직접 사용 안 함).
- **연관 ADR**:
  - `docs/adr/0003-package-layout-and-naming.md` (frontend 패키지 구조)
  - `docs/adr/0006-auth-strategy.md` (auth-react는 phase-06에서 통합)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| Next App Router + Vite tanstack-router 학습 곡선 | spec 진행 지연 | minimal scaffold 위주. 복잡한 라우팅 패턴은 phase-09에서 |
| `frontend/sdk` codegen 부재로 contracts와 drift | 컴파일 통과하나 런타임 실패 | spec-04-02에서 *수동 wrap + zod parse* 패턴 박음 — codegen은 phase-09에서 결정 |
| `tailwind` 위치 결정 미루면 spec-04-01 진입 어려움 | Icebox 무기한 | spec-04-01 진입 직전에 Icebox 이슈 정리 commit |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-04-01 ~ spec-04-04) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 2개 시나리오 PASS
- [ ] tailwind 위치 결정 (Icebox 해소)
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
