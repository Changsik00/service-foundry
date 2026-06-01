---
type: reference
aliases: ["@repo/backend-auth-mfa", "MFA TOTP 백업코드"]
tags: [service-foundry, reference, auth, mfa]
---

# @repo/backend-auth-mfa — TOTP 기반 다단계 인증(MFA) 및 백업 코드

> 💡 **한 줄 요약**: `otplib`으로 TOTP 시크릿·URI 생성·검증, `bcryptjs`로 백업 코드 해싱·검증을 제공하는 framework-agnostic 패키지.
> **위치**: `packages/backend/auth-mfa` · **상위**: [[architecture]]

## 책임 (Responsibility)

사용자 MFA 등록(시크릿 생성·TOTP URI 반환)과 인증(6자리 코드 검증)을 담당한다. 일회용 백업 코드 생성·해싱·검증도 제공하여 기기 분실 시 대안 인증 경로를 확보한다. 내부 @repo 의존이 없으며 완전히 framework-agnostic이다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `generateSecret` | fn | TOTP 시크릿 문자열 생성 |
| `generateTotpUri` | fn | QR코드용 `otpauth://` URI 생성 |
| `verifyTotp` | fn | TOTP 코드 검증 (boolean 반환) |
| `generateBackupCodes` | fn | 일회용 백업 코드 배열 생성 |
| `hashBackupCodes` | fn | 백업 코드 배열 bcrypt 해싱 |
| `verifyBackupCode` | fn | 입력 코드와 해시 배열 대조 검증 |

## 의존

- 내부: 없음
- 외부: `otplib` (RFC 6238 TOTP 구현), `bcryptjs` (백업 코드 해시)

## 사용 예

```ts
import { generateSecret, generateTotpUri, verifyTotp } from "@repo/backend-auth-mfa";
import { generateBackupCodes, hashBackupCodes } from "@repo/backend-auth-mfa";

const secret = generateSecret();
const uri = generateTotpUri({ secret, account: "user@example.com", issuer: "MyApp" });
const ok = verifyTotp({ secret, token: "123456" });

const codes = generateBackupCodes(10);
const hashes = await hashBackupCodes(codes);
```

## 연결된 개념

- [[explainers/auth/mfa-totp-challenge]] — TOTP 챌린지 흐름 및 시간 창 처리
- [[adr/0006-auth-strategy]] — MFA 요건 결정
- [[adr/0014-auth-security-baseline]] — 백업 코드 해싱 기준

> 소스: spec-07-02 · `packages/backend/auth-mfa/src/`
