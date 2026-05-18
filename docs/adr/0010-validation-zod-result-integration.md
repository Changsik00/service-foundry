---
id: ADR-0010
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0010: zod ↔ Result 통합 + 공통 schema + `parse` / `fromZodError` 컨벤션

## 📚 Context

ADR-0008에서 `Result<T, E = Error>` (@repo/utils), ADR-0009에서 `AppError + details.errors[]` 컨벤션 (@repo/errors)을 박았다. ADR-0009 §Related에는 *"후속 spec(spec-02-03)에서 zod 변환 패턴 정의"* 명시.

본 spec(spec-02-03)이 catalog `zod ^4.4.3`의 *첫 사용자*. 다음 3 문제가 해결되어야 한다:

1. **`safeParse` ↔ Result 변환 boilerplate** — 호출자가 매번 `result.success ? ok(...) : err(validationError(...))` 작성.
2. **`ZodError → AppError` 변환 컨벤션 부재** — ADR-0009 `details.errors[]` 컨벤션이 *문서로만* 있고 코드 변환 없음.
3. **공통 schema 분산 위험** — UUID / Email / Pagination이 각 도메인 패키지에서 자체 정의되면 검증 룰 drift.

벤치마킹: zod-validation-error / valibot / yup / superstruct / io-ts를 검토. zod-validation-error는 `ZodError → string` 변환만 제공 (우리는 `AppError` 변환 필요). 다른 lib는 zod 대체재로서 catalog 결정(ADR-0002)을 뒤집어야 함 — out of scope.

zod v4 API 정찰 결과: `z.uuid()` standalone이 v4-native (전용 타입 `ZodUUID`), `z.string().uuid()` chain은 v4에서 *여전히 동작*하지만 `ZodString` 반환. v3와 issue shape 다름 (`code: "invalid_format"`, `format: "uuid"`).

## 🎯 Decision

`@repo/validation` 신규 패키지에 다음 7 결정을 박는다.

1. **`parse<T>(schema, data, message?): Result<T, AppError>`** — `safeParse`를 우리 Result 어휘로 일관 변환. 모든 후속 spec의 *공통 validation 진입점*. 호출자가 `result.success` 분기 작성 안 함.

2. **`fromZodError(error: ZodError, message?: string): AppError` 컨벤션** — `error.issues` 배열 → `details.errors: Array<{ path: string; message: string }>` 매핑. path는 `(string|number)[]`를 `.` join (`user.email`, `items.0.name`). ADR-0009의 `details.errors[]` 컨벤션 *코드 구체화*.

3. **공통 schema 3종 (`Uuid` / `Email` / `Pagination`)** — 도메인 공유. 추가(`Url` / `PhoneNumber` / `Iso8601Date` 등)는 *도메인 spec에서 필요 시*. YAGNI 원칙.

4. **Flat code 유지 (ADR-0009 일관)** — `parse` / `fromZodError` 실패 시 `code: "VALIDATION"` 단일. `class ValidationError extends AppError` 같은 subclass 미생성. `details.errors[]`로 *구조적* 표현.

5. **`Pagination` 기본값: `page=1` / `perPage=20` / `perPage max=100`** — offset 기반. REST API 산업 표준. cursor 기반 변형은 후속 spec(contracts) 또는 phase-03/04에서.

6. **`parseAsync<T>` 미제공** — 본 spec은 sync `parse`만. async refinement는 phase-03 backend에서 필요 시 추가.

7. **`zod-validation-error` 라이브러리 미채택** — 우리 `fromZodError`가 *우리 `AppError` 어휘로 직접* 변환. 추가 의존성 회피.

**zod v4 API 채택: standalone (`z.uuid()`, `z.email()`)** — v4-native, 전용 타입 (`ZodUUID` / `ZodEmail`) 반환. chain은 legacy 호환용으로만 사용.

