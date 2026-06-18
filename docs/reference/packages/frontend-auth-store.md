---
type: reference
aliases: ["@repo/frontend-auth-store", "auth source/store"]
tags: [service-foundry, reference, frontend, auth]
---

# @repo/frontend-auth-store — 프레임워크 무관 auth 상태 store + source

> 💡 **한 줄 요약**: zustand vanilla store 로 인증 상태(status/user/token)를 보관하고, `AuthSource` 계약으로 노출 — React 비의존 core 이며 native/firebase/supabase 어댑터로 채워진다.
> **위치**: `packages/frontend/auth-store` · **상위**: [[architecture]]

## 책임 (Responsibility)

인증 상태(`status`: `unknown`/`authenticated`/`unauthenticated`, `user`, `token`)를 zustand vanilla store 로 관리하고, 이를 [[shared-auth-contracts|@repo/auth-contracts]]의 `AuthSource` 인터페이스(`status`/`getToken`/`refresh`/`waitUntilSettled`)로 래핑한다. UI 프레임워크 비의존 — [[reference/packages/frontend-auth-react|@repo/frontend-auth-react]] 등이 이 source 를 구독한다. 실제 토큰 획득/검증은 sub-path 어댑터(`./adapters/{native-jwt,firebase,supabase}`)가 담당한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createAuthStore` | fn | zustand vanilla store 생성 (`setAuthenticated`/`setUnauthenticated`/`setToken`) |
| `createAuthSource` | fn | store → `AuthSource` 어댑터 (`refresh` 미설정 시 throw) |
| `AuthStore` | type | store 인스턴스 타입 |
| `AuthStoreState` | type | `{ status, user, token, ... }` |

서브경로 export: `@repo/frontend-auth-store/adapters/native-jwt` · `/adapters/firebase` · `/adapters/supabase`.

## 의존

- 내부: [[shared-auth-contracts]] (`AuthSource`/`AuthStatus`/`User`)
- 외부: `zustand` (vanilla)

## 사용 예

```ts
import { createAuthStore, createAuthSource } from "@repo/frontend-auth-store";

const store = createAuthStore();
const source = createAuthSource(store, { refresh: async () => {/* ... */} });
await source.waitUntilSettled();
```

## 연결된 개념

- [[reference/packages/frontend-auth-react]] — 이 source 를 구독하는 React 바인딩
- [[explainers/frontend/auth-react-provider-sdk-contract]] — Provider(CoreAuthSDK) 계약
- [[explainers/frontend/auth-sdk-provider-adapters]] — Consistent Wrapped SDK
- [[adr/0023-auth-authority-modes]] — native/firebase/supabase 모드

> 소스: `packages/frontend/auth-store/src/index.ts`, `store.ts`, `source.ts`, `adapters/*`
