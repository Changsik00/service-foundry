# 에러 핸들링 4 패러다임 vs 본 보일러플레이트의 디자인

> Phase 2 spec-02-02 (`@repo/errors`) + ADR-0008 (Result) + ADR-0009 (AppError) 결정의 *맥락 보강*.
> 우리가 *어떤 계열을 어떻게 흡수/거부했는지*, *trade-off cost*를 명시.

## 1. 4 패러다임 개요

| 계열 | 실패를 보는 관점 | 대표 |
|---|---|---|
| **Exception** | 실패는 *예외 상황* | JS `throw`/`try-catch`, Java checked exceptions |
| **Result** | 실패는 *정상 흐름* | Rust `Result<T, E>`, neverthrow, Go `(value, err)` |
| **Functional Effect** | 실패는 *계산의 일부* | Effect-TS, fp-ts (`Either`/`Task`), ZIO |
| **Validation** | 실패는 *데이터 문제* | zod, io-ts, runtypes, yup |

## 2. 본 보일러플레이트의 위치 — 하이브리드

### 한 줄 요약

> **Result 계열을 흐름 제어 SoT로 박고, Exception 계열을 데이터 모델로 흡수, Validation 계열은 `details.errors[]` 컨벤션으로 hook, Functional Effect 계열은 비채택.**

### 계열별 채택 정도

| 계열 | 채택 정도 | 어떻게 |
|---|:---:|---|
| Exception | **데이터 모델만** | `class AppError extends Error` — `instanceof` 호환 + stack + ES2022 `cause`. 흐름 제어로는 안 씀 — 외부 boundary에서 `wrap` → Result로 변환 |
| Result | **흐름 제어 SoT** ✅ | ADR-0008 `Result<T, E>` + 본 spec `Result<T, AppError>`. *함수 경계 반환 타입*은 항상 Result |
| Functional Effect | **비채택** ❌ | Effect-TS / fp-ts / ZIO 미사용. 의존성 폭증 + 학습 곡선 + zod 외 dep 0 원칙 |
| Validation | **hook만** | `details: { errors: [{ path, message }] }` 컨벤션으로 zod 결과 흡수 (spec-02-03에서 본격 정의) |

### 흐름 다이어그램

```
┌──────────────────────────────────────────────────────────┐
│ 외부 boundary (axios / fetch / 3rd-party lib / db)       │
│   throw Exception (axios.AxiosError / Error / unknown)   │
└──────────────────────────────────────────────────────────┘
              │  try { ... } catch (e) { wrap(e) }
              ▼
┌──────────────────────────────────────────────────────────┐
│ Exception 데이터 모델 (AppError extends Error)            │
│   - code / statusCode / details / cause                  │
│   - 표준 카탈로그 8 + 사용자 도메인 확장                   │
└──────────────────────────────────────────────────────────┘
              │  err(wrap(e)) 또는 err(notFoundError("..."))
              ▼
┌──────────────────────────────────────────────────────────┐
│ Result<T, AppError> (흐름 제어 SoT)                      │
│   - ok / err / isOk / isErr / map / flatMap              │
│   - 함수 반환 타입 = 항상 Result                          │
└──────────────────────────────────────────────────────────┘
              │  Validation 결과 흡수
              ▼
       details.errors[]  ◀── zod.safeParse() 결과
              │                → validationError(msg, zodError.flatten())
              │                   (spec-02-03에서 본격 정의)
              ▼
┌──────────────────────────────────────────────────────────┐
│ Wire format (toJSON / fromJSON)                          │
│   BE: e.toJSON() → HTTP body                             │
│   FE: fromJSON(response.data) → AppError class           │
└──────────────────────────────────────────────────────────┘
```

## 3. 의식적 선택 — 각 결정이 어느 계열에 속하는가

| 결정 (ADR-0008 + ADR-0009) | 채택 계열 | 거부 계열 | 가시화 |
|---|---|---|---|
| `class extends Error` + `instanceof` 호환 | Exception | (순수) Result | catch 사이트에서 기존 throw 코드와 호환 |
| 반환 타입 = `Result<T, AppError>` | Result | Exception (흐름 제어) | 호출자가 분기 강제 — catch 누락 사고 0 |
| `wrap(unknown)` boundary adapter | Result | Functional Effect | 외부 lib(axios) → Result 변환 어휘 |
| `map / flatMap` 함수형 helper | Result | Effect-TS class chain | tree-shaking + 학습 부담 회피 |
| `details.errors[]` 컨벤션 | Validation (hook) | Validation (full integration) | spec-02-03에서 zod 변환 표준화. 별 type 미생성 |
| `unwrap` 미제공 | Result (안전 모드) | Result (편의 모드) | throw 회피, 명시적 분기 강제 |
| `toJSON()` cause 제외 | Exception → Wire | (full transparency) | BE→FE 노출 시 내부 정보 leak 회피 |
| `fromJSON()` (양방향 wire) | Exception ↔ Wire | wire 단방향 | FE SDK가 axios response → AppError class 복원 |
| `isError` / `errorMessage` / `errorCause` | Exception (narrowing) | Exception (raw) | TS unknown narrowing boilerplate 표준화 |
| Effect-TS / fp-ts 미사용 | Result | Functional Effect | 의존성 폭증 + DI 자연성 약함 |

