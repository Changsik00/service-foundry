---
type: reference
aliases: ["@repo/backend-auth-jwt", "JWT 서명·검증"]
tags: [service-foundry, reference, auth, jwt]
---

# @repo/backend-auth-jwt — EdDSA Ed25519 JWT 서명 및 JWKS 노출

> 💡 **한 줄 요약**: `jose` 라이브러리 기반 EdDSA(Ed25519) JWT 서명·검증과 JWKS 엔드포인트용 공개키 직렬화를 제공하는 framework-agnostic 패키지.
> **위치**: `packages/backend/auth-jwt` · **상위**: [[architecture]]

## 책임 (Responsibility)

액세스 토큰 서명(`signAccessToken`), 검증(`verifyAccessToken`), 인메모리/페이크 키스토어 팩토리, JWKS 직렬화(`toJwks`)를 제공한다. NestJS DI 어댑터는 phase-06 별도 패키지로 분리된다. ADR-0013 Decision 1/2/3/7을 구현한다.

## 공개 API / export

| export | 종류 | 설명 |
|---|---|---|
| `signAccessToken` | fn | Ed25519 키로 JWT 액세스 토큰 서명 |
| `verifyAccessToken` | fn | JWT 검증 — 실패 시 `JwtErrorCode` |
| `JwtErrorCode` | enum | 검증 실패 코드 (EXPIRED, INVALID 등) |
| `toJwks` | fn | 공개키 목록을 JWKS JSON으로 직렬화 |
| `createInMemoryKeyStore` | fn | 인메모리 키스토어 팩토리 |
| `createFakeKeyStore` | fn | 테스트용 결정적 키스토어 팩토리 |
| `KeyStore` | type | 키스토어 포트 인터페이스 |
| `KeyMaterial` | type | 키 쌍 타입 |
| `PublicKeyMaterial` | type | 공개키 타입 |
| `JwtClaims` | type | JWT 페이로드 클레임 |
| `Alg` | type | 지원 알고리즘 유니언 |
| `Jwks` | type | JWKS 응답 타입 |
| `SignAccessTokenOptions` | type | 서명 옵션 |
| `SignAccessTokenPayload` | type | 서명 페이로드 입력 타입 |
| `SignedClaims` | type | 서명 결과 타입 |
| `VerifyAccessTokenOptions` | type | 검증 옵션 타입 |
| `FakeKeyStore` | type | 테스트용 결정적 키스토어 인터페이스 |
| `FakeKeyStoreInit` | type | FakeKeyStore 초기화 옵션 |
| `InMemoryKeyStore` | type | 인메모리 키스토어 인터페이스 |
| `CreateInMemoryKeyStoreOptions` | type | 인메모리 키스토어 생성 옵션 |

## 의존

- 내부: [[shared-errors]] (`@repo/errors`), [[shared-utils]] (`@repo/utils`)
- 외부: `jose` (RFC 7517/8037 EdDSA JWT 구현)

## 사용 예

```ts
import { createInMemoryKeyStore, signAccessToken, verifyAccessToken } from "@repo/backend-auth-jwt";

const store = await createInMemoryKeyStore({ rotate: false });
const { token } = await signAccessToken({ store, payload: { sub: "u1", roles: ["user"] } });
const claims = await verifyAccessToken({ token, store });
console.log(claims.sub); // "u1"
```

## 연결된 개념

- [[explainers/auth/jwt-verify-edDSA]] — EdDSA 검증 흐름 및 JWKS 캐시 전략
- [[adr/0013-session-lifecycle]] — JWT 수명 및 갱신 정책
- [[adr/0014-auth-security-baseline]] — Ed25519 채택 근거

> 소스: spec-05-03 · `packages/backend/auth-jwt/src/`
