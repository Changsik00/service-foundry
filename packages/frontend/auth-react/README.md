# @repo/frontend-auth-react

> `AuthProvider`로 `AuthSDK` 주입 → `useAuth/useSession` 훅, `RequireAuth/RequireRole` Guard, MFA·Passkey 훅 제공.

## 설치 / import
```ts
import { AuthProvider, useAuth, RequireAuth, RequireRole, useMfaChallenge, usePasskeyRegister } from "@repo/frontend-auth-react";
```

## 핵심 API
- `AuthProvider` — `sdk: AuthSDK` prop 수신, React Context 공급자
- `useAuth` — `{ user, signIn, signUp, signOut, ... }` 훅
- `useSession` — `{ user, isLoading }` 반환 훅 (`AuthContextValue`에서 추출)
- `RequireAuth` — 미인증 시 redirect/fallback Guard 컴포넌트
- `RequireRole` — 역할 불일치 시 redirect/fallback Guard 컴포넌트
- `useMfaChallenge` — MFA TOTP 챌린지 흐름 제어 훅
- `usePasskeyRegister` — Passkey 등록 흐름 제어 훅

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-auth-react.md`](../../../docs/reference/packages/frontend-auth-react.md)
- 동작 원리: [`docs/explainers/frontend/auth-react-provider-sdk-contract.md`](../../../docs/explainers/frontend/auth-react-provider-sdk-contract.md)
- MFA/Passkey 훅: [`docs/explainers/frontend/mfa-passkey-react-hooks.md`](../../../docs/explainers/frontend/mfa-passkey-react-hooks.md)
