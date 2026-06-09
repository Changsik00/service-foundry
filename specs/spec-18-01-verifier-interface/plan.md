# Implementation Plan: spec-18-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-18-01-verifier-interface`
- 시작 지점: `main`
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `AuthGuard` 생성자 서명 변경: `NestjsAuthOptions` → `AccessTokenVerifier` — apps/api auth.module.ts에 NativeVerifier provider 추가 배선 필요

> [!WARNING]
> - [ ] `auth.guard.test.ts`의 `new AuthGuard(opts)` → `new AuthGuard(new NativeVerifier(opts))` 로 수정됨 (동작은 동일)

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
[현재]
AuthGuard(@Inject NESTJS_AUTH_OPTIONS)
  └─ verifyAccessToken(token, keyStore, {issuer, audience})
     └─ Role.parse + orgId 추출

[변경 후]
NativeVerifier(NestjsAuthOptions)          ← 기존 로직 추출
  └─ verifyAccessToken(token, ...)
     └─ Role.parse + orgId 추출

AuthGuard(@Inject ACCESS_TOKEN_VERIFIER)   ← 인터페이스만 의존
  └─ verifier.verify(token) → VerifiedIdentity

auth.module.ts (apps/api)
  ├─ NESTJS_AUTH_OPTIONS provider (기존 유지)
  └─ ACCESS_TOKEN_VERIFIER → NativeVerifier(opts) (신규 추가)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **AccessTokenVerifier** | `packages/nestjs/auth/src/verifier.ts` 신규 파일 | guard와 분리, spec-18-02/03에서 재사용 |
| **NativeVerifier 위치** | 동일 파일(`verifier.ts`) | 인터페이스와 기본 구현을 한 곳에서 관리 |
| **NESTJS_AUTH_OPTIONS** | 유지 (apps/api auth.module.ts가 여전히 사용) | NativeVerifier의 생성자 인수로 활용 |
| **AuthGuard 호환성** | 기존 test를 `new AuthGuard(new NativeVerifier(opts))`로 조정 | DI 토큰 교체에 따른 불가피한 변경, 동작 동일 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [packages/nestjs/auth]

#### [NEW] `packages/nestjs/auth/src/verifier.ts`

`VerifiedIdentity` 타입, `AccessTokenVerifier` 인터페이스, `ACCESS_TOKEN_VERIFIER` DI 토큰, `NativeVerifier` 구현체.

```typescript
export type VerifiedIdentity = {
  sub: string;
  role: string;      // raw string — AuthGuard가 Role.safeParse로 검증
  orgId: string | null;
};

export interface AccessTokenVerifier {
  verify(token: string): Promise<VerifiedIdentity>;
}

export const ACCESS_TOKEN_VERIFIER = Symbol("ACCESS_TOKEN_VERIFIER");

export class NativeVerifier implements AccessTokenVerifier {
  constructor(private readonly opts: NestjsAuthOptions) {}
  async verify(token: string): Promise<VerifiedIdentity> {
    // 기존 auth.guard.ts의 verifyAccessToken + role + orgId 추출 로직 이동
  }
}
```

#### [NEW] `packages/nestjs/auth/src/verifier.test.ts`

NativeVerifier 단위 테스트 (기존 auth.guard.test.ts의 케이스와 동일한 시나리오).

#### [MODIFY] `packages/nestjs/auth/src/auth.guard.ts`

- `@Inject(NESTJS_AUTH_OPTIONS)` → `@Inject(ACCESS_TOKEN_VERIFIER)`
- `canActivate` 내부 검증 로직 → `verifier.verify(token)` 한 줄로 교체
- `NESTJS_AUTH_OPTIONS` · `NestjsAuthOptions` import/export 유지 (backward-compat)

#### [MODIFY] `packages/nestjs/auth/src/auth.guard.test.ts`

- `new AuthGuard(opts)` → `new AuthGuard(new NativeVerifier(opts))` 로 변경
- 테스트 케이스 동작 불변

#### [MODIFY] `packages/nestjs/auth/src/module.ts`

- `forRoot(opts)`: `NativeVerifier` 인스턴스 생성 후 `ACCESS_TOKEN_VERIFIER`로 provide
- `forRootAsync(asyncOpts)`: `NestjsAuthOptions` factory 결과로 `NativeVerifier` 생성

#### [MODIFY] `packages/nestjs/auth/src/index.ts`

`AccessTokenVerifier` · `ACCESS_TOKEN_VERIFIER` · `NativeVerifier` · `VerifiedIdentity` export 추가.

#### [MODIFY] `apps/api/src/auth/auth.module.ts`

```typescript
// 추가 provider
{
  provide: ACCESS_TOKEN_VERIFIER,
  useFactory: (opts: NestjsAuthOptions) => new NativeVerifier(opts),
  inject: [NESTJS_AUTH_OPTIONS],
},
```

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter @repo/nestjs-auth test
```

### e2e 회귀 확인

```bash
pnpm --filter @apps/api test
```

### 수동 검증 시나리오

1. `pnpm --filter @repo/nestjs-auth test` → 전체 GREEN, `NativeVerifier` 케이스 포함
2. `pnpm --filter @apps/api test` → 기존 e2e 회귀 없음

## 🔁 Rollback Plan

- `git revert` 로 단순 롤백 가능 — 동작 변경 없이 리팩터만 수행하므로 사이드이펙트 없음

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
