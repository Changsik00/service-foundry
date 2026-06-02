# spec-14-02: 에러 처리 규약 통일 (ADR + P0/P2 리팩터)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-02` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-02-error-convention` |
| **상태** | Planning |
| **타입** | Refactor |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`@repo/utils` 에 `Result<T,E>`(ADR-0008) 가 있고 `@repo/validation`·`auth-jwt/verify` 만 사용. 나머지는 throw AppError / **plain throw Error** / discriminated union / boolean·`-1` / **silent void** 가 혼재. 규약이 문서화돼 있지 않다.

### 문제점
- **P0 (실질 버그류)**: `email-verify.confirm()`·`password-reset.confirm()` 가 토큰 미발견/만료/사용됨을 모두 **silent void** 처리 → 컨트롤러가 성공/실패를 구분 못 함(관측·로깅 불가). enumeration-safe 의도가 코드에 불분명.
- **P2 (일관성)**: 불변식 위반을 `plain Error` 로 던지는 6곳 → AppError 직렬화/코드 체계 밖.

### 해결 방안 (요약)
**ADR-0020** 으로 규약(decision tree)을 확정하고, 위험·저비용 위반인 P0(silent fail)·P2(plain Error)만 리팩터한다. auth-* 전반 boolean→Result(P1), NestJS ExceptionFilter(P3)는 후속.

## 🎯 요구사항

### Functional Requirements
1. **ADR-0020** `docs/adr/0020-error-handling-convention.md` — 결정 트리:
   - `Result<T, AppError>`: 호출자가 분기할 *예상된* 도메인 실패(parse/verify).
   - **Named discriminated union**: 결과 3+ 상태(session rotate, rate-limit) — Result 특수형.
   - `throw AppError`: I/O·프로토콜·인프라 실패 → error filter 전파.
   - **plain `throw Error` 금지** → 불변식 위반도 `AppError`(code `INTERNAL`, 500).
   - `boolean`/`null`: 단순 yes/no·부재(cache miss)만. `-1` 등 sentinel 금지.
2. **P0**: `email-verify.confirm()`·`password-reset.confirm()` 가 결과 union 반환(`confirmed`/`invalid`/`expired`/`used`). 컨트롤러는 **enumeration-safe(200 고정)** 유지하되 내부 outcome 로깅 가능.
3. **P2**: plain `throw new Error` 6곳 → `AppError`(INTERNAL) 전환: `auth-jwt/sign.ts`, `auth-oauth/{account,providers}.ts`, `auth-session/drizzle-store.ts`, `auth-rate-limit/csrf.ts`(×2).

### Non-Functional Requirements
1. 동작 비파괴: confirm 의 HTTP 응답(200 고정)·기존 throw 동작(AppError 도 Error 의 서브클래스) 유지.
2. core 패키지 framework-agnostic 유지(AppError 는 @repo/errors, 의존 없음).

## 🚫 Out of Scope (후속)
- **P1**: auth-password/mfa/oauth 의 boolean·`-1` → Result 광범위 전환.
- **P3**: NestJS ExceptionFilter 로 AppError→HTTP 자동 매핑.
- discriminated union(session/rate-limit) 은 이미 규약 부합 — 변경 없음.

## 📑 ADR 후보
- [x] **ADR-0020 error-handling-convention** (type: convention) — 본 spec 의 핵심 산출물.

## 🔗 관련 문서 (Related)
- 관련 ADR: ADR-0008(Result), ADR-0009(AppError)
- phase-14 성공 기준 1

## ✅ Definition of Done
- [ ] ADR-0020 작성
- [ ] P0: confirm 2개 결과 union 반환 + 컨트롤러 enumeration-safe 유지 + 테스트
- [ ] P2: plain Error 6곳 → AppError + 테스트 조정
- [ ] 전체 단위 PASS + typecheck 0 (turbo)
- [ ] walkthrough / pr_description ship + push + PR + 알림
