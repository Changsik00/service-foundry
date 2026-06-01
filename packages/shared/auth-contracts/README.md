# @repo/auth-contracts

> FE·BE·auth provider 가 모두 의존하는 인증 Zod 스키마, `AuthSDK` 인터페이스, `AuthResult` 유니온 정의.

## 설치 / import

```ts
import type { AuthSDK, AuthResult, User } from "@repo/auth-contracts";
```

## 핵심 API

- `User`, `Session`, `JwtPayload`, `Role` — Zod 스키마 + 타입
- `SignInInput`, `SignUpInput`, `RefreshInput` — 인증 입력 스키마
- `PasswordResetRequest/Confirm`, `EmailVerifyRequest/Confirm` — 비밀번호·이메일 플로우 스키마
- `AuthResult` — 성공/MFA요구/실패 discriminated union
- `AuthSDK` — 전체 auth provider 계약 인터페이스 (MFA·Passkey 포함)
- `CoreAuthSDK` — signIn/signUp/signOut/getCurrentUser/refresh 최소 서브셋

## 사용 예

```ts
import type { AuthSDK, AuthResult } from "@repo/auth-contracts";

class MyAuthProvider implements AuthSDK {
  async signIn(input): Promise<AuthResult> { ... }
}
```

## 자세히

- 레퍼런스: [`docs/reference/packages/shared-auth-contracts.md`](../../../docs/reference/packages/shared-auth-contracts.md)
