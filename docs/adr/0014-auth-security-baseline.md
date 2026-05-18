---
id: ADR-0014
type: convention
date: 2026-05-18
status: accepted
---

# ADR-0014: Auth Security Baseline — CSRF + Rate Limit + PKCE + argon2 + Cookie + Step-up

## 📚 Context

ADR-0006(Auth Platform 전략) + ADR-0013(Session Lifecycle)에서 *데이터 모델*과 *세션 흐름*은 박혔다. 본 ADR은 *프로덕션 보안 baseline*을 박는다 — 이거 없으면 production 가면 안 됨.

2차안(`docs/notes/auth-foundation-architecture.md` §보안 기본기 / §Cookie 전략 / §OAuth 전략)이 제시한 패턴 + RFC 9700 (OAuth Security Best Current Practice):

- CSRF 보호 (SameSite cookie + Origin/Referer 검증)
- Rate Limiting (IP / account / progressive backoff)
- Account Lockout (응답 동일 — enumeration 방지)
- OAuth PKCE + State + Nonce (필수)
- Password Hashing = argon2
- Cookie 전략 (httpOnly / Secure / SameSite=Lax)
- Step-up Authentication (민감 작업 시 재인증)

본 ADR이 *컨벤션으로 박음*. `@repo/auth-security` 패키지가 실제 구현 (phase-05).

## 🎯 Decision

다음 7 결정을 박는다.

### Decision 1: CSRF 보호

- **Cookie 속성**: `SameSite=Lax` (필요조건) — cross-site POST 차단.
- **Origin/Referer 검증**: state-changing 요청(POST/PUT/PATCH/DELETE)에 *강제*.
- **Double-submit cookie 패턴** (옵션): SameSite 미지원 구형 브라우저 fallback. 본 boilerplate는 *최신 브라우저 가정* → 미채택.

### Decision 2: Rate Limiting

- **3 dimension 동시 적용**:
  - **IP 기반**: per IP per minute (anonymous attack 방지)
  - **Account 기반**: per email per minute (target attack 방지)
  - **Progressive backoff**: 1s → 2s → 4s → 8s ... (linear/geometric)
- 구현: `@repo/auth-security` 패키지 — NestJS interceptor + Redis storage (또는 in-memory + 분산 환경 시 Redis).

### Decision 3: Account Lockout

- N회 실패 시 lockout (N = 5~10 환경별).
- 응답은 *항상 동일 형식* (`AppError({ code: "TOO_MANY_ATTEMPTS" })`) — *account 존재 여부 노출 ❌* (ADR-0012 enumeration 방지).
- Unlock: *시간 경과* (자동, 15~30분) 또는 *이메일 인증 링크*.
- 다만 *unlock 알림*은 *실제 계정만* (enumeration 위험 vs UX trade-off — *알림 ON* 채택 / `INVALID_CREDENTIALS` 응답과 같이 모든 *시도*는 동일 메시지).

### Decision 4: OAuth — PKCE 강제 + State + Nonce

- **PKCE (RFC 9700)**: 모든 OAuth flow에 *강제*. Public client / confidential client 구분 없음.
- **State parameter** (cookie-bound): CSRF 방지. cookie와 *서버 측 매칭* 검증.
- **Nonce** (OIDC): replay 방지. id_token의 nonce claim과 매칭.
- **redirect_uri allowlist**: server-side 등록된 URI만 허용.
- **Provider token은 BE에서만 보관**: FE는 *Internal Session*만 받음 (ADR-0006 §Internal Session Issue).

### Decision 5: Password Hashing = argon2

- 라이브러리: **argon2** (`ranisalt/node-argon2`).
- Variant: **argon2id** (default).
- Parameters: 라이브러리 default 시작 + 진입 시 *환경별 tuning* (memory cost 64 MB / iterations 3 / parallelism 1 권장).
- bcrypt / scrypt: 대안이지만 *2026 표준은 argon2*.

### Decision 6: Cookie 전략

| 속성 | 값 | 이유 |
|---|---|---|
| `httpOnly` | ✅ | JS 접근 금지 (XSS 보호) |
| `Secure` | ✅ | HTTPS only (dev에서 localhost 예외) |
| `SameSite` | `Lax` | cross-site POST 차단 + GET 허용 (UX 균형). `Strict`는 *외부 링크 클릭 시 로그아웃* UX 문제 |
| `Path` | `/` | 전 도메인 cookie (subdomain 격리 시 별도) |

