# Walkthrough: spec-02-02

> Phase 2의 두 번째 spec. `@repo/errors` 신규 패키지 — `AppError` class + 8 표준 카탈로그 + 양방향 wire (toJSON/fromJSON) + TS unknown narrowing 어휘 + Result round-trip. ADR-0009로 디자인 박음.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| AppError 형태 | (A) class extends Error / (B) plain object / (C) union type | **A** | instanceof 호환 + stack trace + cause(ES2022) 자연 + try/catch 통합 |
| 코드 분류 | (A) flat code / (B) NestJS HttpException 계층 | **A** | subclass 폭증 회피. 도메인 확장은 코드 추가만으로 |
| Error code 표현 | enum / **string literal union** + 사용자 확장 | union | tree-shaking + 확장 친화 |
| 표준 코드 개수 | 3 (v1) → **8** (v2 격상) | 8 | 사용자 비판 후 벤치마킹 결과 반영. Stripe/GitHub API 표준 HTTP 4xx/5xx 핵심 |
| toJSON에서 cause | 포함 / **제외** | 제외 | BE→FE 노출 안전성 + 노이즈 회피 |
| 양방향 wire | toJSON만 / **toJSON + fromJSON + isAppErrorResponse** | 양방향 | FE SDK가 응답 body를 *AppError class*로 복원 — `axios.response.data → fromJSON → Result<T, AppError>` |
| `wrap(unknown→AppError)` | 없음 / **추가** | 추가 | try/catch 패턴에서 매우 자주 사용. 호출자는 *대부분 wrap만* 알면 됨 |
| TS narrow helpers | 없음 / **isError + errorMessage + errorCause** | 추가 | unknown narrowing boilerplate 표준화 (cross-realm 안전 isError 포함) |
| 라이브러리 specific 가드 | **본 spec 외** | Phase 4 SDK | shared/errors의 zod 외 dep 0 원칙. axios 의존 가드는 SDK가 wrap(e)로 변환 |
| 다중 에러 | 별 type / **`details.errors[]` 컨벤션** | 컨벤션만 | YAGNI. validation aggregation 빈번해지면 spec-02-03 |
| RFC 7807 (Problem Details) | 본 spec / **Phase 3 후보** | Phase 3 | type URI 관리 부담 + 본 spec은 데이터 모델만 |
| ADR 시점 | 본 PR / 별 PR | 본 PR | 결정과 구현이 한 추적 단위 |
| commit 단위 | TDD red-green 분리 / **함수군당 1 commit (test+impl)** | 합침 | ceremony 절감. red 단계 fail count는 task.md에 기록 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **ADR-0009** `docs/adr/0009-app-error-design.md` (7 결정 + 9 Alternatives 분석)
- [ ] 없음

## 💬 사용자 협의

- **주제 1**: scope 비판 ("이정도 기능밖에 없나?")
  - **합의**: v1 (minimal 3 codes) → **v2 (벤치마킹 후 8 codes + wrap + isCode)** → **v2.5 (fromJSON 추가)** → **v3 (TS narrow helpers + 라이브러리 specific 명확화)** 점진 격상.
- **주제 2**: 라이브러리 specific (axios) 가드 위치
  - **합의**: 본 spec 외 (환경 무관 원칙). Phase 4 SDK에서 `wrap(e)` 호출로 우리 AppError로 자동 변환.
- **주제 3**: TS unknown narrowing boilerplate
  - **합의**: `isError` / `errorMessage` / `errorCause` 본 spec 추가 — wrap의 building block + raw 에러 처리 시 사용.

## 🧪 검증 결과

### 자동 테스트

```bash
pnpm --filter @repo/errors test
```

- **결과**: ✅ **56 tests passed**
  - AppError 3 (생성 / 필드 / name)
  - STANDARD_ERROR_REGISTRY 2 (8 codes 존재 / HTTP 매핑)
  - toJSON 3 (cause 제외 / details 포함 / JSON.stringify round-trip)
  - isAppErrorResponse 3 (valid / 누락 / non-object)
  - isAppError 2 / isCode 3 / isError 4
  - errorMessage 5 (AppError / Error / string / object / null+undefined)
  - errorCause 3 (AppError / Error.cause / no cause)
  - standard factories 16 (8 × 2)
  - wrap 4 (pass-through / Error / string / object)
  - fromJSON 4 (valid / details 보존 / fallback / null+undefined)
  - Result<T, AppError> round-trip 4

### Lint + typecheck + depcruise

