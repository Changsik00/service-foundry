# @repo/frontend-auth-firebase

> Firebase Auth를 `CoreAuthSDK` 계약으로 감싼 어댑터 — `firebase` 확장 네임스페이스(`IdTokenResult`)도 노출.

## 설치 / import
```ts
import { createFirebaseAuthSDK } from "@repo/frontend-auth-firebase";
```

## 핵심 API
- `createFirebaseAuthSDK(app)` — `FirebaseApp` → `CoreAuthSDK & { firebase: FirebaseExtensions }` 인스턴스 생성
- `FirebaseExtensions` — `getIdTokenResult(forceRefresh?)` Firebase 전용 확장 인터페이스

## 자세히
- 레퍼런스: [`docs/reference/packages/frontend-auth-firebase.md`](../../../docs/reference/packages/frontend-auth-firebase.md)
- 동작 원리: [`docs/explainers/frontend/auth-sdk-provider-adapters.md`](../../../docs/explainers/frontend/auth-sdk-provider-adapters.md)
