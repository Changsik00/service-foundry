# Auth Foundation — Architecture Design Note

> **본 문서는 *방향성 + 플로우 + 예시 코드*를 박는 design note입니다.**
> *결정의 권위*는 ADR-0006 / 0012 / 0013 / 0014에 있습니다. 본 문서는 *실행 시 참조 자료*.
>
> **Source**: 2026-05-18 사용자 자문 2차안 (Node.js 기반 Monorepo Auth Foundation Architecture Proposal).
> **채택 시점**: spec-x-auth-foundation-prep.

---

## 📑 ADR Cross-ref

각 결정이 어느 ADR에 박혔는지:

| 영역 | ADR | 본 design note §section |
|---|---|---|
| Backend Framework + ORM | [ADR-0005](../adr/0005-backend-framework-and-orm-strategy.md) | §추천 기술 스택 |
| Auth Platform 전략 | [ADR-0006](../adr/0006-auth-strategy.md) | §핵심 철학 / §전체 구조 / §Provider 패키지 설계 원칙 |
| Error Architecture | [ADR-0012](../adr/0012-auth-error-normalize.md) | §Error Architecture |
| Session Lifecycle | [ADR-0013](../adr/0013-session-lifecycle.md) | §Session 전략 / §JWT 구체 결정사항 |
| Security Baseline | [ADR-0014](../adr/0014-auth-security-baseline.md) | §보안 기본기 / §Cookie 전략 / §OAuth 전략 |

## 📅 Phase 매핑

각 패키지/패턴이 어느 phase에 박힐지:

| Phase | 산출물 |
|---|---|
| phase-02 (완료) | `@repo/auth-contracts` 핵심 4 schema (Role / User / Session / JwtPayload) |
| phase-05 | auth-contracts 확장 + auth-session + auth-jwt + auth-security + password reset/email verify flow |
| phase-06 | auth-nestjs + auth-react + Cookie 전략 + Audit & Events |
| phase-07 | auth-oauth + auth-mfa + auth-passkey |
| phase-08 | auth-firebase + auth-supabase + auth-testing |
| phase-09 | apps/admin + admin tools |
| phase-10 | Auth observability dashboards + key rotation script |

---

# 목표

단순 로그인 라이브러리가 아니라:

```txt
Internal Identity Platform
```

수준의 구조를 목표로 함. 핵심 목표:

* Provider별 깔끔하게 wrap된 SDK 배포
* Client 코드는 어떤 Provider든 동일한 패턴
* Validation 공유 (FE/BE)
* Error 형태 통일
* Session / RBAC / OAuth 정책 통일
* Multi App 대응
* Monorepo 최적화

---

# 핵심 컨셉

한 앱은 한 Provider 만 사용한다.

각 Provider 는 별도 SDK 패키지로 배포되며, 패키지 모양 · 에러 형태 · React Hook · Nest Guard 가 어떤 Provider 를 골라도 일관되도록 한다.

```txt
"런타임 추상화" 가 아니라
"패키지 일관성 (Consistent Wrapped SDK)" 이 목표
```

---

# 핵심 철학

## 1. Auth Engine 은 외부 라이브러리 사용 (직접 구현 ❌)

* JWT 알고리즘 (jose)
* OAuth / OIDC protocol
* Password crypto (argon2)
* WebAuthn protocol (@simplewebauthn)
* Provider SDK (firebase-admin / supabase-js)

## 2. Auth Platform 은 직접 구축 (직접 구현 ✅)

* 패키지 일관성 (Core Surface)
* Session lifecycle
* Error normalize
* RBAC
* Contracts
* FE/BE integration
* Audit & Events
* Security policy
* Observability

---

# 전체 구조

```txt
apps/
  web/
  admin/
  api/

packages/

  # 공통 (모든 Provider 가 공유)
  shared/auth-contracts/   (phase-02 박힘, phase-05 확장)
  backend/auth-session/    (phase-05)
  backend/auth-jwt/        (phase-05)
  backend/auth-security/   (phase-05)
  backend/auth-nestjs/     (phase-06)
  backend/auth-oauth/      (phase-07)
  backend/auth-mfa/        (phase-07)
  backend/auth-passkey/    (phase-07)
  frontend/auth-react/     (phase-06)
  auth-testing/            (phase-08)

  # Provider SDK (앱은 이 중 하나 선택 — Native JWT가 default)
  auth-firebase/           (phase-08)
  auth-supabase/           (phase-08)
```

