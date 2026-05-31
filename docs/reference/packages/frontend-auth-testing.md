---
type: reference
aliases: ["@repo/frontend-auth-testing", "인증 테스트 목(Mock)"]
tags: [service-foundry, reference, frontend, auth]
---

# @repo/frontend-auth-testing — 인증 SDK Mock 구현체

> 💡 **한 줄 요약**: 테스트 환경용 `MockAuthSDK` — 상태와 호출 내역을 추적하며 `AuthSDK` 전체 계약을 구현.
> **위치**: `packages/frontend/auth-testing` · **상위**: [[architecture]]

## 책임 (Responsibility)

`AuthSDK` 계약을 완전히 구현하는 Mock 객체를 제공한다. `_state`로 응답을 프로그래밍하고, `_calls`로 호출 횟수와 인수를 검증할 수 있다. `_reset()`으로 테스트 간 격리를 보장한다. MFA/Passkey 메서드는 `not implemented` 오류를 던져 해당 흐름이 필요한 테스트에서 명시적으로 재정의하도록 강제한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createMockAuthSDK(initial?)` | fn | `MockAuthSDK` 인스턴스 생성 |
| `MockAuthSDK` | type | `AuthSDK & MockControls` |
| `MockAuthState` | interface | `currentUser, signInResult, signUpResult, refreshResult` |
| `MockAuthCalls` | interface | `signIn[], signUp[], signOutCount, getCurrentUserCount, refreshCount` |
| `MockControls` | interface | `_state, _calls, _reset()` |
| `DEFAULT_STATE` | const | 기본 초기 상태 (`success: false, reason: "invalid_credentials"`) |

## 의존

- 내부: [[shared-auth-contracts]] (`AuthSDK`, `User`, `Session`, `AuthResult`, `SignInInput`, `SignUpInput`)
- 외부: (없음)

## 사용 예

```ts
import { createMockAuthSDK } from "@repo/frontend-auth-testing";

const sdk = createMockAuthSDK({
  signInResult: { success: true, user: mockUser, session: mockSession },
});
// 테스트에서 AuthProvider에 주입
render(<AuthProvider sdk={sdk}><LoginForm /></AuthProvider>);

expect(sdk._calls.signIn).toHaveLength(1);
sdk._reset();
```

## 연결된 개념

- [[adr/0006-auth-strategy]] — Consistent Wrapped SDK 전략
- [[adr/0017-auth-provider-sdk-prop-contract]] — SDK prop 계약
- [[explainers/frontend/auth-sdk-provider-adapters]] — 어댑터 패턴
- [[shared-auth-contracts]] — `AuthSDK` 계약
- [[frontend-auth-react]] — 테스트 시 Mock SDK를 주입받는 Provider

> 소스: spec-08-03 · `packages/frontend/auth-testing/src/index.ts`
