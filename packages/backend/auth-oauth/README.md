# @repo/backend-auth-oauth

> PKCE 코드 챌린지 생성, 상태 토큰 검증, 인가 코드 교환, 사용자 정보 조회, OAuth 계정 연결을 담당하는 framework-agnostic OAuth 2.0 패키지 (Google·Kakao).

## 설치 / import
```ts
import { generateCodeVerifier, generateCodeChallenge, exchangeCode, findOrCreateOAuthUser } from "@repo/backend-auth-oauth";
```

## 핵심 API
- `generateCodeVerifier()` / `generateCodeChallenge(verifier)` — PKCE code_verifier·S256 challenge 생성
- `exchangeCode({ provider, code, verifier, redirectUri })` — 인가 코드 → 액세스/리프레시 토큰 교환
- `findOrCreateOAuthUser(store, info)` — OAuth 계정 DB 연결 또는 신규 생성
- `getProvider(name)` — "google" | "kakao" 설정 조회

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-oauth.md`](../../../docs/reference/packages/backend-auth-oauth.md)
- 동작 원리: [`docs/explainers/auth/oauth-pkce-flow.md`](../../../docs/explainers/auth/oauth-pkce-flow.md)
