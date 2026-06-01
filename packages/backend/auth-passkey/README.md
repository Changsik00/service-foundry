# @repo/backend-auth-passkey

> `@simplewebauthn/server`를 기반으로 Passkey(FIDO2/WebAuthn) 등록 옵션 생성·검증과 인증 옵션 생성·검증을 제공하는 framework-agnostic 패키지.

## 설치 / import
```ts
import { generateRegistrationOpts, verifyRegistration, generateAuthenticationOpts, verifyAuthentication } from "@repo/backend-auth-passkey";
```

## 핵심 API
- `generateRegistrationOpts({ config, userId, userName })` — 챌린지 포함 Passkey 등록 옵션 생성
- `verifyRegistration({ config, response, expectedChallenge })` — 등록 응답 서버 검증
- `generateAuthenticationOpts({ config, allowCredentials })` — Passkey 인증 옵션 생성
- `verifyAuthentication({ config, response, credential, expectedChallenge })` — 인증 응답 서명 검증

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-passkey.md`](../../../docs/reference/packages/backend-auth-passkey.md)
- 동작 원리: [`docs/explainers/auth/passkey-webauthn.md`](../../../docs/explainers/auth/passkey-webauthn.md)
