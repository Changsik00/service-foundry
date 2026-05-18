---
id: ADR-0011
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0011: contracts 패키지 분할 + 도메인 범위 컨벤션

## 📚 Context

ADR-0003 §6에서 `shared/contracts`와 `shared/auth-contracts`를 *별 패키지로 분리*하기로 결정했다. 본 spec-02-04이 두 패키지를 *실제로 박는* 첫 단계. 다만:

- **ADR-0006 (auth strategy)은 보류 상태** — auth-contracts schema가 *공중에 뜸*. 본격 확장(refresh token / OAuth provider / permission 세분화)은 ADR 확정 후로 미룸.
- 본래 spec-02-04(contracts) + spec-02-05(auth-contracts) 두 spec으로 분리 계획했으나 **spec-02-04에 흡수** — 두 패키지 모두 *얇은 schema 정의* 위주라 분리 ceremony가 결정 부담보다 큰 역전. phase-02.md 결정 기록에 명시.
- ARCHITECTURE.md §2.2 / §3.3: contracts는 *BE/FE 공유 진입점*이며 *도메인별 sub-path export*로 tree-shaking 친화.
- spec-02-03 (`@repo/validation`)에서 `parse` / `Uuid` / `Email` / `Pagination`이 박혔으므로 contracts는 이를 *기반 어휘*로 schema 정의.

**boilerplate 특성** 고려: 사용자가 fork해서 *자체 도메인 schema*를 채움. 본 패키지의 역할은 *컨벤션 전달* (예시 1~2개 + 규약).

## 🎯 Decision

다음 6 결정을 박는다.

1. **`@repo/contracts` ↔ `@repo/auth-contracts` 분리 유지** (ADR-0003 §6 재확인 + 강화). 이유:
   - auth-strategy 불확실성 격리 (ADR-0006 보류 → schema 변경 시 영향 범위 한정)
   - 후속 `backend/auth` + `frontend/auth`가 *공통 의존*해야 함 — 도메인 contracts와 *layering 분리*가 자연스러움
   - boilerplate 사용자가 *auth 부분만 교체*하기 쉬움 (예: Auth0 / Clerk / 자체 구현 전환 시 auth-contracts만 영향)

2. **도메인별 sub-path export 컨벤션**: `@repo/contracts/user` 같은 패턴.
   - `package.json` `exports` 필드에 명시 (`{ ".": ..., "./user": ..., "./pagination": ... }`)
   - 도메인 단위 import로 tree-shaking 최적화 (`import { UserProfile } from "@repo/contracts/user"`)
   - 단, `.` (root)에서 *re-export*도 제공 (`import { UserProfile } from "@repo/contracts"` 도 가능) — 호출자 편의 우선

3. **`paginatedResponse<T>` 패턴** (`@repo/contracts/pagination`):
   - 응답 측: `{ items: T[]; page; perPage; total }`
   - 요청 측은 `@repo/validation`의 `Pagination` (page/perPage with defaults)
   - cursor 기반 변형은 도메인 spec에서 별도 (예: `cursorPaginatedResponse`)

4. **auth-contracts 핵심 4 schema 우선** (`Role` / `User` / `Session` / `JwtPayload`):
   - ADR-0006 확정 전까지 *최소 골격*
   - 확장(권한 / refresh token / OAuth provider / 다중 role 등)은 ADR-0006 후속 spec
   - 본 ADR이 *향후 확장의 진입점* — schema 확장 시 본 ADR 갱신 또는 후속 ADR-001N 참조

5. **호스팅 앱은 *자체 schema 패키지*에서 도메인 확장**:
   - 본 패키지는 `UserProfile` 1개만 예시 — 컨벤션 전달용
   - 사용자가 fork 후 `@repo/contracts`에 *자체 도메인*(`Order` / `Product` / `Notification` 등)을 직접 추가 가능
   - 또는 *별도 패키지* (`@yourapp/contracts`)로 분리 — 본 boilerplate의 패턴(`packages/shared/contracts`)을 *복제*해서 자체 도메인 패키지 만들기 권장

6. **spec-02-05 흡수 결정 기록** (architectural decision은 아니나 ADR-0003 §6과 cross-ref):
   - 패키지 분리는 유지 (decision 1) — *spec 단위 통합*과 *패키지 분리*는 독립
   - 본 ADR이 미래의 *분리 vs 통합 재결정* 시 참조점
   - 이유: ADR-0006 보류 + ceremony 절감 + 두 패키지가 *얇은 schema 정의*

## ✅ Consequences

### 긍정

