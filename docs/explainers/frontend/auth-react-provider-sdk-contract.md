---
difficulty: 중
aliases: ["AuthProvider SDK 계약", "AuthProvider SDK Contract"]
tags: [service-foundry, explainer, frontend, auth, sdk]
---

# AuthProvider SDK 계약 — CoreAuthSDK prop + SDK 교체 패턴

> **대상**: `@repo/frontend-auth-react` 구조와 SDK 교체 방식을 이해하려는 프론트엔드 개발자
> **연관 문서**: [[reference/packages/frontend-auth-react]] · [[adr/0017-auth-provider-sdk-prop-contract]] · [[adr/0006-auth-strategy]]

## 왜 필요한가

`AuthProvider`가 `AuthSDK` (10 메서드) 전체를 요구하면 Firebase/Supabase 어댑터처럼 Core 5 메서드만 구현한 SDK를 주입할 수 없다. 또한 `provider.tsx`가 실제로 호출하는 메서드는 `signIn/signUp/signOut/getCurrentUser/refresh` 5개뿐이다. ADR-0017은 이 불일치를 해소하기 위해 prop 타입을 `CoreAuthSDK`로 좁혔다.

MFA/Passkey 훅(`useMfaChallenge`, `usePasskeyRegister`)은 Context를 거치지 않고 자체 파라미터로 확장 SDK를 직접 받으므로 Provider는 Core Surface만 알면 충분하다.

## 어떻게 동작하나

```mermaid
flowchart TD
    App["앱 진입점<br/>(providers.tsx)"] -->|sdk prop| AP["AuthProvider"]
    AP -->|useEffect| GCU["sdk.getCurrentUser()"]
    GCU --> State["useState user / isLoading"]
    State --> Ctx["AuthContext.Provider value"]
    Ctx -->|useAuth()| Comp["소비 컴포넌트"]
    Ctx -->|useSession()| ROComp["읽기 전용 소비"]
    Comp -->|signIn result.success| State
    Comp -->|children| Guard["RequireAuth / RequireRole"]
    Guard -->|user 없음| Fallback["fallback 렌더"]
    Guard -->|user 있음| Protected["보호 콘텐츠"]

    subgraph SDK 교체
        Mock["createMockAuthSDK()"]
        FB["createFirebaseAuthSDK()"]
        SB["createSupabaseAuthSDK()"]
        HTTP["createAuthSDK(baseUrl)"]
    end
    Mock & FB & SB & HTTP -->|CoreAuthSDK 구현| AP
```

1. **AuthProvider 마운트** — `useEffect`에서 `sdk.getCurrentUser()`를 호출해 초기 사용자 상태를 복구한다. 결과에 따라 `user` / `isLoading`을 세팅한다.
2. **signIn / signUp** — `useCallback`으로 메모이즈된 래퍼가 SDK 호출 후 `result.success`이면 `setUser`로 Context를 갱신한다.
3. **useAuth()** — Context가 없으면 즉시 에러를 던진다. `AuthContextValue` 전체(user, isLoading, actions)를 반환한다.
4. **useSession()** — `useAuth()`의 `{ user, isLoading }` subset만 반환한다. 액션이 필요 없는 읽기 전용 컴포넌트에서 불필요한 노출을 줄인다.
5. **RequireAuth / RequireRole** — `isLoading` 또는 `!user` 상태이면 `fallback`을 렌더한다. `RequireRole`은 추가로 `user.role !== role`을 검사한다.
6. **SDK 교체** — `providers.tsx`에서 import 1줄만 바꾸면 Mock → Firebase → Supabase → HTTP SDK로 전환된다. `CoreAuthSDK` 타입이 이 교체 가능성을 TypeScript 컴파일 수준에서 보증한다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| `CoreAuthSDK` | signIn/signUp/signOut/getCurrentUser/refresh 5개 메서드 계약 (`@repo/auth-contracts`) |
| `AuthSDK` | Core 5 + MFA 1 + Passkey 4 = 10 메서드 전체 계약 |
| `AuthContext` | `user`, `isLoading`, 5개 action을 담는 React Context |
| `useSession()` | read-only alias — action 노출 없이 `user/isLoading`만 반환 |
| `RequireAuth` | 비인증 상태에서 fallback을 렌더하는 guard 컴포넌트 |
| `RequireRole` | 역할 불일치 시 fallback을 렌더하는 guard 컴포넌트 |

## 동작/테스트 방법

> 🧪 **테스트**: `pnpm --filter frontend-auth-react test` — `provider.test.tsx` 6개(마운트/signIn/signOut), `guards.test.tsx` 5개(RequireAuth/RequireRole 분기). `createMockAuthSDK()`로 SDK를 주입해 실제 네트워크 없이 검증한다.

> 🧪 **SDK 교체 검증**: `apps/web/src/lib/auth.ts`에서 import 1줄을 Mock ↔ HTTP로 바꾼 뒤 `pnpm -r typecheck`으로 `CoreAuthSDK` 타입 충족 여부를 확인한다 (spec-08-04).

## 마치며

`CoreAuthSDK` prop 계약은 "Provider는 Core만 안다, MFA/Passkey는 훅이 직접 받는다"는 책임 분리를 TypeScript 타입으로 강제한다. 덕분에 Firebase → Supabase → Mock → HTTP 교체가 한 줄로 가능하고, 어댑터 패키지는 5 메서드만 구현하면 충분하다.

## 연결된 개념

- [[auth-sdk-provider-adapters]] — Firebase/Supabase/Mock SDK가 CoreAuthSDK를 구현하는 방식
- [[mfa-passkey-react-hooks]] — MFA/Passkey 훅이 별도 SDK 파라미터를 받는 이유
- [[http-auth-sdk-inline]] — NestJS REST를 CoreAuthSDK로 래핑하는 인라인 구현
- [[login-ui-form]] — AuthProvider를 소비하는 LoginForm 컴포넌트
- [[adr/0017-auth-provider-sdk-prop-contract]] — 본 결정의 근거

> 소스: spec-06-02 / spec-08-04 walkthrough · `packages/frontend/auth-react/src/`
