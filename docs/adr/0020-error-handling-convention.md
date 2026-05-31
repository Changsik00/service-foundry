# ADR-0020: 에러 처리 규약 (Error Handling Convention)

- **상태**: Accepted
- **날짜**: 2026-05-31
- **관련**: ADR-0008 (Result 타입), ADR-0009 (AppError 설계)
- **spec**: spec-14-02

## 맥락 (Context)

코드베이스에 에러 표현이 5가지로 혼재했다 — `throw AppError`, plain `throw Error`, `Result<T, AppError>`, named discriminated union, `boolean`/`null`/`-1`. 같은 도메인(인증)에서도 패키지마다 달라 호출자가 실패를 다루는 방식을 예측할 수 없었고, 일부는 실패를 **silent void** 로 삼켜 관측 불가능했다.

`@repo/utils` 에 `Result<T,E>`(ADR-0008), `@repo/errors` 에 `AppError`(ADR-0009)가 이미 있으나 규약이 문서화되지 않았다.

## 결정 (Decision)

함수가 실패를 표현하는 방식을 다음 **결정 트리**로 고정한다.

### 1. `Result<T, AppError>` — 예상된 도메인 실패 (호출자가 분기)
실패가 **정상 흐름의 일부**이고 호출자가 코드별로 분기해야 할 때.
```ts
// parse, token verify 등
function parse<T>(schema, data): Result<T, AppError>
async function verifyAccessToken(...): Promise<Result<JwtClaims, AppError>>
```
- 적용: `@repo/validation`, `auth-jwt/verify`.

### 2. Named discriminated union — 결과가 3+ 상태
실패/성공이 2개를 넘는 **상태 기계**일 때. `Result` 의 도메인 특수형.
```ts
type RotateResult = { type: "rotated"; ... } | { type: "reuse_detected" } | { type: "expired" } | { type: "not_found" }
type RateLimitDecision = { allowed: boolean; retryAfterMs?: number }
```
- 적용: `auth-session` rotate, `auth-rate-limit`.

### 3. `throw AppError` — I/O·프로토콜·인프라 실패
호출자가 보통 **국소적으로 복구할 수 없고** 에러 경계(error filter)로 전파돼야 하는 외부 실패.
```ts
// network/DB/crypto 라이브러리 실패
throw new AppError({ code: "BAD_GATEWAY", message, statusCode: 502 })
```
- 적용: `http-client`, `database/migrate`, `auth-oauth/token`(API 실패).

### 4. `boolean` / `null` — 단순 yes/no · 부재
에러 **컨텍스트가 불필요한** 단일 판정 또는 부재.
```ts
function verifyTotp(secret, token): boolean   // 유효한가?
async function get<T>(key): Promise<T | null>  // cache miss = null
```

## 금지 (Anti-patterns)

| 안티패턴 | 이유 | 대신 |
|---|---|---|
| **plain `throw new Error(msg)`** | AppError 직렬화/코드 체계 밖, FE 노출·로깅 불일치 | `throw new AppError({ code: "INTERNAL", ... })` (불변식 위반 포함) |
| **`-1` / 매직 sentinel 반환** | 호출자가 체크 누락 시 인덱싱 버그(footgun) | `Result` 또는 명시적 union |
| **silent `void` (실패 삼킴)** | 호출자가 성공/실패 구분 불가, 관측 불가 | 결과 union 반환 (보안상 응답을 숨겨야 하면 *경계 계층*에서 일괄 매핑) |

### 보안 예외 — enumeration-safe
토큰/이메일 존재를 숨겨야 하는 경우(비밀번호 재설정 등), **서비스는 outcome 을 정확히 반환**하고 **컨트롤러(경계)가 응답을 일괄 200 으로 매핑**한다. 실패를 코드에서 삼키지 않는다 — 관측은 유지, 노출만 차단.

## 결과 (Consequences)

- **+** 호출자가 함수 시그니처만으로 실패 처리 방식을 안다.
- **+** 모든 throw 가 AppError → 직렬화·로깅·HTTP 매핑 일관.
- **+** silent fail 제거로 관측성 향상.
- **−** 점진 마이그레이션 필요: 본 ADR 은 spec-14-02 에서 P0(silent confirm)·P2(plain Error)만 적용. auth-* 의 boolean→Result(P1), NestJS ExceptionFilter 자동 매핑(P3)은 후속 spec.

## 적용 범위 (이번 spec)
- **P0**: `email-verify/password-reset.confirm()` silent void → outcome union.
- **P2**: plain `throw Error` 6곳 → `AppError(INTERNAL)`.
- 후속: P1(auth-* boolean→Result), P3(ExceptionFilter).
