# @repo/backend-auth-jwt

> `jose` 라이브러리 기반 EdDSA(Ed25519) JWT 서명·검증과 JWKS 엔드포인트용 공개키 직렬화를 제공하는 framework-agnostic 패키지.

## 설치 / import
```ts
import { signAccessToken, verifyAccessToken, toJwks, createInMemoryKeyStore } from "@repo/backend-auth-jwt";
```

## 핵심 API
- `signAccessToken({ store, payload })` — Ed25519 키로 JWT 액세스 토큰 서명
- `verifyAccessToken({ token, store })` — JWT 검증, 실패 시 `JwtErrorCode` 반환
- `toJwks(keys)` — 공개키 목록을 JWKS JSON으로 직렬화
- `createInMemoryKeyStore({ rotate })` — 인메모리 키스토어 팩토리 (테스트: `createFakeKeyStore`)

## 자세히
- 레퍼런스: [`docs/reference/packages/backend-auth-jwt.md`](../../../docs/reference/packages/backend-auth-jwt.md)
- 동작 원리: [`docs/explainers/auth/jwt-verify-edDSA.md`](../../../docs/explainers/auth/jwt-verify-edDSA.md)