> `auth-errors` 별 패키지 ❌ — `@repo/errors` (phase-02)에 AuthErrorCode 흡수 (ADR-0012).

---

# 가장 중요한 설계 원칙

## Authentication vs Authorization 분리

### Authentication ("너 누구냐")

```ts
user.id
email
provider
```

### Authorization ("무엇을 할 수 있냐")

```ts
roles
permissions
```

---

## Identity vs Session 분리

### Identity ("사용자 자체")

```ts
AuthUser {
  id
  email
  provider
  providerUserId
  emailVerified
  mfaEnabled
}
```

### Session ("현재 로그인 상태")

```ts
Session {
  id
  userId
  accessToken      // JWT
  refreshTokenId   // DB 참조
  device
  ip
  userAgent
  expiresAt
  createdAt
}
```

---

# Provider 패키지 설계 원칙

## Lowest Common Denominator 함정 피하기

단일 `AuthProvider` 인터페이스로 모든 Provider 를 묶지 않는다.

이유:

* Firebase 의 custom claims, App Check, multi-tenant
* Supabase 의 RLS, magic link, OTP
* Native JWT 의 자체 운영 권한

이런 강점을 죽이지 않기 위해:

```txt
각 Provider 패키지는 자기 Provider 의 모든 기능을 노출 가능.
다만 일관되게 권장되는 "Core Surface" 가 존재한다.
```

## Core Surface

모든 `auth-{provider}` 패키지가 동일한 모양으로 노출하는 최소 인터페이스.

```ts
export interface AuthSDK {
  signUp(input: SignUpInput): Promise<AuthResult>
  signIn(input: SignInInput): Promise<AuthResult>
  signOut(): Promise<void>

  getCurrentUser(): Promise<AuthUser | null>

  refresh(): Promise<Session>

  resetPassword(email: string): Promise<void>
  updatePassword(input: UpdatePasswordInput): Promise<void>

  onAuthStateChange(
    cb: (user: AuthUser | null) => void,
  ): Unsubscribe
}

export type AuthResult =
  | { kind: 'session', session: Session }
  | { kind: 'mfa_required', challengeId: string, methods: MfaMethod[] }
  | { kind: 'email_verification_required', userId: string }
```

이게 `auth-react` 와 `auth-nestjs` 가 의존하는 *최소 인터페이스*.

## Provider 별 확장 자유

```ts
// auth-firebase
import { createFirebaseAuthSDK } from '@repo/auth-firebase'

const auth = createFirebaseAuthSDK(config)

auth.signIn(...)                  // Core Surface
auth.firebase.setCustomClaims     // Firebase 전용
auth.firebase.appCheck            // Firebase 전용
```

```ts
// auth-supabase
import { createSupabaseAuthSDK } from '@repo/auth-supabase'

const auth = createSupabaseAuthSDK(config)

auth.signIn(...)                  // Core Surface
auth.supabase.rls                 // Supabase 전용
```

```ts
// auth-jwt
import { createJwtAuthSDK } from '@repo/auth-jwt'

const auth = createJwtAuthSDK({ db, jwks })

auth.signIn(...)                  // Core Surface
auth.admin.revokeAllSessions(userId)
```

**효과**:

* Client 코드는 어떤 SDK 든 같은 패턴으로 시작
* 필요할 때 Provider 의 강점에 직접 접근
* Runtime 추상화의 함정 없음
* 한 앱이 두 Provider 를 동시에 쓸 일이 없으니 LCD 비용 0

---

# Validation 전략

## Contract-First

`@repo/auth-contracts` 가 Single Source of Truth.

```ts
// packages/shared/auth-contracts/src/sign-in.ts
import { z } from 'zod'

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type SignInInput = z.infer<typeof SignInSchema>
```

## Frontend

```ts
import { SignInSchema } from '@repo/auth-contracts'

useForm({ resolver: zodResolver(SignInSchema) })
```

## Backend

