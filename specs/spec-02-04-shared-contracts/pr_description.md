# feat(spec-02-04): @repo/contracts + @repo/auth-contracts — 도메인 schema 진입점 (spec-02-05 흡수) + ADR-0011

## 📋 Summary

### 배경 및 목적

Phase 2 "shared primitives"의 *네 번째이자 마지막* spec. 본래 spec-02-04(contracts) + spec-02-05(auth-contracts)로 분리 계획했으나 **단일 spec에 두 패키지 모두 박음** — 두 패키지 모두 *얇은 schema 정의* 위주라 분리 ceremony가 결정 부담보다 큰 역전. ADR-0003 §6의 *패키지 분리*는 유지 (spec/PR 단위만 합침). phase-02 완료 도달.

### 주요 변경 사항

- [x] **`@repo/contracts` 신규 패키지** (22 LOC impl + 6 test)
  - `UserProfile` schema (id: Uuid / email: Email / displayName / createdAt)
  - `paginatedResponse<T>(itemSchema)` generic helper — spec-02-03 `Pagination`(요청)과 짝
  - sub-path export: `.` + `./user` + `./pagination` (tree-shaking + 도메인 단위 import + root re-export)
- [x] **`@repo/auth-contracts` 신규 패키지** (27 LOC impl + 7 test)
  - **핵심 4 schema** (`Role` / `User` / `Session` / `JwtPayload`) — ADR-0006 보류 상태 고려한 최소 골격
  - `Role = z.enum(["user", "admin"])` — boilerplate 확장 여지
  - `JwtPayload.iat/exp = z.number().int()` — UNIX timestamp 정수 강제
- [x] **ADR-0011** (`docs/adr/0011-contracts-package-layout.md`, type: convention)
  - 6 결정: 분리 유지 / sub-path export / paginatedResponse / 핵심 schema 우선 / 호스팅 앱 자체 확장 가이드 / spec-02-05 흡수 기록
  - 6 alternatives: 단일 통합 / OpenAPI codegen / valibot / Prisma→zod / 단일 root export / 별도 repo 분리
- [x] **phase-02.md 정정**: §spec-02-05 정의 *제거* + 결정 기록 추가 + 통합 테스트 시나리오 정리 + Phase Done 조건 spec-02-01 ~ spec-02-04로 정리

### Phase 컨텍스트

- **Phase**: `phase-02` — Shared Primitives (4 spec 중 4번째 = **완료 도달**)
- **본 SPEC의 역할**:
  - phase-02의 *마지막 어휘 적용* — Result/AppError/parse/공통 schema(spec-02-01~03)를 *도메인 schema*로 박는 단계
  - Phase 3 backend의 route handler validation 진입점 (`parse(UserProfile, body)`)
  - Phase 4 frontend의 form/SDK validation 진입점 (`parse(UserProfile, fromJSON(resp.data))`)
- 본 PR 머지 후 `/hk-phase-ship` → Phase 3 진입 준비

## 🎯 Key Review Points

1. **spec-02-05 흡수 결정 (사용자 명시 제안)**: 사용자 *"남은 작업을 묶어서 한번에 처리"* 후 통합 채택. **패키지 분리(ADR-0003 §6)는 유지**, spec/PR 단위만 합침. ADR-0011 §결정 6에 cross-ref 기록. 향후 *분리 vs 통합 재결정*의 진입점 역할.
2. **ADR-0006 보류 상태 영향 격리**: auth-contracts schema는 *최소 골격 4개*만. 본격 schema 확장(permission / refresh token / OAuth provider 등)은 ADR-0006 확정 후 별 spec. walkthrough §발견 사항 #4에 *재분리 가능성* 명시.
3. **sub-path export 컨벤션**: `@repo/contracts/user` (도메인 단위) + `@repo/contracts` (root re-export) 두 방식 동시 지원. tree-shaking + 호출자 편의 균형. ADR-0011 §결정 2.
4. **`paginatedResponse<T>` generic helper**: spec-02-03 `Pagination`(요청)과 짝. cursor 기반 변형은 후속 spec(`cursorPaginatedResponse`)에서 — Icebox 후보.
5. **호스팅 앱의 자체 schema 확장 가이드** (ADR-0011 §결정 5): 본 boilerplate는 *예시 1개*(UserProfile)만. 사용자가 fork 후 자체 도메인(`Order` / `Product` / `Notification` 등) 추가 또는 별도 패키지(`@yourapp/contracts`)로 분리. 컨벤션(sub-path export + paginatedResponse 패턴) 일관성 가이드 박힘.
6. **`@repo/utils` 의존 없음 (spec-02-03 교훈 적용)**: spec-02-03에서 plan 정정(devDep → runtime)한 경험으로, 본 spec plan 단계에서 *utils 의존 없음* 명시 검토. 실제로 schema 정의만이라 ok/err 런타임 미사용 — cycle time 단축.
7. **lefthook race fix 재검증 (RCA-001)** ✅: RCA-001 fix 후 *2번째* spec. T6에서 reproducer로 재검증 → 정상 차단 확인. 2 spec 연속 *race 재발 0건*.
8. **depcruise graph 안정**: phase-02 시작 17 modules → 종료 26 modules / 33 deps. 모든 패키지가 *명확한 import edge*를 가지고 *사이클 없음*. Phase 3/4 진입 시 *graph 신뢰성* 확보.
9. **LOC 작음 + ADR 비중**: contracts 22 + auth-contracts 27 = **49 LOC impl** + 139 LOC test + 0011 ADR ~180줄. spec-02-03 패턴 답습 — *대형 결정의 작은 코드*.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS (5 패키지 / 0 issues)
- ✅ `pnpm typecheck`: FULL TURBO cache hit (5 패키지)
- ✅ `pnpm test`: **105 test PASS** (utils 16 + errors 56 + validation 20 + contracts 6 + auth-contracts 7)
- ✅ `depcruise`: 0 violations (26 modules / 33 deps)