**기본 message는 zod 원문 보존** — `fromZodError`의 `message?` 인자는 *AppError.message* (사용자 도메인 메시지)만 override. `details.errors[].message`에는 zod 기본 message 그대로 (i18n 변환 안 함). 이유: 디버깅 가능성 우선, i18n은 FE 레이어 책임.

## ✅ Consequences

### 긍정

- **boilerplate 해소**: 모든 spec/route handler/form이 `parse(schema, data)` 한 줄로 검증. `safeParse` 분기 작성 불요.
- **ADR-0009 컨벤션 실현**: 문서로만 있던 `details.errors[]`가 *코드로 박힘*.
- **단일 SoT**: Uuid / Email 검증 룰이 한 곳 (drift 방지).
- **type-safe pagination**: `PaginationInput` (Partial — 사용자 입력) / `PaginationOutput` (전체 — 기본값 적용 후) 구분.
- **zod 4.x 검증 완료**: 다음 spec/phase가 동일 API 안심 사용.

### 부정 / Trade-off

- **shared/validation 의존 추가** — 모든 도메인 패키지가 `@repo/validation` import. 단, deps depth는 `validation → errors + utils`만이라 영향 작음.
- **`parse`가 `Result` 강제** — exception 어휘를 선호하는 호출자는 직접 `schema.safeParse` 사용 (lib 강제 아님).
- **`parseAsync` 미제공** — async refine 필요 시 *호출자가 직접 `parseAsync`* 또는 phase-03에서 별도 spec.
- **zod 의존 강결합** — schema 라이브러리 교체 시 `parse` / `fromZodError` 시그니처 변경. valibot 등 후보 검토 시 *대규모 ripple*. ADR-0002의 zod catalog 결정 신뢰 전제.

## 🔄 Alternatives

| 대안 | 비채택 이유 |
|---|---|
| `zod-validation-error` | `ZodError → string` 변환만 제공. 우리는 `AppError` 변환 필요. 동등한 작업을 `fromZodError`로 자체 구현이 *간결 + 의존성 0*. |
| `valibot` | zod 대체재. catalog(ADR-0002)에서 zod 결정. 본 spec scope 밖. 다만 tree-shaking 강점은 *후속 frontend bundle 분석* 결과에 따라 재평가 가능. |
| `yup` | zod와 동등 카테고리. TS 추론은 zod가 우위 — 이미 catalog 결정. |
| `superstruct` | 가벼우나 자체 schema 어휘 (`Struct`). zod 생태계(`z.input` / `z.output` / OpenAPI 변환)의 *모노레포 가치* 손실. |
| `io-ts` | fp-ts 강결합. *함수형 effect 패러다임* 채택 안 했으므로 부적합 (ADR-0008 §Alternatives의 `neverthrow` 비채택 사유와 일관). |
| `zod`만 사용 (`parse` wrapper 안 만들기) | 각 호출자가 `safeParse` 분기 + `validationError` 호출 boilerplate 반복. ADR-0009 `details.errors[]` 컨벤션이 *실제 적용 안 될 위험*. |

## 🔗 Related

- **선행**:
  - [ADR-0002](./0002-monorepo-foundations.md) — `zod ^4.4.3` catalog 결정.
  - [ADR-0008](./0008-result-type.md) — `Result<T, E>` (`parse` 반환 타입).
  - [ADR-0009](./0009-app-error-design.md) — `AppError + details.errors[]` 컨벤션 (본 ADR의 *코드 구체화* 대상).
- **후속**:
  - spec-02-04 (contracts): 도메인 schema가 `parse` 사용.
  - spec-02-05 (auth-contracts): 동일.
  - phase-03 (backend): route handler validation에 `parse` 적용.
  - phase-04 (frontend): form validation + axios interceptor에 `parse` + `isAppErrorResponse` (ADR-0009) 결합.
- **코드**: [`packages/shared/validation/src/index.ts`](../../packages/shared/validation/src/index.ts).
