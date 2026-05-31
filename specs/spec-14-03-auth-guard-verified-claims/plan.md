# Implementation Plan: spec-14-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-03-auth-guard-verified-claims`
- 시작 지점: `phase-14-quality-cicd`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **권한 claim(role)을 검증된 `result.value` 에서만** 읽도록 변경 (보안 hardening).
> [!WARNING]
> - [ ] `JwtClaims` 에 index signature 추가 — 검증된 커스텀 claim 보존(타입 약간 느슨해지나 verify 통과분만).

## 🎯 핵심 전략
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| JwtClaims | `readonly [key: string]: unknown` 추가 | 커스텀 claim(role) 검증 결과에 보존, generic 유지 |
| narrowClaims | 검증된 payload 의 custom claim 포함 반환 | guard 가 verified role 접근 가능 |
| AuthGuard | `result.value.role` 사용 + `decodeJwt` 제거 | 미검증 소스 footgun 제거 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

### Task 1 — `@repo/backend-auth-jwt` (TDD)
#### [MODIFY] `src/keystore.ts` (JwtClaims)
- `interface JwtClaims { sub; iss; aud; jti; iat; exp; readonly [key: string]: unknown }`
#### [MODIFY] `src/verify.ts` (narrowClaims)
- 6개 필수 검증 후 `return { ...payload, sub, iss, aud, jti, iat, exp }` (검증된 custom claim 보존).
#### [MODIFY] `src/verify.test.ts`
- verified 결과에 custom claim(`role`) 보존 단언 추가.

### Task 2 — `@repo/nestjs-auth` (TDD)
#### [MODIFY] `src/auth.guard.ts`
- `decodeJwt` import/사용 제거. `Role.safeParse(result.value.role)`.
#### [MODIFY] `src/auth.guard.test.ts`
- 기존 통과 유지 + role 이 검증 claim 출처임을 보강(서명 유효 토큰만 통과).

## 🧪 검증 계획
```bash
pnpm --filter @repo/backend-auth-jwt --filter @repo/nestjs-auth test
pnpm turbo run typecheck
```

## 🔁 Rollback Plan
- JwtClaims index signature 제거 + guard 를 decodeJwt 로 환원. 국소.

## 📦 Deliverables 체크
- [ ] task.md / Plan Accept / 실행 / ship
