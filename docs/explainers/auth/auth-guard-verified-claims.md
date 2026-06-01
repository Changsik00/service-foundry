---
difficulty: 중
aliases: ["AuthGuard 검증 클레임", "Auth Guard Verified Claims"]
tags: [service-foundry, explainer, auth, jwt]
---

# AuthGuard 의 검증된 Payload 전용 사용 — footgun 수정

> **대상**: NestJS guard 와 JWT 검증 파이프라인을 이해하려는 개발자
> **연관 문서**: [[reference/packages/nestjs-auth]] · [[adr/0013-session-lifecycle]]

## 왜 필요한가

JWT header 를 `decodeJwt` (서명 검증 없음) 로 파싱하면, 공격자가 서명 없이 조작한 토큰에서 `role: "admin"` 을 읽어 권한 상승이 가능하다. 이 **footgun** 은 `verifyAccessToken` 의 `narrowClaims` 함수가 커스텀 claim (`role` 등) 을 버려, guard 가 어쩔 수 없이 `decodeJwt` 로 우회한 결과였다. spec-14-03 은 **근본 원인(verify 가 claim 손실)** 을 수정했다.

## 어떻게 동작하나

```mermaid
flowchart TD
    A[Authorization: Bearer token] --> B[AuthGuard.canActivate]

    subgraph Before — footgun
        B --> C1["verifyAccessToken(token)\n→ Result<NarrowClaims>"]
        C1 --> D1["narrowClaims = {sub,iss,aud,jti,iat,exp}\nrole 손실"]
        D1 --> E1["decodeJwt(token)\n미검증 파싱으로 role 보충"]
        E1 --> F1["req.user = {sub, role from 미검증 payload}"]
        F1 --> G1["⚠️ 권한 상승 가능"]
    end

    subgraph After — 정공법
        B --> C2["verifyAccessToken(token)\n→ Result<JwtClaims + index signature>"]
        C2 --> D2["result.value = {sub,iss,aud,jti,iat,exp, role, ...커스텀}"]
        D2 --> E2["req.user = result.value"]
        E2 --> F2["✅ 서명 검증된 payload 만 사용"]
    end
```

### 수정 내용

| 변경 대상 | Before | After |
|---|---|---|
| `JwtClaims` (backend-auth-jwt) | 6개 표준 claim 고정 타입 | `readonly [key: string]: unknown` index signature 추가 |
| `verifyAccessToken` | `narrowClaims` 로 커스텀 claim 손실 | `{ ...standardClaims, ...payload }` 로 커스텀 claim 보존 |
| `AuthGuard` (nestjs-auth) | `isOk(result)` + `decodeJwt(token)` 병행 | `result.value` 만 사용, `decodeJwt` 제거 |

### footgun 의 근본 원인

```
Guard 가 decodeJwt 를 쓴 것이 문제가 아니라,
verify 가 role 을 버려서 guard 가 decodeJwt 로 우회할 수밖에 없었던 것이 문제.
→ verify 수정 후 guard 는 자연스럽게 result.value 만 사용.
```

> ⚠️ `index signature` 추가로 `JwtClaims` 는 이제 임의 키를 허용한다. 타입 안전성은 호출자가 구체적인 타입으로 캐스팅해 유지한다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| footgun | 사용하기 쉽지만 실수하면 스스로를 해치는 API 설계 |
| `narrowClaims` | JWT payload 에서 표준 6개 claim 만 추출하는 함수 (수정 전) |
| `decodeJwt` | 서명 검증 없이 payload 를 base64 디코딩하는 함수 |
| index signature | TypeScript `[key: string]: unknown` — 임의 키를 허용하는 타입 |

## 동작/테스트 방법

> 🧪 `pnpm --filter @repo/backend-auth-jwt test` — 26개 (검증된 result 의 role 보존 단언 신규). `pnpm --filter @repo/nestjs-auth test` — auth.guard 5개 포함 (guard 가 verified role 사용, decodeJwt 제거 확인).

## 마치며

권한 결정에 사용되는 모든 claim 은 반드시 서명 검증된 payload 에서만 읽어야 한다. `verifyAccessToken` 이 커스텀 claim 을 보존함으로써 guard 는 `decodeJwt` 우회 없이 정공법으로 동작한다.

## 연결된 개념

- [[jwt-verify-edDSA]] — verifyAccessToken 의 내부 구현과 Result 반환
- [[cookie-strategy]] — AuthGuard 가 보호하는 엔드포인트 목록
- [[mfa-totp-challenge]] — MFA challenge token 도 같은 guard 경유
- [[oauth-pkce-flow]] — OAuth 완료 후 발급된 token 도 같은 guard 검증

> 소스: spec-14-03 walkthrough · `packages/nestjs/auth/src/` · `packages/backend/auth-jwt/src/`