- **컨벤션 박힘**: 도메인 sub-path export 패턴 + `paginatedResponse` + 핵심 4 auth schema가 *후속 spec/phase의 기준*.
- **auth 교체 용이**: ADR-0003 §6 분리 유지로 *auth 구현체 교체 시 ripple 한정*.
- **tree-shaking**: sub-path export로 *도메인 단위 import* 가능 — FE bundle 사이즈 최적화.
- **boilerplate 사용성**: 사용자가 *자체 도메인 추가 방식*을 본 ADR에서 가이드 받음.
- **ADR-0006 보류 영향 격리**: auth-contracts schema가 *최소 골격*이라 ADR 확정 시 확장 부담 작음.

### 부정 / Trade-off

- **두 패키지 운영 비용**: 각 패키지 *scaffold + 빌드 설정* 중복. shared/* JIT(ADR-0004)이라 빌드 부담은 0이나 *문서/리뷰* 측면 비용.
- **sub-path export 누락 위험**: 새 도메인 추가 시 `package.json exports` 갱신 잊으면 sub-path import 안 됨. CI 검증(예: knip / depcruise)으로 보완 가능.
- **호스팅 앱 자체 schema 패턴이 *컨벤션 일관성*에 의존**: 사용자가 `paginatedResponse` 안 쓰고 자체 패턴 만들면 *FE/BE drift* — 본 ADR은 가이드일 뿐 강제 못 함.
- **spec-02-05 흡수의 추적성 저하**: 두 패키지가 *한 PR*에 박혀서 git blame 시 cross-cutting commit이 됨. 다만 패키지 디렉토리가 *분리되어 있어* 영향 작음.

## 🔄 Alternatives

| 대안 | 비채택 이유 |
|---|---|
| **단일 `@repo/contracts`로 통합** (auth-contracts 흡수) | auth 교체 시 도메인 schema도 영향. ADR-0003 §6 *분리* 결정 뒤집어야 함. ripple 큼. |
| **OpenAPI codegen 우선** (zod schema 대신 OpenAPI spec → 타입 생성) | 본 monorepo는 *zod-first* (ADR-0002 catalog 결정). OpenAPI는 Phase 4 `@repo/frontend/sdk`에서 *zod schema → OpenAPI 변환* 방향으로 검토. |
| **valibot 사용** | catalog는 zod 결정. valibot 채택 시 ADR-0002 뒤집어야 함. |
| **Prisma schema → zod 변환** (`prisma-zod-generator` 같은 도구) | Prisma는 *DB layer*. contracts는 *API/도메인 layer* — 분리가 아키텍처적으로 자연스러움. Prisma 채택 결정도 ADR-0005에서 *보류* 상태. |
| **단일 root export** (sub-path 없이 `@repo/contracts`만) | 도메인 비대 시 FE bundle 부담. tree-shaking은 *모듈 단위*가 효과적 — sub-path 채택. |
| **호스팅 앱의 *별도 monorepo* 분리** (도메인 schema는 사용자 repo에) | boilerplate가 *예시* 안 주면 컨벤션 학습 곡선. 1개 도메인(`UserProfile`) 박는 정도가 *균형점*. |

## 🔗 Related

- **선행**:
  - [ADR-0003](./0003-package-layout-and-naming.md) §6 — auth-contracts 분리 결정 (본 ADR이 *재확인 + 강화*)
  - [ADR-0006](./0006-auth-strategy.md) — auth strategy (보류 상태). 본 ADR의 auth-contracts 핵심 4 schema 결정에 *직접 영향*
  - [ADR-0008](./0008-result-type.md) — `Result<T, E>` (consumers가 `parse` 결과로 받음)
  - [ADR-0009](./0009-app-error-design.md) — `AppError` (consumers의 에러 어휘)
  - [ADR-0010](./0010-validation-zod-result-integration.md) — `parse` / `fromZodError` / 공통 schema (본 ADR의 *기반 어휘*)
- **후속**:
  - Phase 3 backend: route handler가 `parse(contractSchema, body)` 사용
  - Phase 4 frontend: form/SDK가 동일 schema parse + SDK codegen 검토
  - ADR-0006 확정 시 auth-contracts schema 확장 spec (별 ADR 또는 본 ADR 갱신)
- **코드**:
  - [`packages/shared/contracts/`](../../packages/shared/contracts/)
  - [`packages/shared/auth-contracts/`](../../packages/shared/auth-contracts/)
- **결정 기록**: `backlog/phase-02.md` §결정 기록 — spec-02-05 흡수 명시 (본 ADR과 cross-ref)
