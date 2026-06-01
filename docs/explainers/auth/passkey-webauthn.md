---
difficulty: 고
aliases: ["Passkey WebAuthn", "패스키 인증"]
tags: [service-foundry, explainer, auth, passkey]
---

# Passkey WebAuthn — 등록·인증 Ceremony 서버 흐름

> **대상**: WebAuthn 서버 흐름을 이해하려는 백엔드 개발자
> **연관 문서**: [[reference/packages/backend-auth-passkey]] · [[adr/0013-session-lifecycle]]

## 왜 필요한가

비밀번호는 피싱과 크리덴셜 스터핑 공격에 취약하다. Passkey(WebAuthn) 는 디바이스 내 하드웨어 키를 사용해 **피싱 불가능한(phishing-resistant) 비밀번호 없는 인증** 을 제공한다. 서버는 public key 만 저장하고 challenge-response 로 소유를 검증한다.

## 어떻게 동작하나

```mermaid
sequenceDiagram
    participant B as Browser (WebAuthn API)
    participant API as apps/api (PasskeyController)
    participant PKS as PasskeyService
    participant SWA as @simplewebauthn/server
    participant DB as DB (passkey_credentials / challenges)

    Note over B,DB: 등록 (Registration Ceremony)
    B->>API: POST /auth/passkey/register/options<br/>Authorization: Bearer <accessToken>
    API->>PKS: generateRegisterOptions(userId, email)
    PKS->>SWA: generateRegistrationOptions(...)
    PKS->>DB: INSERT passkey_challenges { userId, challenge, expiresAt=+5min }
    API-->>B: { challengeToken, options }

    B->>B: navigator.credentials.create(options)<br/>(디바이스 생체인증 / PIN)
    B->>API: POST /auth/passkey/register/verify<br/>{ challengeToken, credential }
    API->>PKS: verifyRegister(userId, challengeToken, credential)
    PKS->>DB: findChallenge(challengeToken)<br/>(expiresAt > now 조건)
    PKS->>SWA: verifyRegistrationResponse(credential, challenge, rpID)
    PKS->>DB: INSERT passkey_credentials<br/>{ userId, credentialId, publicKey(base64url), counter }
    PKS->>DB: DELETE passkey_challenges
    API-->>B: 200 OK

    Note over B,DB: 인증 (Authentication Ceremony)
    B->>API: POST /auth/passkey/authenticate/options
    API->>PKS: generateAuthOptions()
    PKS->>DB: INSERT passkey_challenges { userId=null, challenge, expiresAt=+5min }
    API-->>B: { challengeToken, options }

    B->>B: navigator.credentials.get(options)<br/>(디바이스 인증)
    B->>API: POST /auth/passkey/authenticate/verify<br/>{ challengeToken, credentialId, response }
    API->>PKS: verifyAuth(challengeToken, credentialId, response)
    PKS->>DB: findChallenge + findCredential(credentialId)
    PKS->>SWA: verifyAuthenticationResponse(response, credential, challenge)
    PKS->>DB: UPDATE passkey_credentials SET counter=newCounter
    PKS->>PKS: createSession(userId) + signAccessToken
    API-->>B: { accessToken }<br/>Set-Cookie: refresh_token=<T>; httpOnly
```

### 핵심 설계 결정

| 결정 | 이유 |
|---|---|
| challenge 를 JWT 대신 DB 저장 | `gt(expiresAt, now())` 로 TTL + 재사용 방지를 DB 레벨에서 처리 |
| publicKey 를 base64url text 저장 | bytea 대신 text — Drizzle + pg 드라이버 타입 호환성 |
| rpID = issuer URL 에서 파생 | `PASSKEY_RP_ID` 환경 변수 불필요 — `jwtOpts.issuer` 에서 protocol/port 제거 |
| 등록 시 existing credentials 제외 | 디바이스 중복 등록 방지 |

> ⚠️ 실제 브라우저 crypto API 없이는 credential 생성 불가 — E2E 테스트는 옵션 요청 + bad payload 경로만 검증. 실 credential 검증은 단위 테스트에서 vi.mock 으로 커버.

## 용어 정리

| 용어 | 설명 |
|---|---|
| Ceremony | WebAuthn 표준 용어 — 등록(Registration) + 인증(Authentication) 절차 |
| rpID | Relying Party ID — WebAuthn 이 도메인 바인딩에 사용하는 식별자 |
| counter | 재생 공격 방지용 단조증가 카운터 — 검증 시 DB 값보다 커야 함 |
| challenge | 서버가 발급하는 1회용 nonce — 브라우저가 서명해 반환 |

## 동작/테스트 방법

> 🧪 `pnpm --filter @apps/api test` — `passkey.service.test.ts` (8 tests, vi.mock) + `auth.e2e.test.ts` 에 passkey 6 tests (옵션 요청 + bad payload). `@repo/backend-auth-passkey` 는 simplewebauthn 얇은 래퍼.

## 마치며

`@simplewebauthn/server` 가 WebAuthn 프로토콜 복잡성을 흡수하고, `PasskeyService` 는 challenge lifecycle 과 세션 발급에만 집중한다. DB 기반 challenge TTL 로 5분 내 미완료 ceremony 는 자동 만료된다.

## 연결된 개념

- [[mfa-totp-challenge]] — TOTP 와 함께 제공되는 2단계 인증 대안
- [[session-rotation-chain]] — 인증 성공 후 세션 rotation chain 시작
- [[jwt-verify-edDSA]] — 인증 성공 후 동일한 signAccessToken 사용
- [[audit-event-bus]] — PASSKEY_REGISTERED / PASSKEY_AUTH 이벤트 emit 후보

> 소스: spec-07-03 walkthrough · `packages/backend/auth-passkey/src/`
