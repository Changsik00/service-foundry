---
type: reference
aliases: ["@repo/auth-contracts", "인증 계약"]
tags: [service-foundry, reference, shared, auth, jwt]
---

# @repo/auth-contracts — 인증 도메인 공유 계약

> 💡 **한 줄 요약**: FE·BE·auth provider 가 모두 의존하는 인증 Zod 스키마, `AuthSDK` 인터페이스, `AuthResult` 유니온 정의.
> **위치**: `packages/shared/auth-contracts` · **상위**: [[architecture]]

## 책임 (Responsibility)

인증 도메인의 단일 계약 소스(SSOT)다. `User`, `Session`, `JwtPayload` 스키마를 정의하고, provider 패키지가 구현해야 하는 `AuthSDK` 인터페이스와 `CoreAuthSDK` 최소 서비스를 노출한다. `AuthResult` discriminated union으로 MFA 챌린지 흐름까지 표현한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `User` | Zod schema + type | `{ id, email, role, createdAt }` |
| `Session` | Zod schema + type | `{ userId, expiresAt }` |
| `JwtPayload` | Zod schema + type | `{ sub, role, iat, exp }` |
| `Role` | Zod enum + type | `"user" \| "admin"` |
| `SignInInput` | Zod schema + type | `{ email, password }` |
| `SignUpInput` | Zod schema + type | `{ email, password, displayName? }` |
| `RefreshInput` | Zod schema + type | `{ refreshToken }` |
| `PasswordResetRequest` | Zod schema + type | `{ email }` |
| `PasswordResetConfirm` | Zod schema + type | `{ token, newPassword }` |
| `EmailVerifyRequest` | Zod schema + type | `{ email }` |
| `EmailVerifyConfirm` | Zod schema + type | `{ token }` |
| `Password` | Zod schema | 8~128자 문자열 |
| `Token` | Zod schema | URL-safe 20자+ 문자열 |
| `MfaChallenge` | interface | `{ challengeId, method, expiresAt }` |
| `AuthResult` | type | 성공/MFA요구/실패 discriminated union |
| `AuthSDK` | interface | 전체 auth provider 계약 (MFA·Passkey 포함) |
| `CoreAuthSDK` | type | `AuthSDK` 최소 서브셋 (signIn/signUp/signOut/getCurrentUser/refresh) |

## 의존

- 내부: [[shared-validation]] (`Uuid`, `Email` 재사용)
- 외부: `zod`, `ts-pattern` (패턴 매칭 유틸)

## 사용 예

```ts
import type { AuthSDK, AuthResult, User } from "@repo/auth-contracts";

class MyAuthProvider implements AuthSDK {
  async signIn(input): Promise<AuthResult> { ... }
  // ...
}
```

## 연결된 개념

- [[adr/0011-contracts-package-layout]] — 계약 패키지 레이아웃 결정
- [[adr/0006-auth-strategy]] — 인증 전략 선택 배경
- [[shared-validation]] — `Uuid`, `Email` 스키마 공급
- [[nestjs-auth]] — `AuthGuard`가 `JwtPayload` 검증에 사용
- [[frontend-auth-react]] — `AuthSDK` 주입받는 Provider

> 소스: spec-02-04, spec-05-01 · `packages/shared/auth-contracts/src/index.ts`
