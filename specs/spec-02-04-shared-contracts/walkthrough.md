# Walkthrough: spec-02-04

> Phase 2의 네 번째이자 *마지막* spec. **spec-02-05를 흡수**해서 `@repo/contracts` + `@repo/auth-contracts` 두 패키지를 단일 spec에 박음. ADR-0011로 컨벤션 박음. phase-02 완료 도달.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| spec 수 | (A) spec-02-04 + spec-02-05 분리 / (B) 단일 spec 통합 | **B** | 두 패키지 모두 *얇은 schema 정의* — 분리 ceremony > 결정 부담. spec-02-02처럼 *대형 결정*이 아니라 *어휘 적용* |
| 패키지 수 | (A) 두 패키지 분리 / (B) 단일 통합 | **A** | ADR-0003 §6 유지. auth 불확실성(ADR-0006 보류) 격리 + 호스팅 앱이 auth 부분만 교체 용이 |
| contracts 도메인 | `UserProfile` 1개 + helper | 채택 | boilerplate — 컨벤션 전달 충분. 사용자 fork 시 자체 확장 |
| sub-path export | `.` + `./user` + `./pagination` | 채택 | tree-shaking + 도메인 단위 import (`@repo/contracts/user`). root re-export도 유지 — 호출자 편의 |
| `paginatedResponse<T>` | named 함수 / generic helper | helper | spec-02-03 `Pagination`(요청)과 짝. cursor 기반 변형은 후속 |
| auth-contracts schema 수 | (A) 핵심 4개 / (B) 확장 (permission / refresh token 등) | **A** | ADR-0006 보류 — 확장은 ADR 확정 후 별 spec. 본 spec은 *최소 골격* |
| `Role` 값 | `["user", "admin"]` 2개 | 채택 | boilerplate 확장 여지. 호스팅 앱이 확장 (`["guest", "user", "editor", "admin"]` 등) |
| `JwtPayload.iat/exp` 타입 | `z.number().int()` | 채택 | UNIX timestamp 정수. 비정수 거부 (test 검증) |
| `@repo/utils` 의존 | runtime / dev / 없음 | **없음** | 본 spec은 *schema 정의만* — ok/err 런타임 미사용. spec-02-03 plan 정정 교훈 답습 |
| ADR 시점 | 본 PR / 별 PR | 본 PR | spec-02-05 흡수 결정 + 컨벤션이 한 추적 단위 |
| phase-02.md 정정 | T1에 포함 / 별 spec | **T1에 포함** | 흡수 결정의 *근거 기록*이 spec-02-04 자체에 있어야 정합 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **ADR-0011** `docs/adr/0011-contracts-package-layout.md` (6 결정 + 6 Alternatives 분석)
- [ ] 없음

## 💬 사용자 협의

- **주제 1**: spec-02-05 분리 유지 vs 통합 — 사용자가 *"남은 작업을 묶어서 한번에 처리"* 제안. **통합 채택** + 우려(PR 크기 / spec-02-05 ID 처리) 짚고 진행.
- **주제 2**: Plan Accept ("1") — 6-task 구성 그대로 진행.

> 본 spec은 *결정 부담*보다 *어휘 적용*이 위주. plan 단계에서 *spec-02-03 교훈 (`@repo/utils` 분류)*을 적용해서 본 spec은 utils 의존 없이 진행 — 실제로 schema 정의만이라 utils 불필요 확인.

## 🛡 lefthook race fix 재검증 (RCA-001)

RCA-001 fix 후 *2번째* spec. T6에서 reproducer로 재검증:

**시도**:
- `packages/shared/contracts/src/__rca_repro.ts`에 `export const broken: number = "not a number";` 추가
- `git commit -m "test: rca repro"` 시도

**결과**:
- biome ✅ (lint 통과)
- typecheck ❌ (`error TS2322: Type 'string' is not assignable to type 'number'`)
- → exit 2 → **lefthook이 정상 차단**
- main last commit `c0c99b6` 유지 (repro commit 안 만들어짐)
- reproducer 제거 후 정상 진행

**결론**: RCA-001 fix가 *2 spec 연속 race 재발 0건* + 정상 차단 invariant 안정. 본 RCA 즉시 close 유지.

## 🔍 발견 사항

### 1. spec-02-03 plan 정정 교훈이 본 spec 진행을 단축

