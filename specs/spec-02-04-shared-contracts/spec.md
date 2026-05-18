# spec-02-04: `@repo/contracts` + `@repo/auth-contracts` — 도메인 schema 진입점 (단일 spec 통합)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-02-04` |
| **Phase** | `phase-02` |
| **Branch** | `spec-02-04-shared-contracts` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-18 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- spec-02-01~03에서 `@repo/utils` (Result), `@repo/errors` (AppError), `@repo/validation` (parse/fromZodError + Uuid/Email/Pagination) 박음.
- ARCHITECTURE.md §2.2: `contracts = 도메인 zod schema + DTO 타입 (BE/FE 공유 진입점)`, `auth-contracts = ADR-0006 §14에서 결정된 3-package split의 shared 파트`.
- ADR-0003 §6: auth-contracts는 *별 패키지로 분리* (auth-strategy 불확실성 격리 — backend/auth + frontend/auth가 *공통 의존*해야 하므로 split).
- ADR-0006(auth strategy)은 **보류 상태** — auth-contracts schema가 *공중에 뜸*.
- phase-02.md의 본래 계획: spec-02-04(contracts) + spec-02-05(auth-contracts) 분리. 본 spec이 **두 spec을 통합**.

### 문제점

1. **분리 spec의 ceremony 비용**: 두 패키지 모두 *얇은 schema 정의* 위주. 두 PR로 분리 시 *결정 부담*보다 *진입/ship 절차*가 더 큰 역전. spec-02-02처럼 *대형 결정+큰 코드*가 아닌 *작은 적용*이라 분리 가치 낮음.
2. **ADR-0006 보류 상태**: auth-contracts schema는 *핵심 필드만* (User / Session / JwtPayload / Role). 본격 schema 확장은 ADR-0006 확정 후 별 spec. 별 spec으로 진입해도 *내용이 적음*.
3. **phase-02 마무리 우선**: 본 spec 머지 후 `/hk-phase-ship` → Phase 3(backend) 진입 가능. 4개 spec으로 phase-02 닫는 게 시간/추적 효율적.
4. **boilerplate 특성**: 사용자가 fork해서 *자체 도메인 schema* 채움. 예시 도메인 1~2개만 박으면 *컨벤션* 전달에 충분.

### 해결 방안 (요약)

**단일 spec에 두 패키지 모두 박음** (패키지 분리는 ADR-0003 §6 그대로 유지):

1. **`@repo/contracts`** (`packages/shared/contracts/`):
   - 예시 도메인 schema 1~2개 (`UserProfile` + `PaginatedResponse<T>` 유틸 helper) — 컨벤션 전달용
   - 도메인별 sub-path export 시연 (`@repo/contracts/user` 같은 패턴)
   - `parse` (spec-02-03) 어휘로 round-trip test
2. **`@repo/auth-contracts`** (`packages/shared/auth-contracts/`):
   - **핵심 4 schema만**: `Role` enum / `User` / `Session` / `JwtPayload` — ADR-0006 보류 상태 고려
   - 본격 schema 확장(권한 / refresh token / OAuth provider 등)은 ADR-0006 확정 후 별 spec
3. **phase-02.md 갱신**: spec-02-05 정의 제거 + 결정 기록에 "spec-02-04에 흡수" 명시. Phase Done 조건에서 spec-02-05 제거.
4. **ADR-0011 후보**: *contracts 패키지 분할 + 도메인 범위 컨벤션* (type: convention).

## 📊 개념도

```mermaid
flowchart TB
    subgraph "@repo/contracts"
        UP[UserProfile zod schema]
        PR[paginatedResponse helper]
        SUB[sub-path: /user 등]
    end
    subgraph "@repo/auth-contracts"
        R[Role enum]
        U[User]
        S[Session]
        JP[JwtPayload]
    end
    subgraph "기존 (spec-02-01~03)"
        V[@repo/validation — parse/Uuid/Email/Pagination]
        E[@repo/errors — AppError]
        UT[@repo/utils — Result]
    end
    subgraph "후속 consumers"
        BE[Phase 3 backend/auth + route handlers]
        FE[Phase 4 frontend/auth + form/SDK]
    end
    V --> UP
    V --> U
    V --> S
    UP --> BE
    UP --> FE
    U --> BE
    U --> FE
    S --> BE
    S --> FE
```

## 🎯 요구사항

### Functional Requirements

1. **`packages/shared/contracts` 신규 패키지** (`@repo/contracts`):
   - scaffold (package.json / tsconfig.json (DOM lib) / vitest.config.ts) — spec-02-03 패턴 답습
   - `dependencies`: `@repo/validation: workspace:*` + `zod: catalog:` (validation 경유로 zod 간접도 가능하나 *명시적 직접* 의존이 import 가독성 우위)
   - 예시 도메인: `UserProfile` (id: Uuid / email: Email / displayName / createdAt). sub-path export 패턴 시연.
   - 유틸 helper: `paginatedResponse<T>(itemSchema): ZodType<{ items: T[]; page: number; perPage: number; total: number }>` — `Pagination` 패턴의 응답 측 (요청은 spec-02-03 `Pagination`).
   - test: schema parse 성공/실패 + `paginatedResponse` round-trip.

