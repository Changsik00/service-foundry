---
difficulty: 중
aliases: ["Consistent Wrapped SDK", "Auth SDK 어댑터", "Auth Provider Adapters"]
tags: [service-foundry, explainer, frontend, auth, sdk]
---

# Auth SDK Provider 어댑터 — Consistent Wrapped SDK 패턴

> **대상**: Firebase/Supabase/Mock SDK가 어떻게 `CoreAuthSDK`를 구현하는지 이해하려는 개발자
> **연관 문서**: [[reference/packages/frontend-auth-firebase]] · [[reference/packages/frontend-auth-supabase]] · [[reference/packages/frontend-auth-testing]] · [[adr/0006-auth-strategy]]

## 왜 필요한가

ADR-0006의 "Consistent Wrapped SDK" 컨벤션은 런타임 추상화 없이 패키지 일관성을 달성한다. Firebase/Supabase는 각자의 강점(Custom Claims, RLS 등)을 유지하면서도 모두 `CoreAuthSDK` 인터페이스를 구현해 `AuthProvider`에 주입 가능하다. 어댑터가 다르더라도 호출 측 코드(`AuthProvider`, `LoginForm`)는 변경되지 않는다.

## 어떻게 동작하나

```mermaid
flowchart LR
    Contract["CoreAuthSDK<br/>(auth-contracts)<br/>signIn/signUp/signOut<br/>getCurrentUser/refresh"]

    subgraph 어댑터 패키지
        FB["createFirebaseAuthSDK(app)<br/>@repo/frontend-auth-firebase<br/>firebase/auth 래핑"]
        SB["createSupabaseAuthSDK(config)<br/>@repo/frontend-auth-supabase<br/>supabase-js 래핑"]
        MOCK["createMockAuthSDK(state?)<br/>@repo/frontend-auth-testing<br/>state 제어 테스트용"]
        HTTP["createAuthSDK(baseUrl)<br/>web-next 인라인<br/>NestJS REST 래핑"]
    end

    FB -->|구현| Contract
    SB -->|구현| Contract
    MOCK -->|구현 (+ AuthSDK 전체)| Contract
    HTTP -->|구현| Contract

    Contract -->|sdk prop| AP["AuthProvider<br/>(auth-react)"]

    FB -.->|확장| FBExt["firebase.getIdTokenResult()"]
    SB -.->|확장| SBExt["supabase.rls"]
```

### 어댑터별 구현 전략

| 어댑터 | 핵심 래핑 | 에러 처리 | 확장 |
|---|---|---|---|
| **Firebase** | `signInWithEmailAndPassword` 등 firebase/auth API | `normalizeFirebaseAuthError()` — FirebaseError 코드 → AuthResult reason | `firebase.getIdTokenResult()` |
| **Supabase** | `client.auth.signInWithPassword` 등 supabase-js API | `normalizeSupabaseAuthError()` — AuthApiError → AuthResult reason | `supabase.rls` (SupabaseClient) |
| **Mock** | in-memory `MockAuthState` 객체 | 상태 직접 제어 (`_state.signInResult` 등) | `_calls` 기록 + `_reset()` |
| **HTTP** | `createAuthApi(http)` → NestJS REST | `fromPromise()` Result 래핑 | `signIn` mfa_required 분기 |

### Mock SDK 설계

`createMockAuthSDK(initial?)` 은 `AuthSDK` 전체(10 메서드)를 구현해 MFA/Passkey 테스트에도 사용할 수 있다. `_state` / `_calls` / `_reset()` 컨트롤 인터페이스로 테스트 시나리오를 선언적으로 조작한다.

### TypeScript swap 증명

```ts
const sdk: CoreAuthSDK = createMockAuthSDK();  // 컴파일 통과 → 계약 충족 증명
```

spec-08-04에서 이 패턴으로 Mock/Firebase/Supabase 세 어댑터 모두 `CoreAuthSDK` 타입을 충족함을 typecheck 수준에서 검증했다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| `CoreAuthSDK` | 5 메서드 최소 계약 (`@repo/auth-contracts`) |
| `AuthSDK` | Core 5 + MFA + Passkey 10 메서드 전체 계약 |
| `normalizeFirebaseAuthError` | FirebaseError 코드 → `AuthResult { success: false, reason }` 변환 |
| `normalizeSupabaseAuthError` | AuthApiError → `AuthResult { success: false, reason }` 변환 |
| `MockAuthState` | Mock SDK의 응답을 제어하는 in-memory 상태 객체 |
| Consistent Wrapped SDK | 런타임 추상화 없이 동일 모양의 SDK를 패키지별로 제공하는 컨벤션 |

## 동작/테스트 방법

> 🧪 **Firebase 테스트**: `pnpm --filter frontend-auth-firebase test` — `vi.mock('firebase/auth', ...)` 전체 교체로 브라우저 글로벌(IndexedDB 등) 의존 없이 20개 테스트 실행. `normalize.test.ts` 8개(에러 코드 정규화) + `index.test.ts` 12개(signIn/signUp/signOut/getCurrentUser/refresh).

> 🧪 **Supabase 테스트**: `pnpm --filter frontend-auth-supabase test` — `@supabase/supabase-js` mock으로 Core 5 메서드 전 경로 검증.

> 🧪 **Mock SDK**: `pnpm --filter frontend-auth-testing test` — `_state` 세팅 후 호출 결과·횟수(`_calls`) 검증 패턴.

## 마치며

각 어댑터는 외부 SDK(firebase-admin, supabase-js)를 `CoreAuthSDK` 형태로 감싸되, Provider 강점은 확장 인터페이스(`firebase.*`, `supabase.rls`)로 보존한다. 앱은 어댑터를 교체할 때 `providers.tsx`의 import 1줄만 바꾸면 된다.

## 연결된 개념

- [[auth-react-provider-sdk-contract]] — CoreAuthSDK prop 계약과 AuthProvider 내부
- [[http-auth-sdk-inline]] — NestJS REST를 CoreAuthSDK로 인라인 구현
- [[adr/0006-auth-strategy]] — Consistent Wrapped SDK 전략 결정 근거
- [[adr/0017-auth-provider-sdk-prop-contract]] — prop을 CoreAuthSDK로 좁힌 결정

> 소스: spec-08-01 / spec-08-02 / spec-08-03 / spec-08-04 walkthrough · `packages/frontend/auth-{firebase,supabase,testing}/src/`
