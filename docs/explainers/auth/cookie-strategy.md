---
difficulty: 중
aliases: ["쿠키 전략", "Cookie Auth Strategy"]
tags: [service-foundry, explainer, auth, session]
---

# Cookie 기반 인증 전략 — httpOnly + SameSite=Lax + 5 엔드포인트

> **대상**: 프런트엔드–백엔드 인증 흐름을 설계하는 개발자
> **연관 문서**: [[reference/packages/backend-auth-jwt]] · [[reference/apps/api]] · [[adr/0014-auth-security-baseline]]

## 왜 필요한가

Access token 을 localStorage 에 저장하면 XSS 로 탈취된다. `httpOnly` 쿠키로 refresh token 을 전달하면 JavaScript 가 접근할 수 없어 XSS 방어가 가능하다. `SameSite=Lax` 는 CSRF 를 1차 방어하고, HMAC-SHA256 double-submit cookie 가 2차 방어한다. Access token 은 response body 로 전달해 메모리에만 유지한다.

## 어떻게 동작하나

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant API as apps/api (AuthController)
    participant SS as SessionStore
    participant KS as KeyStore (JWT)

    Note over C,KS: 로그인
    C->>API: POST /auth/signin { email, password }
    API->>SS: createSession(userId)
    SS-->>API: { session, refreshToken }
    API->>KS: signAccessToken({ sub, role })
    KS-->>API: accessToken (EdDSA JWT)
    API-->>C: 200 { accessToken }\nSet-Cookie: refresh_token=<raw>; httpOnly; SameSite=Lax\nSet-Cookie: csrf=<hmac>; SameSite=Lax

    Note over C,KS: 보호 API 접근
    C->>API: GET /auth/me\nAuthorization: Bearer <accessToken>
    API->>KS: verifyAccessToken(token)
    KS-->>API: Result<Claims>
    API-->>C: 200 { user }

    Note over C,KS: Access token 만료 → Refresh
    C->>API: POST /auth/refresh\nCookie: refresh_token=<T1>\nX-Csrf-Token: <csrf>
    API->>API: verifyCsrfToken(secret, sessionId, csrfHeader)
    API->>SS: rotateSession(T1)
    SS-->>API: { type:"rotated", refreshToken:T2 }
    API->>KS: signAccessToken({ sub, role })
    KS-->>API: newAccessToken
    API-->>C: 200 { accessToken }\nSet-Cookie: refresh_token=<T2>; httpOnly

    Note over C,API: 로그아웃
    C->>API: POST /auth/signout\nCookie: refresh_token=<T>
    API->>SS: revokeSession(sessionId)
    API-->>C: 200\nSet-Cookie: refresh_token=; Max-Age=0\nSet-Cookie: csrf=; Max-Age=0
```

### 5 인증 엔드포인트

| 엔드포인트 | 목적 | 쿠키 변화 |
|---|---|---|
| `POST /auth/signup` | 회원가입 + 세션 즉시 발급 | refresh + csrf set |
| `POST /auth/signin` | 로그인 + 세션 발급 | refresh + csrf set |
| `POST /auth/signout` | 로그아웃 + 세션 revoke | refresh + csrf clear |
| `POST /auth/refresh` | access token 갱신 + rotation | refresh 교체 |
| `GET /auth/me` | 현재 사용자 조회 | 변화 없음 |

> ⚠️ `revokeSession` 은 fire-and-forget — cookie 삭제는 반드시 성공, DB revoke 는 best-effort.

## 용어 정리

| 용어 | 설명 |
|---|---|
| httpOnly | JavaScript 에서 접근 불가 — XSS 탈취 방어 |
| SameSite=Lax | 타 사이트 POST 요청에 쿠키 미전송 — CSRF 1차 방어 |
| Double-Submit Cookie | csrf 쿠키 + X-Csrf-Token header 일치 검증 — CSRF 2차 방어 |
| Sliding TTL | refresh token 갱신 시마다 만료 시간 연장 |

## 동작/테스트 방법

> 🧪 `pnpm --filter @apps/api test` — `auth.controller.test.ts` (8 tests) + `signin.service.test.ts` / `signup.service.test.ts`. Set-Cookie 헤더 shape, CSRF 검증, fire-and-forget signout 경로 포함.

## 마치며

refresh token 은 httpOnly 쿠키로 JS 에서 감춰지고, access token 은 메모리에만 유지된다. CSRF 이중 방어와 SameSite=Lax 조합이 웹 보안 기본 베이스라인을 형성한다.

## 연결된 개념

- [[session-rotation-chain]] — refresh cookie 가 rotation chain 의 전달 매체
- [[jwt-verify-edDSA]] — access token 발급/검증의 내부 구현
- [[auth-rate-limit-lockout]] — signin 전 CSRF + rate-limit 선행 처리
- [[audit-event-bus]] — 로그인/로그아웃 이벤트 emit

> 소스: spec-06-03 walkthrough · `apps/api/src/auth/`