```ts
import { SignInSchema } from '@repo/auth-contracts'

@Post('/auth/signin')
@UsePipes(new ZodValidationPipe(SignInSchema))
signIn(@Body() input: SignInInput) {}
```

---

# Error Architecture

> **결정의 권위**: [ADR-0012](../adr/0012-auth-error-normalize.md).

## 원칙: Provider Error 직접 노출 금지

```txt
FirebaseError 직접 노출 ❌
SupabaseError 직접 노출 ❌
```

## 정규화된 에러 코드 (`@repo/errors` 흡수)

```ts
// @repo/errors의 도메인 코드 (ADR-0012 Decision 1)
type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'SESSION_REVOKED'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'EMAIL_NOT_VERIFIED'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID_CODE'
  | 'INSUFFICIENT_PERMISSION'
  | 'TOO_MANY_ATTEMPTS'
  | 'ACCOUNT_LOCKED'
  | 'PROVIDER_ERROR'

// 사용
import { AppError } from '@repo/errors'
throw new AppError({ code: 'INVALID_CREDENTIALS', statusCode: 401 })
```

## Provider Normalize (각 패키지 내부)

```ts
// packages/auth-firebase/src/normalize.ts
const normalizeFirebaseError = (e: FirebaseError): AppError => {
  switch (e.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new AppError({ code: 'INVALID_CREDENTIALS', ... })
    // ...
  }
}
```

```txt
firebase auth/user-not-found   →  INVALID_CREDENTIALS
firebase auth/wrong-password   →  INVALID_CREDENTIALS  (enumeration 방지)
supabase invalid_jwt           →  INVALID_TOKEN
```

## Account Enumeration 방지

```txt
위험
  EMAIL_NOT_FOUND
  PASSWORD_WRONG
  → 공격자에게 계정 존재 여부 노출

안전
  INVALID_CREDENTIALS
  → 존재 여부 숨김
```

---

# Session 전략

> **결정의 권위**: [ADR-0013](../adr/0013-session-lifecycle.md).

## 토큰 구조

```txt
Access Token
  - JWT (stateless)
  - 5~15분
  - 짧게

Refresh Token
  - 랜덤 32+ bytes (opaque, JWT 아님)
  - DB 저장 (SHA-256 hashed)
  - 14~30일
  - rotation 지원
  - revocation 가능
```

## Refresh Token Rotation + Reuse Detection (필수)

> RFC 6819 권고. 이거 없으면 rotation 의 의미가 절반 사라짐.

```txt
정상 흐름
  refresh 요청
    ↓ 기존 refresh 즉시 invalidate
  새 refresh 발급 (같은 family)

탈취 감지
  이미 invalidate 된 refresh 가 다시 들어옴
    ↓
  해당 user 의 모든 session 강제 종료 + alert + 알림 이메일
```

## Session 모델

```ts
Session {
  id: string
  userId: string

  refreshTokenHash: string     // 평문 저장 금지
  refreshTokenFamily: string   // rotation chain 추적

  device: string
  ip: string
  userAgent: string
  geo?: string

  createdAt: Date
  lastUsedAt: Date
  expiresAt: Date
  revokedAt?: Date
  revokedReason?: string
}
```

## 운영 가치

* 모든 기기 로그아웃
* 특정 세션 종료
* 보안 감사
* 탈취 자동 대응

---

# JWT 구체 결정사항

> **결정의 권위**: [ADR-0013](../adr/0013-session-lifecycle.md) Decision 2~3, 7.

## Algorithm

```txt
HS256       ❌  key 공유 = compromise 시 치명적
RS256       △  안정
ES256       △  키 짧음
EdDSA       ✅  추천 (빠르고 키 짧고 안전)
```

