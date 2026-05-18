---
id: ADR-0012
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0012: Auth Error Normalize — `AuthErrorCode`를 `@repo/errors` 흡수

## 📚 Context

ADR-0009에서 `AppError` flat code 원칙을 박았다 (`class ValidationError extends AppError` 같은 subclass 금지). 한편 ADR-0006에서 Auth Platform 전략 채택 — Provider(Firebase / Supabase / Native JWT)의 *raw error*를 *직접 노출 금지* + canonical error system 필요.

2차안(`docs/notes/auth-foundation-architecture.md` §Error Architecture)에서 `AuthErrorCode` enum + `class AuthError extends Error` 제안. 그러나:

1. **ADR-0009 flat code 원칙 위반 위험**: `AuthError extends AppError`는 subclass 폭증 시작점.
2. **`@repo/errors` 이미 존재**: spec-02-02에서 `AppError` 데이터 모델 + 8 표준 코드 + flat code 컨벤션 + factory 패턴 박혔음.
3. **별 `auth-errors` 패키지의 ROI**: 도메인 코드 추가 + provider normalize helper 외엔 별 패키지 가치 작음.

본 ADR은 *흡수* 결정을 박는다.

## 🎯 Decision

다음 5 결정을 박는다.

### Decision 1: `AuthErrorCode` enum을 `@repo/errors` 도메인 코드로 흡수

- 별 `auth-errors` 패키지 **생성 ❌**.
- `@repo/errors`의 `AppError` 어휘 사용: `new AppError({ code: "INVALID_CREDENTIALS", ... })`.
- `STANDARD_ERROR_REGISTRY`는 *HTTP 표준 8 코드*만 유지 (VALIDATION / UNAUTHENTICATED / FORBIDDEN / NOT_FOUND / CONFLICT / RATE_LIMIT / INTERNAL / BAD_GATEWAY).
- **AuthErrorCode 11개는 *도메인 코드*로 분류** — 사용자 도메인 확장과 동일 패턴. enum 또는 string literal union으로 별도 export 가능 (`@repo/errors`의 *type-only* export).

### Decision 2: AuthErrorCode 11 코드 정의

| 코드 | HTTP statusCode | 분류 | 비고 |
|---|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Authentication | account enumeration 방지 — `USER_NOT_FOUND`/`WRONG_PASSWORD` 사용 ❌ |
| `INVALID_TOKEN` | 401 | Authentication | JWT 형식 / 서명 / claims 위반 |
| `TOKEN_EXPIRED` | 401 | Authentication | exp claim 만료 |
| `SESSION_REVOKED` | 401 | Authentication | force-revoke / reuse detection trigger |
| `USER_NOT_FOUND` | 404 | User | *프로필 조회* 시점에만 사용 (signin에서는 INVALID_CREDENTIALS) |
| `EMAIL_ALREADY_EXISTS` | 409 | User | signup 충돌 |
| `EMAIL_NOT_VERIFIED` | 403 | User | 미검증 계정의 protected 작업 |
| `MFA_REQUIRED` | 401 | MFA | AuthResult `mfa_required` 분기와 짝 |
| `MFA_INVALID_CODE` | 401 | MFA | TOTP / Passkey 검증 실패 |
| `INSUFFICIENT_PERMISSION` | 403 | Authorization | RBAC role 부족 |
| `TOO_MANY_ATTEMPTS` | 429 | Rate / Lockout | rate limit hit (`auth-security`) |
| `ACCOUNT_LOCKED` | 423 | Rate / Lockout | N회 실패 lockout |
| `PROVIDER_ERROR` | 502 | Provider | normalize 불가능한 raw provider 에러 (fallback) |

> 코드 수: 13개 (위 표). 2차안 명목 11개에서 *PROVIDER_ERROR 포함 + ACCOUNT_LOCKED 분리*로 13개로 확장.

### Decision 3: Provider Normalize Helper 위치

- 각 `@repo/auth-{provider}` 패키지 *내부*에 normalize helper 배치:
  ```ts
  // packages/auth-firebase/src/normalize.ts
  export const normalizeFirebaseError = (e: FirebaseError): AppError => {
    switch (e.code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
        return new AppError({ code: "INVALID_CREDENTIALS", statusCode: 401, cause: e });
      case "auth/email-already-in-use":
        return new AppError({ code: "EMAIL_ALREADY_EXISTS", statusCode: 409, cause: e });
      // ...
      default:
        return new AppError({ code: "PROVIDER_ERROR", statusCode: 502, cause: e });
    }
  };
  ```
