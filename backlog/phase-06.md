# phase-06: Auth Integration

> Backend + Frontend auth 통합. 2차안 §Phase 3. NestJS Guards + React Provider/hooks + Cookie 전략 + Audit/Event System.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-06` |
| **상태** | Active |
| **시작일** | 2026-05-21 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-06-auth-integration` |

## 🎯 배경 및 목표

### 현재 상황

- phase-05 완료 시 backend auth-jwt/session/security + password reset/email verify endpoint 동작.
- phase-04 완료 시 frontend ui/sdk + apps/web-* 부트.
- 본 phase는 *cross-layer* — NestJS Guards (@UseGuards / @CurrentUser) + React Provider (`useAuth` hook) + Cookie 전략 + Audit & Event System.
- ADR-0006 §"Core Surface" 컨벤션이 본 phase에서 *실제 코드*로 박힘 (auth-react가 AuthSDK interface에 의존).

### 목표 (Goal)

`@repo/auth-nestjs` (Guards + Decorators) + `@repo/auth-react` (Provider + hooks + guards) + Cookie 전략 (httpOnly/Secure/SameSite=Lax) + Audit/Event System. 본 phase 종료 시 **end-to-end login 동작** (FE form → BE → cookie → protected route).

### 성공 기준 (Success Criteria) — 정량 우선

1. `@repo/auth-nestjs` — `@UseGuards(AuthGuard)` + `@Roles(...)` + `@CurrentUser()` 동작.
2. `@repo/auth-react` — `<AuthProvider sdk={sdk}>` + `useAuth()` hook + `<RequireAuth>` / `<RequireRole>` guard.
3. Cookie 전략 ADR-0014 준수 (httpOnly + Secure + SameSite=Lax).
4. Audit & Event System — 8 이벤트(SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / PASSWORD_CHANGED / LOGIN_FAILED / SESSION_REVOKED / MFA_ENROLLED / SUSPICIOUS_ACTIVITY) 발행 + audit log DB 저장.
5. E2E: web-next에서 signin → cookie 발급 → protected route 호출 → signout 동작.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-06-01` | auth-nestjs | P? | Merged | `specs/spec-06-01-auth-nestjs/` |
| `spec-06-02` | auth-react | P? | Merged | `specs/spec-06-02-auth-react/` |
| `spec-06-03` | cookie-strategy | P? | Merged | `specs/spec-06-03-cookie-strategy/` |
| `spec-06-04` | audit-event-system | P? | Merged | `specs/spec-06-04-audit-event-system/` |
<!-- sdd:specs:end -->

### spec-06-01 — auth-nestjs

- **요점**: NestJS module + Guards (`AuthGuard` / `RolesGuard`) + Decorators (`@Roles` / `@CurrentUser`).
- **참조**: ADR-0006 (Core Surface AuthSDK 의존).
- **연관 모듈**: `packages/backend/auth-nestjs`

### spec-06-02 — auth-react

- **요점**: React Provider + `useAuth` / `useSession` / `useMfaChallenge` hooks + `<RequireAuth>` / `<RequireRole>` guards.
- **참조**: ADR-0006 — *SDK 만 바꾸면 코드 그대로* 패턴.
- **연관 모듈**: `packages/frontend/auth-react`

### spec-06-03 — cookie-strategy

- **요점**: httpOnly + Secure + SameSite=Lax cookie 발급 + 검증 미들웨어. Cookie scope(root domain vs app-specific) 결정 + 문서화.
- **참조**: ADR-0014.
- **연관 모듈**: apps/api + auth-nestjs

### spec-06-04 — audit-event-system

- **요점**: 8 AuthEvent + audit log DB 저장 (append-only) + emitter pattern.
- **참조**: design note §Auth Event System / §Audit Log.
- **연관 모듈**: `packages/backend/auth-audit` 또는 auth-session 내부

### spec-06-05 — e2e-login-vertical-slice

- **요점**: apps/web-next에서 signin → cookie → protected route 호출 → signout. playwright E2E 또는 manual 검증.
- **연관 모듈**: apps/web-next + apps/api

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Cookie scope | root domain / app-specific | 진입 시 결정 | SSO 필요 vs 격리 trade-off. ADR-0014 §Cookie Scope 가이드 |
| Audit log DB | 동일 PostgreSQL / 별 store | 동일 PostgreSQL 시작 | YAGNI. retention 정책 정의 + 별 store는 운영 시점 결정 |
| Audit log 패키지 | `auth-audit` 별 / auth-session 흡수 | 진입 시 결정 | 응집 vs 분리 trade-off |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: end-to-end login

- **Given**: 전 spec 머지됨.
- **When**: web-next signin form 제출.
- **Then**: cookie 발급 + protected route 200 + signout 후 401.
- **연관 SPEC**: spec-06-05

### 시나리오 2: NestJS Guards

- **Given**: spec-06-01 머지됨.
- **When**: protected endpoint를 `@UseGuards(AuthGuard) @Roles('admin')`로 보호.
- **Then**: 인증 안 된 요청 401 / role 없는 사용자 403 / admin 사용자 200.
- **연관 SPEC**: spec-06-01

### 시나리오 3: Audit event

- **Given**: spec-06-04 머지됨.
- **When**: signin / signout / password reset 호출.
- **Then**: audit log DB에 해당 이벤트 append.
- **연관 SPEC**: spec-06-04

## 🔗 의존성

- **선행 phase**: phase-04 (frontend foundation) + phase-05 (auth core+security).
- **외부 시스템**: PostgreSQL.
- **연관 ADR**: 0006 / 0013 / 0014
- **연관 design note**: `docs/notes/auth-foundation-architecture.md`

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-06-01 ~ spec-06-05) main에 merge
- [ ] 성공 기준 5개 충족
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인