- **localStorage JWT 비채택**: XSS 위험 (악성 script가 JS로 token 탈취).
- **Cookie scope**:
  - `.example.com` — 모든 subdomain 공유 (자연 SSO)
  - `app.example.com` — 격리 (admin / web 분리)
  - 본 boilerplate는 *root domain 공유*로 시작 (phase-06 결정 시점에 *환경별*로 정정 가능).

### Decision 7: Step-up Authentication

- **민감한 작업**에 *재인증 강제*:
  - 비밀번호 변경
  - 이메일 변경
  - 결제정보 변경
  - MFA 등록/해제
  - 모든 active session 강제 종료
- 방식: *직전에 비밀번호 입력 또는 MFA 재검증*.
- 구현: `auth-nestjs`의 `@StepUp({ method: 'password' | 'mfa' })` decorator (phase-06).

## ✅ Consequences

### 긍정
- **프로덕션 신뢰성**: production에 보내도 *알려진 공격 패턴* 다 막힘.
- **표준 준수**: RFC 9700 (OAuth 2.0 BCP) + 2026 best practice.
- **enumeration 방지**: account 존재 여부 노출 0건.
- **XSS / CSRF 동시 방어**: httpOnly + SameSite + Origin 검증.
- **Step-up auth**: privilege escalation 공격 회피.

### 부정 / Trade-off
- **dev 환경 friction**: HTTPS / Secure cookie / SameSite로 *로컬 dev 셋업 복잡*. 완화: `Secure=false` for localhost + tooling/docker(phase-10)에서 HTTPS proxy.
- **Rate limit false positive**: 합법 사용자가 같은 IP(회사/카페)에서 *집단적으로 시도*하면 lockout. 완화: progressive backoff + 합리적 N 설정.
- **PKCE 모든 flow 강제**: 일부 *legacy provider*가 PKCE 미지원 → 해당 provider 채택 시 *예외 처리* 별 spec.
- **argon2 memory cost**: 64MB × 동시 요청 수 = *큰 memory 사용*. 진입 시 환경별 tuning.

## 🔄 Alternatives

| 대안 | 비채택 이유 |
|---|---|
| **bcrypt** (argon2 대신) | 2026 표준은 argon2. bcrypt는 *legacy 지원*. |
| **scrypt** (argon2 대신) | argon2id가 더 *최신 + 권장*. |
| **Implicit OAuth flow** | RFC 9700에서 *deprecated*. Authorization Code + PKCE가 표준. |
| **SameSite=None** | cross-site POST 허용 = CSRF 위험. 명시적 필요 없으면 비채택. |
| **SameSite=Strict** | 외부 링크 클릭 시 로그아웃 — UX 나쁨. Lax가 균형점. |
| **Frontend-only OAuth** | Provider token이 FE에 노출 — 탈취 위험. BE verify 필수 (ADR-0006). |
| **Rate limit 없음** | brute force 무방어. production에 보내면 안 됨. |
| **Lockout 응답 다르게** (`ACCOUNT_LOCKED` 직접 노출) | enumeration. *동일 응답*이 표준. |

## 🔗 Related

- **선행**:
  - [ADR-0006](./0006-auth-strategy.md) — Auth Platform 전략 (본 ADR은 §A.3 cross-ref)
  - [ADR-0012](./0012-auth-error-normalize.md) — Account enumeration 방지 (TOO_MANY_ATTEMPTS / ACCOUNT_LOCKED 코드)
  - [ADR-0013](./0013-session-lifecycle.md) — Cookie scope + refresh token cookie 저장
- **후속**:
  - phase-05 (Auth Core+Security) — `@repo/auth-security` 패키지 구현
  - phase-06 (Auth Integration) — Cookie middleware + Step-up decorator
  - phase-07 (Auth Extension) — OAuth PKCE 실제 구현
  - phase-10 (Ops) — HTTPS dev proxy + argon2 환경별 tuning
- **외부 표준**:
  - RFC 9700 — OAuth 2.0 Security Best Current Practice
  - OWASP — Authentication Cheat Sheet
- **라이브러리**:
  - [argon2](https://github.com/ranisalt/node-argon2)
- **design note**: [`docs/notes/auth-foundation-architecture.md`](../notes/auth-foundation-architecture.md) §보안 기본기 / §Cookie 전략 / §OAuth 전략
