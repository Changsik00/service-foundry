---
id: ADR-0009
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0009: `AppError` 디자인 — class + flat code + 양방향 wire

## 📚 Context

> 본 ADR의 *맥락 보강* 노트: [`docs/notes/error-handling-paradigms.md`](../notes/error-handling-paradigms.md) — Exception / Result / Functional Effect / Validation 4 계열 vs 본 디자인의 매핑 + trade-off.

ADR-0008에서 `Result<T, E = Error>`를 박았다. 그러나 `E = Error`만으론 *도메인 컨텍스트(code / statusCode / details)*가 없어 HTTP 응답 / 사용자 메시지 / 로깅 / 클라이언트 분기가 모두 어렵다. 또한 FE는 BE 응답 body를 받아 *AppError class 인스턴스로 복원* 해야 `isAppError` / `isCode` 같은 가드를 일관되게 쓸 수 있다.

벤치마킹 결과(@hapi/boom / http-errors / NestJS HttpException / RFC 7807 / Stripe API / GitHub API / neverthrow / `@total-typescript/error` / zod-validation-error): 산업 표준은 `code + statusCode + 카탈로그 + 사용자 도메인 확장`. 우리는 *프레임워크 무관 데이터 모델*로 박는다.

## 🎯 Decision

`@repo/errors`에 `AppError` 계층을 다음 7 결정으로 박는다.

1. **`class AppError extends Error`** — plain object / union type 비채택. `instanceof Error` 호환 + `Error.cause` (ES2022) + stack trace 자연 / native `try/catch` 통합.

2. **Flat code (NestJS 계층 비채택)** — `class ValidationError extends AppError` 같은 subclass 만들지 않음. 도메인 코드는 `new AppError({ code: "ORDER_FROZEN", ... })`로 자유 확장. 코드 네이밍 컨벤션: **SCREAMING_SNAKE_CASE** (`USER_NOT_FOUND`) 또는 **도메인 prefix** (`ORDER.FROZEN`). enum 미채택 (tree-shaking + 확장 친화).

3. **`toJSON()`에 `cause` 제외** — BE→FE 직렬화 시 *내부 스택/근본 원인*은 노출 안 함 (보안 + 노이즈 회피). 로깅 측은 `e.cause` 직접 접근. 응답에 포함되는 필드: `code / message / statusCode / details?`.

4. **양방향 wire — `fromJSON` + `isAppErrorResponse`** — `toJSON`만으론 반쪽. FE SDK가 `axios.response.data`를 받아 `fromJSON(response.data)`로 *class 인스턴스 복원*. 무효 shape면 `wrap(json, "INTERNAL", "Invalid error response shape")`로 fallback (원본은 cause에 보존).

5. **표준 카탈로그 — 8개 코드 + REGISTRY 매핑** — `STANDARD_ERROR_REGISTRY` const record (HTTP 4xx/5xx 핵심: VALIDATION/UNAUTHENTICATED/FORBIDDEN/NOT_FOUND/CONFLICT/RATE_LIMIT/INTERNAL/BAD_GATEWAY) + 8 factory. 사용자 도메인은 자유 확장.

6. **다중 에러: `details.errors[]` 컨벤션 (별 type 미생성)** — validation aggregation은 `details: { errors: Array<{ path: string; message: string }> }` 형태. 별 `MultiError` type 만들지 않음. 빈번해지면 spec-02-03에서 도입.

7. **라이브러리 specific 가드(axios / fetch)는 본 패키지 외 (Phase 4 SDK 영역)** — `@repo/errors`는 *환경 무관*이라야 (zod 외 의존성 0, Node-only API 금지). axios 가드는 axios 의존하는 패키지(`@repo/frontend/sdk`)에서. SDK는 catch한 axios 에러를 `wrap(e)` 호출 = AppError로 자동 변환.

또한 **TS unknown narrowing 어휘 3 helper**: `isError` (cross-realm 안전) / `errorMessage` (어떤 unknown에서든 message 추출) / `errorCause` (ES2022 cause 추출). 호출자는 *대부분 `wrap(e)`만* 알면 됨. 본 3 helper는 wrap의 building block + raw 에러 처리 시 사용.

## 📊 Consequences

