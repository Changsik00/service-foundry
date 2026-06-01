---
type: reference
aliases: ["@repo/frontend-auth-http", "HTTP 기반 인증 SDK (계획)"]
tags: [service-foundry, reference, frontend, auth]
---

# @repo/frontend-auth-http — HTTP 기반 인증 SDK 어댑터 (계획)

> 💡 **한 줄 요약**: 백엔드 auth API를 `CoreAuthSDK` 계약으로 감싸는 HTTP 어댑터 — 현재 stub (미구현).
> **위치**: `packages/frontend/auth-http` · **상위**: [[architecture]]

> ⚠️ **상태**: 이 패키지는 **계획된 stub**이다. `package.json`이 없고 소스 파일도 없다. Firebase/Supabase 외 자체 백엔드 JWT 인증이 필요할 때 구현 예정이다.

## 책임 (Responsibility, 계획)

`@repo/frontend-http-client`를 사용해 자체 백엔드 `/auth/*` 엔드포인트를 호출하고, 응답을 `CoreAuthSDK` 계약(`signIn`, `signUp`, `signOut`, `getCurrentUser`, `refresh`)으로 통일 노출할 예정이다. MFA 흐름은 `AuthSDK` 전체 계약까지 확장 가능.

## 의존 (계획)

- 내부: [[shared-auth-contracts]], [[shared-errors]], [[frontend-http-client]] (예정)
- 외부: (미정)

## 연결된 개념

- [[adr/0006-auth-strategy]] — Consistent Wrapped SDK 전략
- [[adr/0017-auth-provider-sdk-prop-contract]] — SDK prop 계약
- [[adr/0018-auth-provider-package-location]] — 패키지 위치
- [[explainers/frontend/auth-sdk-provider-adapters]] — 어댑터 패턴
- [[frontend-auth-firebase]] — 구현된 SDK 어댑터 참고
- [[frontend-auth-react]] — 이 SDK를 주입받을 Provider

> 소스: (미구현) · `packages/frontend/auth-http/`
