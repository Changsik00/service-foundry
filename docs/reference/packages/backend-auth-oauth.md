---
type: reference
aliases: ["@repo/backend-auth-oauth", "OAuth PKCE 소셜 로그인"]
tags: [service-foundry, reference, auth, oauth]
---

# @repo/backend-auth-oauth — OAuth 2.0 PKCE 소셜 로그인 (Google·Kakao)

> 💡 **한 줄 요약**: PKCE 코드 챌린지 생성, 상태 토큰 검증, 인가 코드 교환, 사용자 정보 조회, OAuth 계정 연결을 담당하는 framework-agnostic 패키지.
> **위치**: `packages/backend/auth-oauth` · **상위**: [[architecture]]

## 책임 (Responsibility)

OAuth 2.0 Authorization Code + PKCE 흐름 전체를 구현한다. `providers`에 Google/Kakao 설정이 포함되며, PKCE 코드 검증값 생성(`generateCodeVerifier`/`generateCodeChallenge`), state 파라미터 발행·검증, 인가 코드로 토큰 교환(`exchangeCode`), 사용자 정보 조회(`fetchUserInfo`), DB 계정 연결(`findOrCreateOAuthUser`)을 제공한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `generateCodeVerifier` | fn | PKCE code_verifier 생성 |
| `generateCodeChallenge` | fn | S256 code_challenge 생성 |
| `generateState` | fn | CSRF 방지용 state 토큰 발행 |
| `verifyState` | fn | state 토큰 검증 |
| `exchangeCode` | fn | 인가 코드 → 액세스/리프레시 토큰 교환 |
| `fetchUserInfo` | fn | 액세스 토큰으로 제공자 사용자 정보 조회 |
| `findOrCreateOAuthUser` | fn | OAuth 계정 DB 연결/생성 |
| `getProvider` | fn | 이름으로 제공자 설정 조회 |
| `googleProvider` | const | Google OAuth 제공자 설정 |
| `kakaoProvider` | const | Kakao OAuth 제공자 설정 |
| `providers` | const | 전체 제공자 맵 |
| `OAuthProvider` | type | 제공자 설정 타입 |
| `OAuthProviderName` | type | 제공자 이름 유니언 |
| `oauthAccounts` | const | Drizzle 테이블 정의 |
| `OAuthAccountRow` | type | DB 행 타입 |
| `OAuthAccountInsert` | type | DB 삽입 타입 |
| `OAuthAccountStore` | type | 계정 저장 포트 인터페이스 |
| `OAuthUserRow` | type | 사용자 행 타입 |
| `OAuthTokens` | type | 토큰 교환 결과 |
| `OAuthUserInfo` | type | 제공자 사용자 정보 |
| `ExchangeCodeOptions` | type | 코드 교환 옵션 |

## 의존

- 내부: [[backend-database]] (`@repo/backend-database`), [[shared-errors]] (`@repo/errors`)
- 외부: `drizzle-orm` (계정 쿼리), `undici` (HTTP 토큰/유저정보 요청)

## 사용 예

```ts
import { generateCodeVerifier, generateCodeChallenge, exchangeCode } from "@repo/backend-auth-oauth";

const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);
// 인가 URL에 challenge 추가 후 redirect...
const tokens = await exchangeCode({ provider: "google", code, verifier, redirectUri });
```

## 연결된 개념

- [[explainers/auth/oauth-pkce-flow]] — PKCE 흐름 시퀀스 다이어그램
- [[adr/0006-auth-strategy]] — 소셜 로그인 전략 결정
- [[adr/0013-session-lifecycle]] — OAuth 세션 연동
- [[adr/0014-auth-security-baseline]] — state·PKCE 보안 기준

> 소스: spec-07-01 · `packages/backend/auth-oauth/src/`
