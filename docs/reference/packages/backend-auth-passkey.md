---
type: reference
aliases: ["@repo/backend-auth-passkey", "패스키 WebAuthn 인증"]
tags: [service-foundry, reference, auth, passkey]
---

# @repo/backend-auth-passkey — WebAuthn/Passkey 등록 및 인증

> 💡 **한 줄 요약**: `@simplewebauthn/server`를 기반으로 Passkey(FIDO2/WebAuthn) 등록 옵션 생성·검증과 인증 옵션 생성·검증을 제공하는 framework-agnostic 패키지.
> **위치**: `packages/backend/auth-passkey` · **상위**: [[architecture]]

## 책임 (Responsibility)

WebAuthn 서버 사이드 처리를 담당한다. 등록 단계에서는 챌린지 포함 등록 옵션을 생성하고, 클라이언트 응답을 검증하여 자격증명을 저장한다. 인증 단계에서는 인증 옵션을 생성하고 서명 검증으로 신원을 확인한다. `StoredCredential` 타입으로 자격증명 저장 구조를 정의한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `generateRegistrationOpts` | fn | Passkey 등록 옵션 생성 |
| `verifyRegistration` | fn | 등록 응답 서버 검증 |
| `generateAuthenticationOpts` | fn | Passkey 인증 옵션 생성 |
| `verifyAuthentication` | fn | 인증 응답 서버 검증 |
| `StoredCredential` | type | 저장된 자격증명 구조 타입 |
| `PasskeyConfig` | type | RP 설정 타입 (rpId, rpName 등) |
| `RegistrationResponseJSON` | type | WebAuthn 등록 응답 JSON 타입 (re-export) |
| `AuthenticationResponseJSON` | type | WebAuthn 인증 응답 JSON 타입 (re-export) |

## 의존

- 내부: 없음
- 외부: `@simplewebauthn/server` (FIDO2/WebAuthn 서버 로직)

## 사용 예

```ts
import { generateRegistrationOpts, verifyRegistration } from "@repo/backend-auth-passkey";

const config: PasskeyConfig = { rpId: "example.com", rpName: "My App" };
const opts = await generateRegistrationOpts({ config, userId: "u1", userName: "alice" });
// opts를 클라이언트에 전달...
const { verified, registrationInfo } = await verifyRegistration({ config, response, expectedChallenge });
```

## 연결된 개념

- [[explainers/auth/passkey-webauthn]] — WebAuthn 등록·인증 시퀀스 및 챌린지 흐름
- [[adr/0006-auth-strategy]] — Passkey 인증 전략 결정
- [[adr/0014-auth-security-baseline]] — Passkey 보안 요건

> 소스: spec-07-03 · `packages/backend/auth-passkey/src/`
