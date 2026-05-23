---
id: ADR-0017
type: convention
date: 2026-05-22
status: accepted
---

# ADR-0017: AuthProvider sdk prop은 CoreAuthSDK만 요구한다

## 📚 Context

`packages/frontend/auth-react`의 `AuthProvider`는 `sdk` prop으로 AuthSDK 구현체를 주입받아 React Context에 공급한다. spec-08-04 이전에는 prop 타입이 `AuthSDK` (Core 5 메서드 + MFA 1 + Passkey 4 = 10 메서드)였다.

이 상태에서 두 가지 문제가 발생했다:

1. **Provider 어댑터 주입 불가**: `createFirebaseAuthSDK()` / `createSupabaseAuthSDK()` 는 `CoreAuthSDK` (5 메서드)만 구현. MFA/Passkey를 구현하지 않으므로 `AuthSDK` 타입 불충족 → TypeScript 오류.
2. **provider.tsx 실제 사용 불일치**: `provider.tsx` 내부에서 실제로 호출하는 메서드는 `signIn`, `signOut`, `getCurrentUser`, `signUp`, `refresh` — Core 5개뿐. MFA/Passkey 메서드를 직접 호출하지 않음.

`useMfaChallenge` / `usePasskeyRegister` 훅은 자체 파라미터(`sdk: MfaAuthSDK`, `sdk: PasskeyAuthSDK`)로 확장 SDK를 직접 받으므로 `AuthProvider`의 sdk prop에 의존하지 않는다.

## ✅ Decision

```
AuthProvider sdk prop 타입 = CoreAuthSDK (5 메서드만)
MFA 훅               = useMfaChallenge(sdk: MfaAuthSDK, ...) 자체 파라미터
Passkey 훅           = usePasskeyRegister(sdk: PasskeyAuthSDK, ...) 자체 파라미터
```

`AuthProvider`는 `CoreAuthSDK`만 요구한다. Provider 어댑터 (Firebase, Supabase, Mock, HTTP) 는 `CoreAuthSDK`를 구현하는 것으로 충분하며, MFA/Passkey 기능이 필요한 훅은 각자 확장 SDK를 파라미터로 직접 받는다.

## 🎯 Consequences

### 장점

- **Provider 어댑터 주입 가능**: `createFirebaseAuthSDK()` / `createSupabaseAuthSDK()` 를 `AuthProvider`에 직접 주입 가능. TypeScript 타입 오류 없음.
- **AuthProvider 책임 명확**: provider.tsx는 Core 5 메서드 범위 내에서만 동작 — 불필요한 의존성 없음.
- **SDK swap 증명**: `src/lib/auth.ts` 한 줄 변경으로 Mock / HTTP / Firebase / Supabase 교체 가능함을 typecheck 수준에서 증명 가능.
- **MFA/Passkey 선택적**: 앱이 MFA/Passkey를 사용하지 않아도 `AuthProvider` 연결에 영향 없음.

### 단점

- **Context에서 MFA/Passkey SDK 미노출**: `useAuth()` 로 MFA SDK에 접근 불가 — 훅에 직접 전달해야 함.
- **훅 호출 측 변경**: MFA/Passkey 훅을 사용하는 곳에서 SDK를 별도로 전달해야 함 (현재 사용처 없음 — breaking 없음).

## 🔁 Alternatives Considered

| 옵션 | 무엇 | 거부 사유 |
|---|---|---|
| **A. AuthSDK 유지** | prop 타입을 AuthSDK(10 메서드) 유지 | Firebase/Supabase 어댑터가 MFA/Passkey 미구현 → 주입 불가. Provider 어댑터 사용 불가. |
| **B. AuthSDK \| CoreAuthSDK union** | prop 타입을 union으로 허용 | provider.tsx 내부에서 런타임 타입 가드 필요. TypeScript 복잡도 증가. |
| **C. CoreAuthSDK만 (채택)** | provider.tsx 실사용 메서드에 맞춤 | Provider 어댑터 호환 + 타입 단순 + 책임 명확. |

## 🔁 Revisit Triggers

- `provider.tsx`가 MFA/Passkey 메서드를 직접 사용하게 되는 경우 — prop 타입 재검토
- `useMfaChallenge` / `usePasskeyRegister` 훅이 Context 기반으로 재설계되는 경우

## 📚 관련 문서

- [ADR-0006](./0006-auth-strategy.md) — Consistent Wrapped SDK 전략 (CoreAuthSDK 계약)
- [ADR-0018](./0018-auth-provider-package-location.md) — auth browser 패키지 위치 결정
- `specs/spec-08-04-sdk-swap-validation/walkthrough.md` — 본 결정의 1차 기록
- `packages/frontend/auth-react/src/provider.tsx` — 본 ADR 적용 파일