spec-02-03에서 `@repo/utils` 분류 오류(devDep → runtime)를 *작업 중 발견*했던 경험으로, 본 spec plan 단계에서 *"utils 의존 없음"* 명시. 실제로 schema 정의만이라 ok/err 런타임 미사용 — *plan에서 미리 분류 검토*가 cycle time 단축에 기여.

### 2. sub-path export가 *호출자 편의* 와 *tree-shaking* 동시 만족

`@repo/contracts/user` (sub-path) + `@repo/contracts` (re-export root) 두 방식 모두 지원. 호출자가 *명시적 path*로 부르거나 *root에서 한 번에* import 가능. ADR-0011 §결정 2.

### 3. 두 패키지 단일 spec 박음의 운영 효과

- ceremony 절감: ship / push / PR / 머지 / post-merge-sync 절차가 *1회*로 통합
- PR 크기: 두 패키지 + ADR + phase-02.md 정정 = ~500 insertions — spec-02-02(273 LOC + 56 test) 대비 *코드는 작고 ADR/문서가 비중*. 리뷰 부담 크지 않음
- git blame 측면 약점: cross-cutting commit이지만 *패키지 디렉토리 분리*로 영향 작음 (블레임은 디렉토리 단위로 자연스러움)

### 4. ADR-0011이 향후 *분리 vs 통합 재결정*의 진입점 역할

ADR-0006 확정 시 auth-contracts schema가 *대폭 확장*되면 *다시 분리 spec*으로 가야 할 가능성 있음. 본 ADR이 *그 결정의 history record*. spec 단위 통합은 *영구 결정*이 아니라 *현재 시점의 균형점*임을 명시.

### 5. depcruise가 *26 modules / 33 deps*로 graph 커짐

phase-02 시작 시 17 modules / 17 deps → 본 spec 완료 시 26 / 33. 각 패키지의 *import edge*가 명확히 표현됨:
- `@repo/contracts` → `@repo/validation` → `@repo/errors` + `@repo/utils`
- `@repo/auth-contracts` → `@repo/validation` → 동일

phase-02 종료 시점에 *dependency graph가 안정적*임을 확인. Phase 3 backend / Phase 4 frontend가 *각 패키지에서 다양한 sub-set import* 시 사이클 없음 보장.

## 📚 산출물

- **신규 패키지 2개**:
  - `packages/shared/contracts/` — UserProfile 1 도메인 + `paginatedResponse<T>` helper (22 LOC impl + 72 LOC test)
  - `packages/shared/auth-contracts/` — Role / User / Session / JwtPayload 4 schema (27 LOC impl + 67 LOC test)
- **ADR**: `docs/adr/0011-contracts-package-layout.md` — 6 결정 + 6 Alternatives
- **phase-02.md 정정**: spec-02-05 정의 제거 + 흡수 결정 기록 + Phase Done 조건 정리
- **commit 흐름**:
  - `66592e4` chore(spec-02-04): absorb spec-02-05 into spec-02-04 (phase-02.md cleanup)
  - `b0e5d02` feat(spec-02-04): scaffold @repo/contracts with UserProfile schema
  - `f307f9b` feat(spec-02-04): add paginatedResponse helper
  - `1c1fc5e` feat(spec-02-04): add @repo/auth-contracts with core 4 schemas (Role/User/Session/JwtPayload)
  - `c0c99b6` docs(spec-02-04): add ADR-0011 contracts-package-layout
  - (예정) ship commit
- **test 누적**: 105 (utils 16 + errors 56 + validation 20 + contracts 6 + auth-contracts 7).
- **검증**: lint / typecheck / test / depcruise / lefthook race fix invariant 모두 그린.

## 🔗 후속

- **즉시**: `/hk-phase-ship` — phase-02 완료 절차 (성공 기준 검증 + 통합 테스트 + 사용자 go/no-go).
- **Phase 3 (backend) 진입 전제**:
  - ADR-0005 (backend framework + ORM) spike
  - ADR-0006 (auth strategy) 확정 → 본 spec의 auth-contracts schema 확장
  - 기타 backend layering convention 정의
- **Phase 4 (frontend)**:
  - `@repo/contracts` schema + `paginatedResponse` 패턴이 form/SDK validation의 *진입점*
  - axios interceptor가 `fromJSON(resp.data)` + `parse(schema, ...)` 결합
- **Icebox**:
  - `@repo/typescript-config/env-agnostic` 변형 추가 (DOM lib 패턴 4회째 — 격상 가치 더 커짐)
  - `cursorPaginatedResponse` 헬퍼 (커서 기반 페이지네이션 필요 시점에)