- `pnpm lint` ✅ Biome PASS
- `pnpm typecheck` ✅ tsc --noEmit PASS (FULL TURBO cache hit)
- `pnpm exec depcruise ... packages/` ✅ **no dependency violations** (13 modules, 10 dependencies)

### 모듈 사이즈

- `wc -l packages/shared/errors/src/index.ts` → **273줄** (예상 180~280 범위 안)
- runtime dep: 0 (zod 미사용)
- `@repo/utils`는 devDep (test에서만 사용 — production 의존 0)

## 🔍 발견 사항

1. **lefthook typecheck 동작이 *이번엔 정상*** — T8 commit에서 `Cannot find name 'setTimeout'` exit 2가 발생해 **lefthook이 commit을 차단**. spec-02-01 T2의 quirk(차단 안 됨)와 정반대 동작. **즉 quirk가 일관되지 않음** — 차단되는 케이스와 안 되는 케이스의 차이를 찾기 어려움. 다만 *이번 케이스에서는 안전망이 작동* — 좋은 신호. 임시 결론: **차단을 항상 보장한다고 신뢰할 수는 없음**. ship 직전 수동 typecheck 재확인 패턴 유지.
2. **shared/* DOM lib 패턴 재발** — `@repo/errors`도 `@repo/utils`를 import하면 utils의 setTimeout 타입이 errors의 컴파일 컨텍스트로 흘러들어옴. `errors/tsconfig.json`에도 DOM lib 추가 필요. 즉 *shared/*는 모두 DOM lib 필요* 패턴 확정. `@repo/typescript-config`에 `env-agnostic` 변형 추가 후보 **승격 가치 ↑** (Icebox).
3. **Biome `useLiteralKeys` info-level warning 반복** — `obj["code"]` vs `obj.code`. unsafe fix라 자동 적용 안 됨. info level이라 commit 통과. 향후 패턴 결정 (의도적 bracket access인지) 후 일관 적용 검토.
4. **`@repo/utils` import가 cross-package typecheck 비용**: `@repo/errors` typecheck가 utils source 파일을 함께 컴파일. JIT 패키지의 한계. tsc 시간 약간 증가하지만 캐시 hit 시 무시 가능.
5. **wrap의 cause 보존이 wire 호환성에 의미 큼** — `wrap(e)` → AppError(cause: e). toJSON은 cause 제외 → wire에는 안 나감. BE 로깅 측에서 원본 stack 추적 가능. 좋은 디자인.
6. **`describe("standard factories")` parametrized test 패턴** — 8 factory를 const cases array로 반복 — 코드 중복 회피. 향후 spec에서도 유사 패턴.

## 🚧 이월 항목

- **lefthook typecheck quirk** — 2회째 발견 (spec-02-01 + 본 spec). RCA-001 작성 후보 격상 (2회 트리거 도달). Icebox에 이미 박힘 — 본 ship 시 RCA 작성 권유 여부 결정.
- **shared/* DOM lib 패턴** — 2회째 적용 (utils + errors). `@repo/typescript-config`에 `env-agnostic` 변형 추가 spec 후보 (Phase 2 마무리 시점 또는 spec-02-X).
- **RFC 7807 `toProblemDetails` 변환** — Phase 3 backend HTTP middleware spec 후보.
- **zod → AppError 변환** (`fromZodError` 또는 `validationError(message, zodError.flatten())`) — spec-02-03 (shared-validation)에서 표준 패턴 결정.
- **다중 에러 type 격상** — `details.errors[]` 컨벤션 빈번 사용 시 별 type 도입 후보 (spec-02-03).
- **`packages/config/*`에 lint script 추가** — Icebox 이슈, phase-02 마무리 시 결정.

## 📖 디자인 맥락 — 4 패러다임 매핑

> dennis의 비판 ("Exception / Result / Functional Effect / Validation 중 우리는 어디인가") 후 작성.
> 본 디자인을 4 계열 frame에 매핑한 design note (matklad 스타일, ADR과 분리):
>
> 👉 [`docs/notes/error-handling-paradigms.md`](../../docs/notes/error-handling-paradigms.md)

핵심: **Result 계열을 흐름 제어 SoT + Exception 계열을 데이터 모델 + Validation 계열은 `details.errors[]` hook + Functional Effect 계열 비채택**. 각 계열을 완전 흡수한 디자인 대비 *trade-off cost*를 ADR-0009 결정과 함께 박음.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-17 ~ 2026-05-18 |
| **최종 commit** | (ship 시 갱신) |
| **테스트 수** | 56 |
| **소스 라인 수** | 273 (`index.ts`) |
| **scope 진화** | v1 (12 test) → v2 (25) → v2.5 (30) → **v3 (56)** |
