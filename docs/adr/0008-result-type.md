---
id: ADR-0008
type: convention
date: 2026-05-17
status: accepted
---

# ADR-0008: Result 타입 — discriminated union + 함수 helper

## 📚 Context

`packages/shared/*`는 FE/BE 양측에서 import되며, 외부 호출 / 검증 / 비즈니스 로직 등 *실패 가능한 작업* 의 결과를 다룬다. 자바스크립트 표준 패턴은 `throw + try/catch` 일변도지만, 다음 문제가 있다:

- 호출자가 *어떤 에러가 throw될 수 있는지* 타입 시스템에서 알 수 없다.
- async chain에서 throw가 *전파*되며 컨텍스트 손실 위험.
- error path의 *명시적 분기*가 코드 리뷰 시 시각적으로 드러나지 않는다.

`packages/shared/utils`가 phase-02의 첫 패키지로 들어가며, 본 패키지의 결정이 phase-02 후속(shared-errors / shared-validation / shared-contracts) + phase-03 backend / phase-04 frontend에 모두 전파된다. 따라서 *공통 어휘*를 ADR로 박는다.

## 🎯 Decision

`@repo/utils`의 `Result<T, E = Error>`를 **discriminated union + 함수형 helper**로 정의한다.

```ts
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never>;
export const err = <E>(error: E): Result<never, E>;
export const isOk, isErr, map, flatMap;  // 6 helpers
```

- **discriminator**: `ok: true | false` (TypeScript의 narrowing 친화)
- **method chaining 금지**: class 미사용. `result.map(fn).unwrap()` 패턴 금지. 함수 helper만.
- **`unwrap` 미제공**: throw 유발 함수는 helper에서 제외. 호출자는 `isOk(r) ? r.value : default` 패턴으로 명시적 분기.
- **기본 에러 타입**: `E = Error` (zero-config). 도메인별 보강은 후속 spec(`shared-errors`의 `AppError`)에서 narrow.

본 spec(`spec-02-01`)에서 `@repo/utils/src/index.ts`에 구현 + 단위 테스트 8건 PASS.

## 📊 Consequences

- **긍정**:
  - 호출자가 *성공/실패 분기*를 타입 레벨에서 강제 인지. catch 누락 사고 방지.
  - tree-shaking 친화 (class 메서드 부재 → 사용 안 한 helper는 번들에서 제거).
  - zod / shared/* 의 zero-dep 원칙 유지 (Result는 zod 외 의존성 없음).
  - 함수형 컴포지션이 자연: `map(flatMap(r, validate), serialize)`.

- **부정**:
  - method chaining 의 *읽기 편한 흐름* (`r.map(fn).map(fn2)`)을 잃음. 함수 helper는 *중첩 호출*이 필요.
  - Rust / Scala 백그라운드 개발자에게 *덜 자연스러움*. 학습 곡선 약간.
  - `unwrap` 부재로 *간단 케이스에서도 분기 강제*. 예: `const value = isOk(r) ? r.value : 0;`.

- **중립**:
  - `Result<T, E>`는 type-only export — 런타임 비용 0.

## 🔀 Alternatives

- **Class with method chaining (`result.map(fn).unwrap()`)**: 가독성 우수, 그러나 (1) 클래스 인스턴스 = 번들 사이즈 증가, (2) `unwrap()` throw 유발, (3) Rust-style 패턴이 JS 표준과 불일치. 비채택.
- **Either monad (`Left<E> | Right<T>`)**: Haskell/Scala 컨벤션. JS/TS 생태계에서 *덜 익숙* + 라이브러리 의존(예: `fp-ts`) 야기. zod 외 의존 금지 원칙 위반. 비채택.
- **try-throw 일변도**: 표준 JS 패턴이나 *타입 시스템 정보 부재* + async 컨텍스트 손실. 본 결정의 *반대 측*. 비채택.
- **`unwrap` 제공 (옵션)**: 간단 케이스 편의성. 그러나 *런타임 throw*는 catch 누락 위험을 그대로 도입 — Result 도입 이유와 충돌. 비채택.

## 📌 Status

Accepted (2026-05-17, spec-02-01 머지 시점). 첫 사용자: `@repo/utils`. 후속 의존: shared-errors / shared-validation / shared-contracts / backend / frontend.

## 🔗 Related

- spec: `specs/spec-02-01-shared-utils/spec.md`
- 코드: `packages/shared/utils/src/index.ts` (`Result` + 6 helpers)
- 다음 spec: `spec-02-02-shared-errors` — `AppError` 계층을 `Result<T, AppError>`로 narrow 예정
- 참조 ADR: 0001 (Biome / boundary), 0004 (TS strict / JIT)
