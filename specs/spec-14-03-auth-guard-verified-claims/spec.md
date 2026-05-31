# spec-14-03: auth.guard 검증 claim 사용 (footgun 제거)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-03` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-03-auth-guard-verified-claims` |
| **상태** | Planning |
| **타입** | Fix (security hardening) |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`AuthGuard.canActivate`(`packages/nestjs/auth/src/auth.guard.ts`)는 `verifyAccessToken` 으로 토큰을 검증(`result.value`)한 뒤, **role 만은 `decodeJwt(token)`(서명 미검증 base64 디코드)에서 다시 읽는다**(`auth.guard.ts:55-56`).

### 문제점
- **권한 결정 claim(role)을 미검증 소스에서 취득** — footgun. 현재는 같은 토큰이라 값이 일치하지만, 검증 로직이 claim 을 변형/필터하거나 향후 변경 시 **검증된 신원과 권한이 갈라질 수 있다**(권한 상승 위험의 씨앗).
- **근본 원인**: `narrowClaims`(`backend-auth-jwt/verify.ts:40`)가 `JwtClaims` 에 sub/iss/aud/jti/iat/exp 만 담고 **커스텀 claim(role)을 버린다** → guard 가 우회로 `decodeJwt` 사용.

### 해결 방안 (요약)
verify 가 **검증된 커스텀 claim 을 보존**(`JwtClaims` index signature) → guard 가 `result.value.role`(검증된 소스)에서 role 을 읽고 `decodeJwt` 제거.

## 🎯 요구사항

### Functional Requirements
1. **`JwtClaims`** 에 `readonly [key: string]: unknown` 추가 — 커스텀 claim 보존. `narrowClaims` 가 검증된 payload 의 커스텀 claim 을 결과에 포함.
2. **`AuthGuard`**: `Role.safeParse(result.value.role)` 로 변경, `decodeJwt` import/사용 제거. `req.user` 는 `{ sub: result.value.sub, role }`.
3. 동작 비파괴: 유효 토큰(role 포함) → 통과, role 없음/유효하지 않음 → 401.

### Non-Functional Requirements
1. `@repo/backend-auth-jwt` 는 generic 유지 — "role" 을 하드코딩하지 않고 index signature 로 일반 보존.
2. 서명/iss/aud/exp 검증 경로 불변.

## 🚫 Out of Scope
- AppError→NestJS 예외 자동 매핑(P3, 후속).
- roles.guard(이미 `req.user.role` 소비 — 본 수정으로 검증된 값 사용하게 됨, 추가 변경 없음).

## 📑 ADR 후보
- [ ] 없음 (ADR-0013 JWT 설계 보강 수준)

## 🔗 관련 문서 (Related)
- 관련 ADR: ADR-0013(JWT), ADR-0008(Result), ADR-0020(에러 규약)
- phase-14 성공 기준 2

## ✅ Definition of Done
- [ ] `JwtClaims` 커스텀 claim 보존 + `narrowClaims` 테스트(verified role 포함)
- [ ] `AuthGuard` 가 `result.value.role` 사용 + `decodeJwt` 제거 + 가드 테스트
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description ship + push + PR + CI green
