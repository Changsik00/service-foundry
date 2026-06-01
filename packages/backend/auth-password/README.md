# @repo/backend-auth-password

> `argon2` 라이브러리로 argon2id 해싱·검증·재해싱 판단을 제공하는 framework-agnostic 비밀번호 패키지 (ADR-0014).

## 설치 / import
```ts
import { hashPassword, verifyPassword, needsRehash } from "@repo/backend-auth-password";
```

## 핵심 API
- `hashPassword(plain, options?)` — 비밀번호를 argon2id로 해싱
- `verifyPassword(plain, hash)` — 비밀번호와 해시 대조 검증
- `needsRehash(hash)` — 파라미터 변경 후 재해싱 필요 여부 판단

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-password.md`](../../../docs/reference/packages/backend-auth-password.md)
- 동작 원리: [`docs/explainers/auth/password-hash-argon2id.md`](../../../docs/explainers/auth/password-hash-argon2id.md)