- normalize는 *각 Provider 패키지의 책임* — `@repo/errors`나 `auth-core`에 두지 않음 (ADR-0006 §"Auth Platform" — 각 Provider 강점 살리되 *Error normalize는 자체 책임*).

### Decision 4: Account Enumeration 방지 원칙

- **위험한 패턴 (금지)**: `EMAIL_NOT_FOUND` / `WRONG_PASSWORD` / `PASSWORD_TOO_SHORT_FOR_USER` 등 *계정 존재 여부 노출* 코드.
- **안전한 패턴**: 모든 인증 실패는 `INVALID_CREDENTIALS` 단일 응답. *클라이언트는 어느 단계에서 실패했는지 모름*.
- 예외: `signup` 시 `EMAIL_ALREADY_EXISTS`는 *불가피* (UX 측면). 그러나 *rate limit + lockout*으로 enumeration attack 비용 증가.

### Decision 5: `AuthError extends AppError` 미생성

- ADR-0009 flat code 원칙 *유지*.
- `class AuthError`를 별도 만들지 않음. `AppError` 인스턴스 + `code: "INVALID_CREDENTIALS"` 같은 *코드 분기*로 처리.
- 효과: 호출자가 `isCode(e, "INVALID_CREDENTIALS")` (ADR-0009 type guard) 사용. instanceof 분기 불필요.

## ✅ Consequences

### 긍정
- **flat code 일관**: ADR-0009 원칙 유지 → subclass 폭증 회피.
- **단일 SoT**: `@repo/errors`가 *모든 에러 어휘*의 중심. auth 도메인도 같은 패턴.
- **type guard 재사용**: `isAppError` / `isCode<C>` / `errorMessage` / `errorCause` (ADR-0009) 그대로 auth 코드에서 사용.
- **양방향 wire 재사용**: `toJSON` / `fromJSON` / `isAppErrorResponse` (ADR-0009)가 auth 에러에도 그대로 적용.
- **별 패키지 비용 회피**: scaffold / 빌드 설정 / 문서 등 *패키지 운영 비용* 절감.

### 부정 / Trade-off
- **`@repo/errors` 도메인 코드 풍부화**: 8 표준 → 8 + 13 auth = 21 코드. `@repo/errors` 패키지가 *auth 도메인 지식*을 *간접적으로* 가짐.
  - 완화: AuthErrorCode는 *별도 type export*로 분리. `import { AuthErrorCode } from "@repo/errors/auth"` 같은 sub-path 검토 (phase-05 진입 시 결정).
- **Provider normalize가 *각 패키지에 분산***: 일관성 검증 어려움.
  - 완화: `auth-testing` 패키지(phase-08)에 *normalize round-trip test* 표준 박음.

## 🔄 Alternatives

| 대안 | 비채택 이유 |
|---|---|
| **별 `@repo/auth-errors` 패키지** (2차안 그대로) | 패키지 운영 비용 + ADR-0009 flat code 원칙과의 *cross-package 일관성* 위험. `@repo/errors` 흡수로 동일 효과 달성. |
| **`class AuthError extends AppError`** | ADR-0009 flat code 원칙 위반. subclass 폭증 시작점. |
| **Per-provider error 그대로 노출** (`FirebaseError` / `PostgrestError`) | Provider 종속 + account enumeration 위험 + client 분기 복잡. |
| **string literal union (enum 대신)** — `type AuthErrorCode = "INVALID_CREDENTIALS" | "INVALID_TOKEN" | ...` | enum vs union은 *style 선택*. `@repo/errors`의 `STANDARD_ERROR_REGISTRY` 패턴과 일관되게 *string literal*로 박을 수 있음 — phase-05 진입 시 최종 결정. |

## 🔗 Related

- **선행**:
  - [ADR-0009](./0009-app-error-design.md) — `AppError` flat code (본 ADR이 *확장 적용*)
  - [ADR-0006](./0006-auth-strategy.md) — Auth Platform 전략 (본 ADR은 §A.3 cross-ref)
  - [ADR-0010](./0010-validation-zod-result-integration.md) — `details.errors[]` 컨벤션 (auth validation 에러도 동일)
- **후속**:
  - phase-05 (Auth Core) — `@repo/auth-contracts` 확장 시 AuthErrorCode export 위치 결정
  - phase-08 (Provider Adapters) — Provider normalize round-trip test
- **코드**: `packages/shared/errors/src/index.ts` (phase-05에서 AuthErrorCode 추가)
- **design note**: [`docs/notes/auth-foundation-architecture.md`](../notes/auth-foundation-architecture.md) §Error Architecture
