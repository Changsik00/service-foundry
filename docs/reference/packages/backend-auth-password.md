---
type: reference
aliases: ["@repo/backend-auth-password", "비밀번호 해싱 argon2id"]
tags: [service-foundry, reference, auth, password]
---

# @repo/backend-auth-password — argon2id 비밀번호 해싱 및 검증

> 💡 **한 줄 요약**: `argon2` 라이브러리로 argon2id 해싱·검증·재해싱 판단을 제공하는 framework-agnostic 패키지 (ADR-0014).
> **위치**: `packages/backend/auth-password` · **상위**: [[architecture]]

## 책임 (Responsibility)

비밀번호 해싱(`hashPassword`), 검증(`verifyPassword`), 파라미터 변경 후 재해싱 필요 판단(`needsRehash`)을 담당한다. 해싱 옵션은 `DEFAULT_OPTIONS`와 `resolveOptions`로 관리하여 파라미터 조정을 중앙화한다. NestJS 어댑터는 phase-06 별도 패키지다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `hashPassword` | fn | 비밀번호를 argon2id로 해싱 |
| `verifyPassword` | fn | 비밀번호와 해시 대조 검증 |
| `needsRehash` | fn | 파라미터 변경으로 재해싱 필요 여부 판단 |
| `DEFAULT_OPTIONS` | const | 기본 argon2id 파라미터 |
| `resolveOptions` | fn | 옵션 병합·정규화 |
| `HashOptions` | type | 해싱 파라미터 타입 |

## 의존

- 내부: [[shared-errors]] (`@repo/errors`)
- 외부: `argon2` (argon2id native 구현)

## 사용 예

```ts
import { hashPassword, verifyPassword, needsRehash } from "@repo/backend-auth-password";

const hash = await hashPassword("user-secret");
const ok = await verifyPassword("user-secret", hash);
if (needsRehash(hash)) {
  const newHash = await hashPassword("user-secret");
  // DB 업데이트
}
```

## 연결된 개념

- [[explainers/auth/password-hash-argon2id]] — argon2id 파라미터 선택 및 재해싱 전략
- [[adr/0014-auth-security-baseline]] — argon2id 채택 및 파라미터 기준
- [[adr/0006-auth-strategy]] — 인증 전략 내 비밀번호 정책

> 소스: spec-05-04 · `packages/backend/auth-password/src/`
