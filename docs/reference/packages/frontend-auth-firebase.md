---
type: reference
aliases: ["@repo/frontend-auth-firebase", "Firebase 인증 SDK"]
tags: [service-foundry, reference, frontend, auth, oauth]
---

# @repo/frontend-auth-firebase — Firebase Auth `CoreAuthSDK` 어댑터

> 💡 **한 줄 요약**: Firebase Auth를 `CoreAuthSDK` 계약으로 감싼 어댑터 — `firebase` 확장 네임스페이스(`IdTokenResult`)도 노출.
> **위치**: `packages/frontend/auth-firebase` · **상위**: [[architecture]]

## 책임 (Responsibility)

`firebase/auth` 의 `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut` 등을 `AuthSDK` 최소 서비스(`CoreAuthSDK`)로 래핑한다. Firebase 에러를 `AppError` 로 정규화(`normalizeFirebaseAuthError`)하며, `firebase.getIdTokenResult()` 를 통해 Firebase 전용 확장 기능도 노출한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `createFirebaseAuthSDK(app)` | fn | `FirebaseApp` → `CoreAuthSDK & { firebase: FirebaseExtensions }` |
| `FirebaseExtensions` | interface | `getIdTokenResult(forceRefresh?)` Firebase 전용 확장 |

## 의존

- 내부: [[shared-auth-contracts]] (`CoreAuthSDK`, `User`, `Session`, `AuthResult`), [[shared-errors]] (`AppError`)
- 외부: `firebase` (Auth SDK)

## 사용 예

```ts
import { initializeApp } from "firebase/app";
import { createFirebaseAuthSDK } from "@repo/frontend-auth-firebase";

const app = initializeApp({ apiKey: "...", projectId: "..." });
const sdk = createFirebaseAuthSDK(app);

const result = await sdk.signIn({ email: "user@example.com", password: "secret" });
```

## 연결된 개념

- [[adr/0006-auth-strategy]] — 인증 전략 (Consistent Wrapped SDK)
- [[adr/0017-auth-provider-sdk-prop-contract]] — SDK prop 계약
- [[adr/0018-auth-provider-package-location]] — 패키지 위치
- [[explainers/frontend/auth-sdk-provider-adapters]] — 어댑터 패턴 설명
- [[shared-auth-contracts]] — `CoreAuthSDK` 계약
- [[frontend-auth-react]] — Provider에 주입되는 SDK

> 소스: spec-08-01 · `packages/frontend/auth-firebase/src/index.ts`