라이브러리: [jose](https://github.com/panva/jose)

## Key Rotation

```txt
signing key 1 (current)
verifying keys [previous N] (grace period)

/.well-known/jwks.json 노출
→ 다른 서비스가 JWKS 로 검증
```

Rotation 주기 90일 권장.

## Claims

* 필수: `sub`, `iat`, `exp`, `iss`, `aud`
* 권장: `jti` (revocation 용)
* 금지: PII (이름, 전화번호, 주소)
* 조건부: `roles`, `permissions` (token 크기 관리)

## Access Token Revocation

```txt
Option A — Short TTL only (5~15분)
  → revocation list 없이 운영 가능

Option B — jti deny list (Redis, short TTL)
  → 즉시 무효화 필요한 경우만
```

Refresh token 은 무조건 DB 추적.

---

# 보안 기본기

> **결정의 권위**: [ADR-0014](../adr/0014-auth-security-baseline.md).

## CSRF 보호

```txt
SameSite=Lax        cross-site POST 차단 (필요조건)
Origin/Referer 검증  state-changing 요청에 강제
또는 double-submit cookie (옵션)
```

## Rate Limiting

```txt
IP 기반          per IP per minute
Account 기반     per email per minute
Progressive      1s → 2s → 4s → 8s ...
```

`@repo/auth-security` 패키지 + NestJS interceptor.

## Account Lockout

```txt
N 회 실패 시 lockout
응답은 동일하게 유지 (enumeration 방지)
unlock: 시간 경과 또는 이메일 인증
```

## OAuth PKCE + State (강제)

* PKCE 모든 OAuth flow 에 적용 (RFC 9700)
* State parameter CSRF 방지
* Nonce (OIDC) replay 방지

---

# 핵심 플로우

## 비밀번호 재설정

```txt
1. /auth/password/reset (email 제출)
2. 응답은 항상 200 (enumeration 방지)
3. 등록된 email 이면 reset token 발급
   - cryptographically random
   - single-use
   - 15분 TTL
4. /auth/password/reset/confirm
5. 완료 후 모든 active session invalidate
6. 알림 이메일 ("내가 안 했음" 링크 포함)
```

## 이메일 검증

```txt
가입 직후 verification token 발급 (single-use, 24h TTL)
미검증 계정의 권한 제한 정책 정의
N일 미검증 시 cleanup
```

## Step-up Authentication

```txt
민감한 작업 (비밀번호 변경 / 이메일 변경 / 결제정보 변경 / MFA 등록/해제)
  → 직전에 비밀번호 또는 MFA 재인증 강제
```

## Session Fixation

```txt
로그인 성공 시 session ID / refresh token 재발급
(JWT 만 쓰면 자연적으로 OK)
```

---

# MFA / Passkey

> 처음부터 인터페이스에 자리 만들어두기 (ADR-0006 Decision 3).

## AuthResult 분기

```ts
type AuthResult =
  | { kind: 'session', session: Session }
  | { kind: 'mfa_required', challengeId: string, methods: MfaMethod[] }
```

## MFA 종류

```txt
TOTP        Google Authenticator, Authy
WebAuthn    Passkey, Security Key
SMS         비추천 (SIM swap)
Email OTP   fallback 정도
```

## Passkey (적극 권장)

2026 표준 방향. 비밀번호 없이도 인증 가능.
`@repo/auth-passkey` 패키지 (phase-07).

라이브러리: [@simplewebauthn](https://simplewebauthn.dev)

---

# 권한 시스템

## 시작: RBAC

```ts
Role {
  id, name
  permissions: Permission[]
}

UserRole {
  userId
  roleId
  scope?: string   // 'web' | 'admin' | 'api' 또는 tenantId
}
```

## Permission 평가 위치

```txt
Backend Guard         보안 경계 (절대 신뢰)
Frontend hide/show    UX 용 (보안 아님)
DB row-level          multi-tenant / RLS 필요 시
```

## ABAC 는 나중

도입 시 직접 구현 ❌

* [CASL](https://casl.js.org)
* [Oso](https://www.osohq.com)

---

# Frontend 통합 (`@repo/auth-react`)

```ts
import { AuthProvider, useAuth } from '@repo/auth-react'
import { createJwtAuthSDK } from '@repo/auth-jwt'
// 또는 createFirebaseAuthSDK / createSupabaseAuthSDK

const sdk = createJwtAuthSDK({ apiUrl })

<AuthProvider sdk={sdk}>
  <App />
</AuthProvider>
```

```ts
// 어디서든
const {
  user,
  signIn,
  signOut,
  isLoading,
} = useAuth()
```

핵심: **SDK 만 바꾸면 나머지 코드는 그대로.**

```txt
auth-react/
  provider/
  hooks/
    useAuth
    useSession
    useMfaChallenge
  guards/
    RequireAuth
    RequireRole
  oauth/
```

---

# Backend 통합 (`@repo/auth-nestjs`)

```ts
@UseGuards(AuthGuard)
@Roles('admin')
@Controller('users')
class UsersController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {}
}
```

마찬가지로 SDK 만 바꾸면 됨.

---

# API 설계

## 기본

```txt
POST   /auth/signup
POST   /auth/signin
POST   /auth/signout

POST   /auth/refresh

POST   /auth/password/reset
POST   /auth/password/reset/confirm
POST   /auth/password/change

POST   /auth/email/verify/request
POST   /auth/email/verify/confirm

POST   /auth/mfa/enroll
POST   /auth/mfa/verify

GET    /auth/me
GET    /auth/sessions
DELETE /auth/sessions/:id
DELETE /auth/sessions          # all-sign-out
```

## OAuth

```txt
GET /auth/oauth/:provider           # redirect
GET /auth/oauth/:provider/callback
```

## Discovery

```txt
GET /.well-known/jwks.json
```

---

# Cookie 전략

> **결정의 권위**: [ADR-0014](../adr/0014-auth-security-baseline.md) Decision 6.

```txt
httpOnly       ✅
secure         ✅
sameSite=lax   ✅ (가능하면 strict)
path=/
```

```txt
localStorage JWT   ❌  XSS 위험
```

## Cookie Scope

```txt
.example.com         모든 subdomain 공유 (자연 SSO)
app.example.com      격리 (admin/web 분리)
```

처음엔 root domain 공유로 시작, 필요 시 OIDC server 로 evolve.

---

# OAuth 전략

> **결정의 권위**: [ADR-0014](../adr/0014-auth-security-baseline.md) Decision 4.

## Frontend-only OAuth 절대 금지

```txt
Frontend OAuth
  ↓ authorization code + PKCE
Backend Verify (Provider 의 token endpoint 호출)
  ↓
Internal Session Issue
  ↓
httpOnly Cookie
```

## 필수 체크리스트

* PKCE
* State parameter (cookie-bound)
* Nonce (OIDC)
* redirect_uri allowlist
* Provider token 은 Backend 에서만 보관

---

# Auth Event System

처음부터 넣을 것.

```ts
type AuthEvent =
  | { type: 'SIGNED_IN', userId, sessionId, ip, device }
  | { type: 'SIGNED_OUT', sessionId }
  | { type: 'TOKEN_REFRESHED', sessionId }
  | { type: 'PASSWORD_CHANGED', userId }
  | { type: 'LOGIN_FAILED', email, ip, reason }
  | { type: 'SESSION_REVOKED', sessionId, reason }
  | { type: 'MFA_ENROLLED', userId, method }
  | { type: 'SUSPICIOUS_ACTIVITY', userId, signal }
```

연결 가능: analytics, audit, security alerting, notifications.

---

# Audit Log

```ts
AuthAuditLog {
  id
  userId?
  action
  ip
  userAgent
  metadata
  createdAt
}
```

요구사항:

* Append-only (UPDATE/DELETE 금지)
* 가능하면 운영 DB 와 분리된 store
* retention 정책

---

# Multi App 전략

```txt
web        일반 사용자
admin      내부 운영자
mobile     동일 user, 다른 device
internal   service-to-service
```

## 같은 user 라도 권한 격리

```ts
UserRole {
  userId
  roleId
  scope: 'web' | 'admin' | 'api'
}
```

## SSR 대응 (Next.js / Nuxt)

```txt
Cookie-based auth
```

---

# Observability

처음부터 자리 잡아둘 것. (phase-10 Ops에서 Grafana dashboard로 구현)

## Metric

```txt
auth.login.attempts
auth.login.success
auth.login.failure
auth.token.issued
auth.token.refreshed
auth.session.revoked
auth.mfa.challenged
```

## Alert

```txt
brute force 패턴
비정상 geo (impossible travel)
mass session revocation
refresh reuse 감지
```

---

# Admin Tools

`apps/admin` 또는 `@repo/auth-admin` 패키지 (phase-09).

기능:

* 사용자 검색 / 세션 조회
* 강제 로그아웃 (특정 user / 전체)
* Role 부여 / 회수
* Audit log 조회
* Provider sync 상태 (Firebase / Supabase 사용 시)

---

# 추천 기술 스택

> **결정의 권위**: [ADR-0005](../adr/0005-backend-framework-and-orm-strategy.md) + [ADR-0013](../adr/0013-session-lifecycle.md) + [ADR-0014](../adr/0014-auth-security-baseline.md).

| 영역              | 추천                                                       |
| --------------- | -------------------------------------------------------- |
| Monorepo        | [Turborepo](https://turbo.build/repo)                    |
| Package Manager | [pnpm](https://pnpm.io)                                  |
| Backend         | [NestJS](https://nestjs.com)                             |
| ORM             | [Drizzle ORM](https://orm.drizzle.team)                  |
| Validation      | [Zod](https://zod.dev)                                   |
| JWT             | [jose](https://github.com/panva/jose)                    |
| Password Hash   | [argon2](https://github.com/ranisalt/node-argon2)        |
| Query           | [TanStack Query](https://tanstack.com/query/latest)      |
| Result Pattern  | `@repo/utils` Result (ADR-0008, neverthrow 비채택)         |
| WebAuthn        | [@simplewebauthn](https://simplewebauthn.dev)            |
| Policy (ABAC)   | [CASL](https://casl.js.org) (도입 시점에 결정)                |

---

# Provider 라이브러리

| Provider       | 라이브러리                                                          |
| -------------- | -------------------------------------------------------------- |
| Firebase Admin | [firebase-admin](https://firebase.google.com/docs/admin/setup) |
| Firebase JS    | [firebase](https://firebase.google.com/docs/web/setup)         |
| Supabase       | [supabase-js](https://supabase.com/docs/reference/javascript)  |

---

# 구현 순서 (Phase 매핑)

## phase-05 — Foundation + Security

```txt
auth-contracts 확장
auth-session (rotation + reuse detection)
auth-jwt (jose EdDSA + JWKS)
auth-security (CSRF / rate limit / argon2)
password reset flow
email verify flow
```

## phase-06 — Integration

```txt
auth-nestjs (Guards + Decorators)
auth-react (Provider + hooks + guards)
Cookie 전략
Audit & Events
e2e login vertical slice
```

## phase-07 — Extension (OAuth & MFA & Passkey)

```txt
auth-oauth (PKCE + state)
auth-mfa (TOTP)
auth-passkey (WebAuthn)
```

## phase-08 — Provider Adapters

```txt
auth-firebase
auth-supabase
auth-testing
SDK swap validation
```

## phase-09 — Apps + Admin

```txt
apps/api business endpoint 확장
apps/worker
admin tools (apps/admin or auth-admin)
apps/edge-api
vertical-slice doc
```

## phase-10 — Ops (auth observability)

```txt
Prometheus metric
Grafana dashboard
Alert rules (brute force / impossible travel / refresh reuse)
Key rotation script
```

---

# 최종 핵심 요약

## 직접 구현 ✅

* 패키지 일관성 (Core Surface)
* Session lifecycle (rotation + reuse detection)
* Error normalize
* Contracts
* RBAC
* FE/BE integration
* Audit & Events
* Security policy (CSRF / rate limit / lockout / step-up)
* Observability

## 검증된 라이브러리 사용 ✅

* JWT (jose)
* OAuth / OIDC flow
* Password hash (argon2)
* WebAuthn (@simplewebauthn)
* Provider SDK (firebase-admin, supabase-js)
* ABAC engine (CASL / Oso) — 도입 시점에

## 직접 구현 금지 ❌

* JWT algorithm
* OAuth / OIDC protocol
* Password hashing
* WebAuthn protocol
* Provider 내부 동작

---

# 최종 철학

```txt
"Authentication Engine"    외부 라이브러리

"Authentication Platform"  자체 구축

"Provider SDK"             Wrapping 으로 일관된 모양 제공
                           (Runtime 추상화 ❌)
```

각 앱은 한 Provider 만 쓴다.
하지만 코드는 어떤 Provider 든 같은 패턴으로 작성된다.
