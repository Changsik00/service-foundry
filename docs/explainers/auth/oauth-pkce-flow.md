---
difficulty: 중
aliases: ["OAuth PKCE 흐름", "OAuth PKCE Flow"]
tags: [service-foundry, explainer, auth, oauth]
---

# OAuth 2.0 PKCE + State CSRF + Provider 토큰 교환 흐름

> **대상**: 소셜 로그인 서버 흐름을 이해하려는 백엔드 개발자
> **연관 문서**: [[reference/packages/backend-auth-oauth]] · [[adr/0013-session-lifecycle]]

## 왜 필요한가

OAuth Authorization Code 흐름은 두 가지 공격에 취약하다. 첫째, `code` 가 탈취되면 토큰 교환이 가능하다(PKCE 로 방어). 둘째, CSRF 로 위조된 callback 을 처리하면 공격자의 계정이 연결된다(State 로 방어). PKCE + State 조합이 ADR-0013 의 OAuth 보안 베이스라인이다.

## 어떻게 동작하나

```mermaid
sequenceDiagram
    participant B as Browser
    participant API as apps/api
    participant P as OAuth Provider (Google/Kakao)
    participant DB as DB (oauth_accounts)

    Note over B,P: 1. 로그인 시작
    B->>API: GET /auth/oauth/google
    API->>API: code_verifier = randomBytes(32)\ncode_challenge = S256(verifier)\nstate = randomBytes(16)
    API-->>B: 302 Location: provider?response_type=code\n  &code_challenge=...&state=...\nSet-Cookie: oauth_state=<state>; httpOnly\nSet-Cookie: oauth_pkce=<verifier>; httpOnly

    Note over B,P: 2. Provider 인증
    B->>P: (사용자 로그인 + 동의)
    P-->>B: 302 /auth/oauth/google/callback?code=<code>&state=<state>

    Note over B,API: 3. Callback 처리
    B->>API: GET /auth/oauth/google/callback\n  ?code=<code>&state=<state>\nCookie: oauth_state=<stored>; oauth_pkce=<verifier>
    API->>API: timingSafeEqual(state, oauth_state cookie)
    alt state mismatch
        API-->>B: 401 Unauthorized
    end
    API->>P: POST /token { code, code_verifier, ... }
    P-->>API: { access_token, id_token, ... }
    API->>API: 사용자 정보 파싱 (providerAccountId, email)
    API->>DB: findOrCreate oauth_accounts\n{ provider, providerAccountId, userId }
    DB-->>API: userId (기존 연결 또는 신규 생성)
    API->>API: createSession(userId)\nsignAccessToken({ sub:userId, role })
    API-->>B: 200 { accessToken }\nSet-Cookie: refresh_token=<T>; httpOnly
```

### PKCE S256 계산

```
code_verifier  = crypto.randomBytes(32).toString("base64url")
code_challenge = base64url(SHA-256(code_verifier))
```

Provider 는 callback 에서 `code_verifier` 로 challenge 를 재계산해 일치 여부를 검증한다. code 만 탈취해도 `code_verifier` 없이는 토큰 교환 불가.

### oauth_accounts 계정 연결 전략

| 상황 | 처리 |
|---|---|
| 동일 provider + providerAccountId 존재 | 기존 userId 로 세션 발급 |
| 같은 email 의 local 계정 존재 | oauth_accounts row 추가 (계정 연결) |
| 신규 | users 행 생성 + oauth_accounts 연결 |

> ⚠️ OAuth provider access token 은 DB 에 저장하지 않는다 — `providerAccountId` 만으로 계정 식별. 암호화 키 관리 부담 제거.

## 용어 정리

| 용어 | 설명 |
|---|---|
| PKCE (S256) | Proof Key for Code Exchange — code 탈취 방어 |
| State | CSRF 방어용 임의값 — 쿠키와 callback parameter 비교 |
| `timingSafeEqual` | 타이밍 공격 방지를 위한 상수 시간 비교 |
| `oauth_accounts` | 소셜 계정과 users 테이블을 연결하는 join 테이블 |

## 동작/테스트 방법

> 🧪 `pnpm --filter @repo/backend-auth-oauth test` — PKCE / State / token exchange / account linking 19 tests. `pnpm --filter @apps/api test` — e2e redirect 302 + state mismatch 401 검증.

## 마치며

PKCE 와 State 가 조합되면 code 가로채기 + CSRF 두 공격을 모두 차단한다. `oauth_accounts` join 테이블로 한 사용자가 여러 소셜 계정을 연결할 수 있다.

## 연결된 개념

- [[jwt-verify-edDSA]] — OAuth 완료 후 같은 signAccessToken 사용
- [[session-rotation-chain]] — OAuth 로그인 후 세션 rotation chain 시작
- [[mfa-totp-challenge]] — OAuth 로그인 후 MFA 요구 분기 후보
- [[audit-event-bus]] — LOGIN_SUCCESS(oauth) 이벤트 emit

> 소스: spec-07-01 walkthrough · `packages/backend/auth-oauth/src/`
