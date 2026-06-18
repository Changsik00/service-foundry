# spec-18-01: AuthGuard verifier-pluggable 리팩터

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-18-01` |
| **Phase** | `phase-18` |
| **Branch** | `spec-18-01-verifier-interface` |
| **상태** | Planning |
| **타입** | Refactor |
| **Integration Test Required** | no |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`packages/nestjs/auth`의 `AuthGuard`는 `NestjsAuthOptions`(keyStore · issuer · audience)를 DI로 주입받아 `verifyAccessToken`(native EdDSA JWT)을 직접 호출한다. 검증 로직이 guard 내부에 hard-coding되어 있다.

`apps/api/src/auth/auth.module.ts`는 `NESTJS_AUTH_OPTIONS` DI 토큰을 직접 provide하고 `AuthGuard`를 등록한다.

### 문제점

spec-18-02·03의 Firebase · Supabase verifier가 `AuthGuard`에 플러그인되려면 교체 가능한 인터페이스가 필요하다. 현재 구조에서는 guard 코드를 직접 수정하지 않는 한 verifier를 교체할 수 없다.

### 해결 방안 (요약)

`AccessTokenVerifier` 인터페이스와 `ACCESS_TOKEN_VERIFIER` DI 토큰을 도입한다. 기존 native 검증 로직을 `NativeVerifier` 클래스로 추출하고, `AuthGuard`가 인터페이스에만 의존하도록 리팩터한다. `apps/api/src/auth/auth.module.ts`에 `NativeVerifier` provider를 배선한다. **native 동작 불변, 외부 API breaking change 없음.**

## 📊 개념도

```mermaid
graph LR
  subgraph packages/nestjs/auth
    ATV[AccessTokenVerifier\n인터페이스]
    NV[NativeVerifier\nimplements AccessTokenVerifier]
    AG[AuthGuard\n@Inject ACCESS_TOKEN_VERIFIER]
  end
  subgraph spec-18-02/03 future
    FV[FirebaseVerifier]
    SV[SupabaseVerifier]
  end
  NV -->|implements| ATV
  FV -->|implements| ATV
  SV -->|implements| ATV
  AG -->|uses| ATV
```

## 🎯 요구사항

### Functional Requirements

1. `AccessTokenVerifier` 인터페이스 및 `VerifiedIdentity` 반환 타입이 `@repo/nestjs-auth`에서 export된다.
2. `NativeVerifier implements AccessTokenVerifier`가 제공되며, 기존 `verifyAccessToken` · role · orgId 추출 로직을 그대로 수행한다.
3. `AuthGuard`는 `ACCESS_TOKEN_VERIFIER` DI 토큰으로 주입된 verifier를 사용한다.
4. `apps/api/src/auth/auth.module.ts`에 `NativeVerifier` provider가 추가되어 기존 e2e가 회귀 없이 통과한다.
5. `NestjsAuthModule.forRoot / forRootAsync`가 내부적으로 `NativeVerifier`를 생성·등록한다.

### Non-Functional Requirements

1. 기존 `NestjsAuthOptions` · `NESTJS_AUTH_OPTIONS` 인터페이스·토큰은 유지 (backward-compat).
2. `@repo/nestjs-auth` public API에 `AccessTokenVerifier` · `ACCESS_TOKEN_VERIFIER` · `NativeVerifier` · `VerifiedIdentity`가 추가 export된다.
3. 기존 `auth.guard.test.ts` 전체 케이스 GREEN 유지.

## 🚫 Out of Scope

- Firebase · Supabase verifier 구현 (spec-18-02 · 03)
- `AUTH_MODE` 환경변수 도입 (spec-18-04)
- `apps/api` e2e 외 추가 통합 테스트

## 📑 ADR 후보

- [ ] 없음 (verifier-pluggable 구조는 ADR-0023에 이미 결정됨)

## 🔗 관련 문서

- 관련 ADR: `docs/adr/0023-auth-authority-modes.md`
- 관련 소스: `packages/nestjs/auth/src/auth.guard.ts`, `packages/nestjs/auth/src/module.ts`

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS (`pnpm --filter @repo/nestjs-auth test`)
- [ ] 기존 e2e 회귀 없음 (`pnpm --filter @apps/api test`)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-18-01-verifier-interface` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