### 수동 검증

1. **sub-path export 동작** ✅:
   ```ts
   import { UserProfile } from "@repo/contracts/user";   // sub-path
   import { UserProfile } from "@repo/contracts";        // root re-export
   import { paginatedResponse } from "@repo/contracts/pagination";
   ```
2. **parse 통합 (spec-02-03)** ✅:
   ```ts
   import { parse } from "@repo/validation";
   import { UserProfile } from "@repo/contracts";
   const r = parse(UserProfile, raw);  // Result<UserProfile, AppError>
   ```
3. **paginatedResponse round-trip** ✅: test에서 item schema 위반 / 음수 total 거부 검증.
4. **lefthook race fix invariant** ✅: T6 reproducer로 typecheck FAIL → commit 정상 차단 (main last commit `c0c99b6` 유지).

## 📐 Architecture / Decision

- [x] **ADR 작성** → ADR-0011 (`docs/adr/0011-contracts-package-layout.md`)
- [x] **walkthrough.md** — 결정 기록 (11건) + spec-02-05 흡수 효과 + lefthook race 재검증 + 발견 사항 5건
- [x] **pr_description.md** — 본 문서

## 🚫 Out of Scope (의도적 deferral)

- **권한/permission schema** — ADR-0006 확정 후.
- **refresh token / OAuth provider schema** — ADR-0006 확정 후.
- **도메인별 endpoint schema** (`POST /users` request/response 등) — 본 spec은 *도메인 타입*만. endpoint contract는 Phase 3 backend.
- **추가 도메인** (Order, Product, Notification) — boilerplate 컨벤션 전달에 1개로 충분. 사용자 fork 후 자체 추가.
- **`cursorPaginatedResponse`** — 후속 spec. Icebox.
- **OpenAPI 변환** — Phase 4 SDK.
- **`@repo/typescript-config/env-agnostic` 변형 추가** — DOM lib 패턴 4회째 격상 후보지만 별 spec-x. Icebox.

## 🔗 Related

- **선행**:
  - ADR-0003 §6 (auth-contracts 분리 결정 — 본 PR이 *재확인 + 강화*)
  - ADR-0006 (auth strategy — 보류 상태, 본 PR의 auth-contracts에 직접 영향)
  - ADR-0008 (`Result<T, E>`) — consumers
  - ADR-0009 (`AppError`) — consumers
  - ADR-0010 (`parse` / `fromZodError` / 공통 schema) — 본 PR의 *기반 어휘*
  - RCA-001 (lefthook race fix) — 본 spec이 *2번째 재검증*
- **후속**:
  - `/hk-phase-ship` — phase-02 완료 절차
  - Phase 3 backend: route handler + auth implementation
  - Phase 4 frontend: form/SDK + axios interceptor
  - ADR-0006 확정 후 auth-contracts schema 확장 spec
- **코드**:
  - [`packages/shared/contracts/`](../../packages/shared/contracts/)
  - [`packages/shared/auth-contracts/`](../../packages/shared/auth-contracts/)
  - [`docs/adr/0011-contracts-package-layout.md`](../../docs/adr/0011-contracts-package-layout.md)
- **결정 기록**: `backlog/phase-02.md` §결정 기록 — spec-02-05 흡수 명시