2. **`packages/shared/auth-contracts` 신규 패키지** (`@repo/auth-contracts`):
   - 동일 scaffold 패턴
   - `dependencies`: `@repo/validation` + `zod`
   - **핵심 4 schema**:
     - `Role = z.enum(["user", "admin"])` — 최소 2개 (boilerplate 확장 여지)
     - `User = z.object({ id: Uuid, email: Email, role: Role, createdAt: z.iso.datetime() })`
     - `Session = z.object({ userId: Uuid, expiresAt: z.iso.datetime() })`
     - `JwtPayload = z.object({ sub: Uuid, role: Role, iat: z.number(), exp: z.number() })`
   - test: 각 schema parse 1~2건씩.

3. **ADR-0011 작성** (`docs/adr/0011-contracts-package-layout.md`, type: convention):
   - Decision: `@repo/contracts` vs `@repo/auth-contracts` 분리 유지 (ADR-0003 §6 강화) / 도메인별 sub-path export 컨벤션 / `paginatedResponse` 패턴 / 핵심 schema 위주 + 도메인 확장은 *호스팅 앱*이 자체 패키지에서
   - Alternatives: 단일 `@repo/contracts`로 통합 / OpenAPI codegen 우선 / valibot / Prisma schema → zod 변환

4. **phase-02.md 갱신** (본 spec의 task 1로 포함):
   - spec 표에 spec-02-04 추가됨 (이미 sdd가 자동)
   - 본문 §spec-02-05 정의 *제거*
   - 결정 기록에 "spec-02-05를 spec-02-04에 흡수 (2026-05-18) — ADR-0006 보류 + ceremony 절감" 추가
   - Phase Done 조건에서 spec-02-05 제거 (spec-02-01 ~ spec-02-04)

5. **단위 테스트**: ~10 test 예상 (contracts 4~5 + auth-contracts 4~5).

### Non-Functional Requirements

1. **zod + @repo/validation 외 런타임 의존성 0**.
2. **Node-only API 금지** (shared/* 원칙).
3. **tree-shaking 친화**: named export. sub-path export로 도메인 단위 import 가능.
4. **ADR-0006 보류 상태 명시**: auth-contracts schema에 *"ADR-0006 확정 시 schema 확장 예정"* 주석 또는 README.
5. **lefthook race fix 이후 2번째 spec** — 정상 차단 동작 재검증 가치.

## 🚫 Out of Scope

- **권한/permission schema** (`Permission` / `Role-Permission mapping`) — ADR-0006 확정 후. 단순 `Role` enum만.
- **refresh token / OAuth provider schema** — ADR-0006 확정 후.
- **도메인별 endpoint schema** (`POST /users` request/response 등) — 본 spec은 *도메인 타입*만. endpoint contract는 Phase 3 backend 또는 OpenAPI codegen 단계.
- **OpenAPI 변환** — Phase 4 SDK.
- **TRPCRouter 정의** — TRPC 채택 결정 안 됨.
- **GraphQL schema** — 동일.
- **추가 도메인** (Order, Product, Notification 등) — boilerplate라 예시 1개로 충분. 사용자가 fork 후 자체 추가.

## 📑 ADR 후보 (Architecture Decision Records)

> 본 SPEC의 결정 중 *장기 자산* 으로 박을 가치 있는 것이 있는가?

- [x] ADR 가치 있는 결정 있음 → `contracts-package-layout` (type: **convention**)
- [ ] 없음

**근거**:
- 두 패키지 분리 유지 결정 (ADR-0003 §6 *재확인 + 강화*) + 도메인별 sub-path export 컨벤션 + `paginatedResponse` 패턴 + *호스팅 앱의 자체 schema 패키지* 가이드.
- spec-02-05 흡수 결정도 함께 기록 (architecture-level decision 아니지만 phase-02.md 결정 기록과 cross-ref).

## 🔍 Critique 결과 (선택)

미실행. 본 spec은 *어휘 적용*이라 새 결정 부담 작음. 필요 시 ADR-0011 작성 중에 self-review.

## ✅ Definition of Done

- [ ] `packages/shared/contracts` + `packages/shared/auth-contracts` 두 패키지 scaffold
- [ ] `@repo/contracts`: `UserProfile` + `paginatedResponse<T>` 구현
- [ ] `@repo/auth-contracts`: `Role` / `User` / `Session` / `JwtPayload` 구현
- [ ] `pnpm test` 그린 (~10 test 추가)
- [ ] `pnpm lint` / `pnpm typecheck` 그린 (lefthook race fix 재검증)
- [ ] depcruise violation 0건 유지
- [ ] **ADR-0011** (`docs/adr/0011-contracts-package-layout.md`) 작성 + 본 PR 포함
- [ ] **phase-02.md 갱신**: spec-02-05 정의 제거 + 결정 기록 추가 + Phase Done 조건 정리
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-02-04-shared-contracts` 브랜치 push
- [ ] PR 생성 + 사용자 알림