## 4. 약점 — 각 계열을 완전 흡수한 디자인 대비 trade-off

### vs 순수 Result 계열 (Rust / Either interface)

- **약점**: `class extends Error`라 *항상 번들에 포함* (tree-shaking 안 됨). 순수 함수형(`Either` interface) 또는 plain object union이면 더 가벼움.
- **선택 이유**: instanceof 호환 + 기존 catch 코드 통합 가치가 큼. JS 생태계의 표준 throw 패턴과 친화.

### vs Functional Effect 계열 (Effect-TS / fp-ts)

- **약점 1**: 대규모 비동기 컴포지션에서 Effect의 `Effect.gen` / fiber / 명시적 DI 같은 어휘가 더 풍부. 우리는 `Promise<Result<T, AppError>>` + flatMap 중첩 — *수동 chaining*. 깊어지면 가독성 떨어짐.
- **약점 2**: Effect 계열은 *에러 type을 union으로 보존* (`Effect<R, E1 | E2 | E3, A>`). 우리는 `Result<T, AppError>` 단일화 — 정밀한 type-level 추적 일부 손실.
- **선택 이유**: 본 프로젝트 규모 + 학습 곡선 + zod 외 dep 0 원칙. Phase 3 backend 진입 시 *Effect-TS 도입 평가* 가능 (Icebox 후보).

### vs Validation 계열 (zod 완전 통합 / yup / superstruct)

- **약점**: yup / superstruct 같은 라이브러리는 `error` 객체가 곧 검증 결과 — *덜 명시적 변환*. 우리는 `validationError(msg, zodError.flatten())`로 *명시적 변환* 필요 → boilerplate 약간.
- **선택 이유**: `AppError`를 *단일 SoT*로 두어 *어떤 source*(validation / DB / network / business logic)의 에러든 동일 어휘로 처리. 일관성 우선.

### vs Exception 계열 (throw 일변도)

- **약점**: catch 사이트마다 `try { ... } catch (e) { return err(wrap(e)) }` boilerplate. throw 일변도면 *catch 안 함*도 자유.
- **선택 이유**: catch 누락 사고가 *production 사고의 흔한 원인*. Result의 분기 강제가 가치 큼. `tryAsync(fn): Promise<Result<T, AppError>>` helper 추가 가능 (현재 YAGNI).

## 5. 향후 평가 후보

- **Effect-TS 도입 평가** — Phase 3 backend 진입 시. *대규모 비동기 컴포지션 가독성*이 임계 도달하면 평가.
- **`tryAsync(fn)` Promise wrapper** — catch boilerplate 누적 시 추가 후보.
- **`fromZodError(zodError)` 변환 helper** — spec-02-03 (shared-validation)에서 표준 결정.
- **RFC 7807 `toProblemDetails(instance?)` 변환** — Phase 3 backend HTTP middleware에서 별 spec.
- **`isAxiosError` / `isFetchError` 같은 라이브러리 specific 가드** — Phase 4 `@repo/frontend/sdk` 영역.

## 6. 관련 자료

- [ADR-0008](../adr/0008-result-type.md) — `Result<T, E>` discriminated union + 함수 helper
- [ADR-0009](../adr/0009-app-error-design.md) — `AppError` class + 8 카탈로그 + 양방향 wire
- [`packages/shared/errors/src/index.ts`](../../packages/shared/errors/src/index.ts) — 본 구현
- spec-02-02 walkthrough: `specs/spec-02-02-shared-errors/walkthrough.md`

## 7. 메타

| 항목 | 값 |
|---|---|
| **작성** | 2026-05-18 |
| **계기** | dennis의 비판 — "Exception / Result / Functional Effect / Validation 4 계열 중 우리는 어디인가" |
| **위치** | 본 보일러플레이트의 *디자인 맥락 보강* (matklad 스타일 design note, ADR과 분리) |