- **긍정**:
  - BE/FE 동일 어휘 사용. 응답 body가 곧 우리 schema.
  - tree-shaking 친화 (function helper + flat code).
  - 코드 추가만으로 도메인 확장 (subclass 폭증 없음).
  - `wrap(e)` 한 함수로 unknown → AppError 변환 일원화 → catch 처리 boilerplate 제거.
  - `isCode<C>` 제네릭 가드로 code별 정확한 narrow.

- **부정**:
  - 코드 카탈로그 중앙 관리 부담 (사용자 도메인 코드가 늘면 documentation 필요).
  - `class AppError`라 *항상 번들에 포함* (tree-shaking 안 됨). 다만 errors 패키지는 거의 모든 곳에서 사용 — 영향 작음.
  - `Error.captureStackTrace`는 V8 only — Bun / 다른 엔진은 native stack 사용 (polyfill 없음, best-effort).

## 🔀 Alternatives

- **`@hapi/boom`** (`Boom.notFound()` factory + `output.payload/headers`): HTTP 매핑 자동 + headers(WWW-Authenticate) 분리 — 좋으나 *HTTP framework에 종속*. shared/* 의 환경 무관 원칙 위반. Boom의 `output.headers`는 우리에선 Phase 3 backend middleware에서 *별도 처리* (예: `case "UNAUTHENTICATED": res.setHeader("WWW-Authenticate", ...)`).
- **`http-errors` (`createError(404, ...)`)**: 가장 단순. 그러나 *code optional* + `expose` flag가 응답 변환 레이어 결정 — 우리는 변환 레이어 책임 분리 원칙으로 `expose` 미채택.
- **NestJS HttpException 계층**: `BadRequestException` / `NotFoundException` subclass. 가독성 좋으나 *subclass 폭증* (Stripe-style 도메인 코드는 수십~수백 개). flat code 채택.
- **RFC 7807 Problem Details** (`{ type, title, status, detail, instance, ...extensions }`): IETF 산업 표준. `type` URI 카탈로그 + extension fields 자유. 채택 가치 큼 — 그러나 (a) type URI 관리 부담, (b) 본 spec은 *데이터 모델*만, (c) HTTP 응답 변환은 Phase 3 backend HTTP middleware의 책임. **Phase 3에서 별 spec 후보** (`toProblemDetails(instance?)` 추가). 본 spec에서는 비채택.
- **Stripe / GitHub API 스타일** (`{ type, code, message, param?, doc_url? }`): 카탈로그 + documentation URL. `doc_url` 채택 안 함 (YAGNI). `param` (validation 잘못된 필드)은 `details.errors[]` 컨벤션으로 대체.
- **`neverthrow`** (Rust-style Result fluent chain): 모델 유사 (ADR-0008 함수형 Result와 같은 사상). class chaining은 `unwrap` 유발 위험 → 함수 helper로.
- **`@total-typescript/error`** (제네릭 `AppError<TCode>`): `isCode<C>` 제네릭 가드로 동일 효과. type 노이즈 줄이기 위해 class 자체는 제네릭 안 둠.
- **`fp-ts/Either`**: Haskell 컨벤션. JS/TS 생태계에서 *덜 익숙* + fp-ts 의존. zod 외 의존 0 원칙 위반.
- **`zod-validation-error`** (`fromZodError`): zod 변환은 spec-02-03 (zod 의존) 또는 zod 사용 spec에서 채택 후보. 본 spec은 `wrap` + `details.errors[]` 컨벤션만.

## 📌 Status

Accepted (2026-05-18, spec-02-02 머지 시점). 첫 사용자: `@repo/errors` 자체 + `@repo/utils` Result. 후속 의존: `@repo/shared/validation` (zod 변환) / `@repo/shared/contracts` / `@repo/backend/auth` / `@repo/frontend/sdk` (axios interceptor + `fromJSON`).

## 🔗 Related

- spec: `specs/spec-02-02-shared-errors/spec.md`
- 코드: `packages/shared/errors/src/index.ts` (AppError + 8 factory + 양방향 wire + 3 narrow helper + wrap)
- 선행 ADR: 0008 (Result type)
- 디자인 맥락 노트: [`docs/notes/error-handling-paradigms.md`](../notes/error-handling-paradigms.md) — 4 패러다임 매핑
- 후속 spec: spec-02-03 (zod 변환), Phase 3 backend HTTP middleware (RFC 7807 toProblemDetails 후보), Phase 4 frontend/sdk (axios interceptor)
