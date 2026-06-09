# Walkthrough: spec-18-01 — AuthGuard verifier-pluggable 리팩터

## 개요

`AuthGuard`가 JWT 검증 로직을 직접 수행하던 구조를 `AccessTokenVerifier` 인터페이스로 추상화했다.
기존 native 검증 로직은 `NativeVerifier`로 추출했고, `AuthGuard`는 DI로 주입된 verifier에만 의존한다.
spec-18-02·03에서 Firebase·Supabase verifier를 구현할 때 `AuthGuard` 코드를 건드리지 않아도 된다.

## 커밋 요약

| # | 커밋 해시 | 내용 |
|---|---|---|
| 1 | 223e031 | `test(spec-18-01)`: NativeVerifier 단위 테스트 + 스텁 (Red) |
| 2 | dc8641b | `refactor(spec-18-01)`: NativeVerifier 구현 (Green) |
| 3 | 52cf5d9 | `refactor(spec-18-01)`: AuthGuard verifier DI 주입 리팩터 + 모듈 배선 |

## 핵심 변경

### 신규: `packages/nestjs/auth/src/verifier.ts`

```
VerifiedIdentity       — { sub, role: string, orgId: string | null }
AccessTokenVerifier    — interface { verify(token): Promise<VerifiedIdentity> }
ACCESS_TOKEN_VERIFIER  — DI 심볼
NativeVerifier         — implements AccessTokenVerifier (기존 verifyAccessToken 로직 이동)
```

`NativeVerifier.verify()`는 keyStore lazy-getter 처리, `ACTIVE_ORG_CLAIM` 상수 사용, role 문자열 검증을 그대로 수행한다. `AuthGuard`로 반환 후 `Role.safeParse()`로 타입을 확정한다.

### 변경: `auth.guard.ts`

- `@Inject(NESTJS_AUTH_OPTIONS) opts` → `@Inject(ACCESS_TOKEN_VERIFIER) verifier`
- `canActivate` 내 검증 블록 → `verifier.verify(token)` 한 줄 + `Role.safeParse(identity.role)`
- `NESTJS_AUTH_OPTIONS` · `NestjsAuthOptions` export는 유지 (backward-compat)

### 변경: `module.ts`

- `forRoot`: `ACCESS_TOKEN_VERIFIER → new NativeVerifier(opts)` provider 추가
- `forRootAsync`: `inject: [NESTJS_AUTH_OPTIONS]` factory로 `NativeVerifier` 생성

### 변경: `apps/api/src/auth/auth.module.ts`

```typescript
{
  provide: ACCESS_TOKEN_VERIFIER,
  inject: [NESTJS_AUTH_OPTIONS],
  useFactory: (opts: NestjsAuthOptions) => new NativeVerifier(opts),
},
```

## 검증 결과

| 게이트 | 결과 |
|---|---|
| `@repo/nestjs-auth test` | 18/18 PASS |
| `@apps/api test` (단위·통합) | PASS (tenant-isolation.http e2e — DB 미기동 pre-existing) |
| biome lint | PASS |
| typecheck (turbo) | PASS |

## 이후 단계

- **spec-18-02**: `packages/nestjs/auth-firebase` — `FirebaseVerifier implements AccessTokenVerifier`
- **spec-18-03**: `packages/nestjs/auth-supabase` — `SupabaseVerifier implements AccessTokenVerifier`
- **spec-18-04**: `AUTH_MODE` 환경변수 → 조건부 모듈 로딩
