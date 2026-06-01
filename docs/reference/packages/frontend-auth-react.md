---
type: reference
aliases: ["@repo/frontend-auth-react", "React 인증 Provider"]
tags: [service-foundry, reference, frontend, auth, mfa, passkey]
---

# @repo/frontend-auth-react — React 인증 컨텍스트 Provider + Guard

> 💡 **한 줄 요약**: `AuthProvider` 로 `AuthSDK` 주입 → `useAuth/useSession` 훅, `RequireAuth/RequireRole` Guard, MFA·Passkey 훅 제공.
> **위치**: `packages/frontend/auth-react` · **상위**: [[architecture]]

## 책임 (Responsibility)

`AuthSDK` 인터페이스(계약)를 prop으로 받아 React Context에 노출하는 provider 레이어다. SDK 구현체(Firebase, Supabase, 백엔드 JWT 등)에 무관하게 동일한 훅 API를 제공한다. MFA TOTP 챌린지(`useMfaChallenge`), Passkey 등록(`usePasskeyRegister`), 역할 기반 접근 제어 Guard를 포함한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `AuthProvider` | component | `sdk: AuthSDK` prop 수신, Context 공급자 |
| `useAuth` | hook | `{ user, signIn, signUp, signOut, ... }` |
| `useSession` | hook | `{ user, isLoading }` — `AuthContextValue`에서 `user`·`isLoading` 추출 |
| `AuthContextValue` | type | Context 값 타입 |
| `RequireAuth` | component | 미인증 시 redirect/fallback |
| `RequireRole` | component | 역할 불일치 시 redirect/fallback |
| `useMfaChallenge` | hook | MFA TOTP 챌린지 흐름 제어 |
| `usePasskeyRegister` | hook | Passkey 등록 흐름 제어 (`@simplewebauthn/browser` 내부 사용) |

## 의존

- 내부: [[shared-auth-contracts]] (`AuthSDK`, `User`, `Session`)
- 외부: `@simplewebauthn/browser` (Passkey 브라우저 API)
- peer: `react ^19`

## 사용 예

```tsx
import { AuthProvider, useAuth, RequireAuth } from "@repo/frontend-auth-react";
import { createFirebaseAuthSDK } from "@repo/frontend-auth-firebase";

const sdk = createFirebaseAuthSDK(firebaseApp);

export function RootLayout({ children }) {
  return <AuthProvider sdk={sdk}>{children}</AuthProvider>;
}

function Dashboard() {
  const { user, signOut } = useAuth();
  return <button onClick={signOut}>{user?.email}</button>;
}
```

## 연결된 개념

- [[adr/0006-auth-strategy]] — 인증 전략 (Consistent Wrapped SDK)
- [[adr/0017-auth-provider-sdk-prop-contract]] — `sdk` prop 계약 결정
- [[adr/0018-auth-provider-package-location]] — 패키지 위치 결정
- [[explainers/frontend/auth-react-provider-sdk-contract]] — Provider 동작 원리
- [[explainers/frontend/mfa-passkey-react-hooks]] — MFA/Passkey 훅 동작
- [[shared-auth-contracts]] — `AuthSDK` 계약
- [[frontend-auth-firebase]] — SDK 구현체 예시

> 소스: spec-06-02, spec-07-04 · `packages/frontend/auth-react/src/index.ts`
