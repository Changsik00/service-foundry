# phase-02: Shared Primitives

> FE/BE 양측이 동일한 zod 스키마와 공유 유틸을 import할 수 있는 *공통 기반*을 만든다.
> 이 phase가 끝나면 backend 패키지(Phase 3)와 frontend 패키지(Phase 4)가 공통 타입/검증/에러를 같은 단어로 다루게 된다.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-02` |
| **상태** | Backlog |
| **시작일** | 미정 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 없음 (각 spec → main 직접 PR) |

## 🎯 배경 및 목표

### 현재 상황

Phase 1이 turbo toolchain + config preset을 검증하면 그 위에 *실제 코드가 들어가는 첫 패키지군*이 필요하다. 이 영역은 backend / frontend 어디서도 import 가능해야 하며, Node-only API에 의존하지 않아야 한다 (FE 번들 안전). 또한 zod schema가 BE/FE 공유의 단일 진입점(`@repo/shared/contracts`)이 되어야 한다 (ADR-0003 §6, ARCHITECTURE.md §2.2).

### 목표 (Goal)

`packages/shared/*` 5개 패키지를 작성하고, FE/BE 양측에서 import 가능함을 확인한다. 모든 패키지는 JIT(ADR-0004) — tsup 빌드 없이 `src/index.ts` 직접 export.

### 성공 기준 (Success Criteria) — 정량 우선

1. `packages/shared/utils`, `errors`, `validation`, `contracts`, `auth-contracts` 5개 패키지가 catalog 통해 `@repo/<name>`으로 import 가능.
2. 각 패키지는 단위 테스트 ≥ 1개로 동작 확인.
3. dependency-cruiser 룰 검증: `packages/shared/*`는 Node-only API(예: `node:fs`)를 import하지 않음.
4. `packages/shared/auth-contracts`는 ADR-0006의 Session / User / JwtPayload / Role enum zod schema를 export (spec-02-04에서 spec-02-05 흡수 후 핵심 4 schema 우선 박음).
5. 가상의 FE(예: Vite SPA) + BE(예: Fastify)에서 `@repo/shared/contracts` 같은 schema를 import해 round-trip 가능 (수동 검증 충분).

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-02-01` | shared-utils | P? | Merged | `specs/spec-02-01-shared-utils/` |
| `spec-02-02` | shared-errors | P? | Merged | `specs/spec-02-02-shared-errors/` |
| `spec-02-03` | shared-validation | P? | Merged | `specs/spec-02-03-shared-validation/` |
| `spec-02-04` | shared-contracts | P? | Active | `specs/spec-02-04-shared-contracts/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-02-01 — shared-utils

- **요점**: Result, sleep, pick/omit 등 순수 유틸.
- **방향성**: zod 외 런타임 의존성 0. Phase 1 스텁(`packages/shared/utils`)을 실제 코드로 채움.
- **참조**: ARCHITECTURE.md §2.2.
- **연관 모듈**: `packages/shared/utils`

### spec-02-02 — shared-errors

- **요점**: `AppError` 계층 + JSON 직렬화 (BE/FE 공유).
- **방향성**: 도메인별 에러 코드 enum + 직렬화 헬퍼. BE는 HTTP 응답에, FE는 사용자 메시지에 사용.
- **참조**: ARCHITECTURE.md §2.2.
- **연관 모듈**: `packages/shared/errors`

### spec-02-03 — shared-validation

- **요점**: zod helper + 공통 schema (UUID, Email, Pagination 등).
- **방향성**: 도메인 schema(`shared/contracts`)가 import하는 기본 building block.
- **참조**: ARCHITECTURE.md §2.2.
- **연관 모듈**: `packages/shared/validation`

### spec-02-04 — shared-contracts

- **요점**: 도메인별 zod schema + DTO 타입 (BE/FE 공유 진입점).
- **방향성**: API 스키마의 SoT. 본 spec이 머지되면 frontend/sdk(Phase 4)가 여기서 codegen.
- **참조**: ADR-0003 §6 (auth-contracts 분리), ARCHITECTURE.md §2.2.
- **연관 모듈**: `packages/shared/contracts` + `packages/shared/auth-contracts` (당초 spec-02-05로 분리 계획했으나 본 spec에 흡수 — 아래 결정 기록 참조)

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `lat.md` Phase 2 도입 평가 | 도입 / 보류 / 폐기 | 본 Phase 시작 시점에 평가 | 코드베이스 지식 그래프 도구. Phase 2가 첫 "코드다운 코드"가 들어가는 시점이라 평가에 적합 (`backlog/queue.md` Icebox 항목 참조) |
| spec-02-05 (shared-auth-contracts) 분리 유지 vs spec-02-04에 흡수 | 별 spec 유지 / spec-02-04에 흡수 | **흡수** (2026-05-18) | ADR-0006(auth strategy) 보류 상태 — auth-contracts schema는 핵심 4개(`Role` / `User` / `Session` / `JwtPayload`)만 우선. 두 spec 모두 *얇은 schema 정의* 위주라 분리 ceremony > 결정 부담. 패키지 분리(ADR-0003 §6)는 유지. |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: BE/FE round-trip

- **Given**: spec-02-04 머지됨 (`@repo/contracts` + `@repo/auth-contracts` 두 패키지 포함).
- **When**: 가상 BE에서 zod schema로 응답 생성 → 가상 FE에서 동일 schema로 parse.
- **Then**: 양측 타입 일치 + 런타임 validation 통과.
- **연관 SPEC**: spec-02-04

### 시나리오 2: shared/* Node-only import 금지

- **Given**: 모든 spec-02-* 머지됨.
- **When**: `pnpm exec depcruise --validate packages/shared/`.
- **Then**: `node:*` 또는 Node-only npm 패키지 import 0건.
- **연관 SPEC**: spec-02-01 ~ spec-02-04

### 통합 테스트 실행

```bash
pnpm test --filter="@repo/shared/*"
pnpm exec depcruise --validate packages/shared/
```

## 🔗 의존성

- **선행 phase**: phase-01 (toolchain + config preset).
- **외부 시스템**: 없음.
- **연관 ADR**:
  - `docs/adr/0003-package-layout-and-naming.md` (auth-contracts 분리 결정)
  - `docs/adr/0004-typescript-and-compilation-strategy.md` (shared/* = JIT)
  - `docs/adr/0006-auth-strategy.md` (auth-contracts schema, 단 ADR 자체는 보류 상태)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| zod 메이저 버전 변경 시 schema 호환성 깨짐 | 모든 후속 패키지 영향 | catalog 단일 pin (ADR-0002) + 변경 시 migration spec 별도 |
| `shared/contracts`가 도메인 비대화 | FE 번들 사이즈 증가 | 도메인별 sub-path export(`@repo/shared/contracts/user`) 활용 (ARCHITECTURE.md §3.3) |
| ADR-0006 보류 상태에서 auth-contracts schema 동결 | 후속 결정에 따라 schema 변경 | spec-02-04에서 핵심 4 schema(`Role` / `User` / `Session` / `JwtPayload`)만 우선 정의. 확장은 ADR-0006 확정 후 별 spec. |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-02-01 ~ spec-02-04)이 main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 2개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
