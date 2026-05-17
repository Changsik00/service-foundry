# ADR-006: Auth Strategy (Deferred)

* 상태: **보류** — ADR-005(백엔드 프레임워크)와 결합됨. Phase 3 스파이크에서 함께 실행됨.
* 날짜: 2026-05-17
* 결정 데드라인: ADR-005와 동일 (첫 `packages/backend/*` 스캐폴딩 전)
* Owners: Platform / Backend / Frontend
* 스코프: 신원, 인증, 세션 관리, 권한(RBAC), 계정 라이프사이클
* Audience: ADR-005가 확정될 때 이 결정을 빠르게 실행해야 하는 미래의 사람**과** AI 에이전트

---

# 1. 배경

Auth 선택은 **ADR-005에 의해 gating된다**:

| Backend pick | Idiomatic auth |
|---|---|
| NestJS | `@nestjs/passport` + `@nestjs/jwt` |
| Fastify | `better-auth` or `@fastify/jwt` |
| Hono | `better-auth` or `hono/jwt` |

Auth는 스택의 모든 부분을 건드린다:

* **Backend**: 미들웨어/가드, 토큰 검증, RBAC
* **Frontend**: 세션 hook, refresh interceptor, route guard
* **Shared**: 세션/유저/JWT payload 스키마, 에러 코드
* **Database**: user/account/session/verification 테이블
* **Security**: CSRF, rate-limit, 무차별 대입, refresh 로테이션
* **Observability**: 로그인 trace, 실패 시도 메트릭

이 ADR은 ADR-005가 해결될 때 최종 선택이 기계적이도록 알려진 모든 근거를 정리한다.

---

# 2. 결정

**DEFERRED.**

| Field | Value |
|---|---|
| Status | Deferred (ADR-005에 의해 gating됨) |
| Contingent recommendation if ADR-005 = NestJS+Drizzle | **`@nestjs/passport` + `@nestjs/jwt` + `argon2` + custom RBAC guard** |
| Contingent recommendation if ADR-005 = Fastify+Drizzle | **`better-auth`** (Drizzle adapter, Fastify plugin) |
| Contingent recommendation if ADR-005 = Hono+Drizzle | **`better-auth`** (Drizzle adapter, Hono adapter) |
| Confidence | Medium-high (contingent 매트릭스가 잘 뒷받침됨) |
| Trigger for final decision | ADR-005 스파이크와 함께 실행 |

---

# 3. 미리 잠긴 결정 (결과와 무관하게 고정)

| Pre-bound | Source |
|---|---|
| 3-package split: `shared/auth-contracts` + `backend/auth` + `frontend/auth` | ADR-003 |
| User record storage: PostgreSQL | ADR-005 |
| 세션 컨트랙트는 Zod 스키마로 공유 | Locked stack memory |
| 토큰 전략: **JWT access (short) + refresh (long) with rotation** | This ADR |
| Refresh denylist 저장: Redis (ioredis) | Locked stack memory |
| 패스워드 해싱: **argon2** (선택한 라이브러리가 강제하는 경우에만 bcrypt로 폴백) | This ADR |
| 크로스 도메인 전송: **httpOnly 쿠키 선호** (브라우저가 아닌 클라이언트는 Authorization 헤더) | This ADR |
| Auth 이벤트는 OpenTelemetry span + metric으로 발행 | Locked stack memory |
| `@repo/backend/auth`가 유일한 진입점 — 어떤 앱도 우회하지 않음 | This ADR |

---

# 4. 기능 요구 타임라인

| Feature | Day-1 | Phase 2 | Phase 3+ |
|---|---|---|---|
| Email + password login | ✅ | | |
| Refresh token rotation | ✅ | | |
| RBAC (role → permission mapping) | ✅ | | |
| Password reset (email) | ✅ (sender stubbed) | real sender | |
| Email verification | ✅ (stubbed) | real sender | |
| OAuth (Google, GitHub) | | ✅ | |
| Magic link | | ✅ | |
| WebAuthn / Passkeys | | | ✅ |
| TOTP MFA | | | ✅ |
| ABAC / CASL-style policies | | | ✅ |
| SAML / SSO | | | future |

선택된 라이브러리는 Day-1 항목 전부를 DIY 없이 커버해야 한다. Phase-2 항목은 "재빌드"가 아닌 "config 스위치"여야 한다.

---

# 5. 비교 매트릭스

| 옵션 | NestJS | Fastify | Hono | OAuth | Passkey | MFA | Magic Link | 코드량 | 락인 | 트렌드 | 비고 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **@nestjs/passport + @nestjs/jwt** | ★★★★★ (네이티브) | N/A | N/A | strategies | DIY (@simplewebauthn) | DIY | DIY | 중 | 없음 | 안정 | NestJS 사실상 표준 |
| **better-auth** | ★★★ (adapter) | ★★★★★ | ★★★★ | built-in | built-in | built-in | built-in | 적음 | 없음 | 폭발적 상승 (Lucia 후계) | TS-first, in-process |
| **Supabase Auth** | ★★★ (verifier) | ★★★ | ★★★ | built-in (GoTrue) | built-in | built-in | built-in | 매우 적음 | **큼** | 안정/대형 | 자체 hosted 가능하지만 ops 부담 |
| **Auth.js (NextAuth v5)** | ★★ | ★★★ | ★★ | 풀세트 | 약함 | 별도 | 좋음 | 중 | 약함 | Next 친화 | Vite SPA 보조 지원만 |
| **Clerk** | ★★★ | ★★★ | ★★★ | 풀세트 | 풀세트 | 풀세트 | 풀세트 | 매우 적음 | **매우 큼** (유료) | 상승 | SaaS, 학습 가치 적음 |
| **Custom JWT + argon2** | ★★★★ | ★★★★ | ★★★★ | DIY | DIY | DIY | DIY | **많음** | 없음 | N/A | 학습 가치 최고, 운영 비용 최고 |
| **GoTrue standalone** (Supabase auth만) | ★★★ | ★★★ | ★★★ | built-in | built-in | built-in | built-in | 적음 | 중 (ops) | 안정 | Supabase 락인 회피 |
| ~~Lucia~~ | DEPRECATED 2025-03 | — | — | — | — | — | — | — | — | END | 신규 채택 금지 |

## 5.1 Framework × Library 호환성 한 줄 요약

| | NestJS | Fastify | Hono |
|---|---|---|---|
| @nestjs/passport+jwt | **best fit** | impossible | impossible |
| better-auth | possible (mount handler) | **best fit** | best fit |
| Supabase Auth (as verifier) | OK | OK | OK |
| Custom JWT | OK | OK | OK |

## 5.2 업계 스냅샷 (2026-05)

| 카테고리 | 분위기 |
|---|---|
| Lucia 후계 | better-auth (사실상 합의) |
| NestJS 표준 | @nestjs/passport + @nestjs/jwt (이동 없음) |
| SaaS 채택 | Clerk 상승, Auth0 안정, Supabase 안정 |
| Self-hosted 트렌드 | better-auth + Drizzle/Prisma adapter |
| Next.js 전용 | Auth.js v5 |
| 폐기 진행 | passport.js의 일부 strategy (유지보수 정지) |

---

# 6. 저장소 아키텍처

## 6.1 필요한 테이블

대부분의 라이브러리는 다음 중 일부를 가정한다:

| Table | Purpose | Required by |
|---|---|---|
| `users` | Identity + credentials | all |
| `accounts` | OAuth provider links | better-auth, Auth.js, Clerk export |
| `sessions` | Server-side session state | better-auth (default), Supabase |
| `verifications` / `verification_tokens` | Email verify, password reset, magic link | better-auth, Auth.js |
| `refresh_tokens` (or Redis) | Refresh denylist / rotation log | DIY, @nestjs/passport |
| `mfa_secrets` | TOTP seeds | Phase 3 |
| `passkeys` / `webauthn_credentials` | Passkey credentials | Phase 3 |

NestJS+passport+jwt 경로: 모든 테이블을 우리가 소유.
better-auth: 라이브러리가 users/accounts/sessions/verifications 마이그레이션을 제공.
Supabase: 테이블은 Supabase의 `auth` 스키마에 존재; 직접 건드리지 않음.

## 6.2 Refresh token 모델

| Model | Storage | Pros | Cons |
|---|---|---|---|
| Stateless JWT refresh | Signed JWT in cookie | refresh 시 DB 조회 없음 | 개별 폐기 어려움 |
| Opaque token + DB lookup | `refresh_tokens` table | 폐기 쉬움, audit trail | refresh마다 DB hit |
| **JWT refresh + Redis denylist** ✅ | Signed JWT + Redis SET on rotate/logout | 빠름(Redis), 폐기 가능, 단순 | Redis 의존성 (이미 잠김) |

**Locked: JWT refresh + Redis denylist + 사용 시 로테이션.**

## 6.3 토큰 전송

| Transport | When |
|---|---|
| **httpOnly + Secure + SameSite=Lax cookie** ✅ | 브라우저 앱 (기본) |
| Authorization Bearer header | API 클라이언트, 모바일, SDK |
| SameSite=None (cross-site) | API와 web이 다른 registrable domain일 때만; Secure 필요 |

---

# 7. Active critique

## C1. better-auth + NestJS는 "가능"하지만 idiomatic하지 않음

better-auth는 마운트하는 request handler를 노출한다; NestJS의 Module / Provider / Guard 시맨틱에 끼워지지 않는다. NestJS를 선택했다면 NestJS를 선택한 이유였던 프레임워크 일관성 가치를 잃는다.

**함의:** ADR-005 = NestJS이면 → better-auth를 쓰지 말 것. @nestjs/passport 사용. 나중에 더 많은 기능(passkey, magic link)을 DIY해야 함을 받아들임.

## C2. Custom JWT는 6개 기능을 재구축한다는 뜻

Password reset / email verify / refresh 로테이션 / 무차별 대입 잠금 / 디바이스 추적 / OAuth 콜백. 각각 50–200 LOC에 더해 엣지 케이스(timing attack, 토큰 재사용, replay).

**함의:** Custom JWT는 "이걸 명시적으로 가르치고 싶다"는 경우에만 — 프로덕션 보일러플레이트로는 부적합.

## C3. Supabase Auth 락인은 진짜다

테이블, 패스워드 해시 포맷, 이메일 템플릿, OAuth 등록 — 전부 Supabase에 산다. 나중에 이전하려면 전부 재구축해야 함. 자체 hosted GoTrue가 중간 지점이지만 Postgres+GoTrue+SMTP ops를 떠안음.

**함의:** 프로젝트가 끝까지 Supabase 프로젝트일 때만 Supabase Auth 사용. 범용 보일러플레이트로는: 기각.

## C4. Auth.js는 Next.js 우선

Vite SPA 지원은 존재하지만 부차적. 서버사이드 패턴은 Next route handler를 가정한다.

**함의:** Auth.js는 `apps/web-vite`와 `apps/admin`을 버릴 때만 합리적. 우리는 안 버린다.

## C5. Passkey day-1 의무화는 권장을 뒤집는다

Passkey가 Day-1 요구사항(Phase 3가 아니라)이라면: better-auth는 내장. @nestjs/passport는 `@simplewebauthn/server` 수동 배선 필요(~200 LOC).

**현재 passkey는 Phase 3이므로 이 비판은 비활성.** 요구사항이 변하면 재평가.

## C6. RBAC vs ABAC

| Model | When | Library |
|---|---|---|
| **RBAC** (role → permissions) ✅ | 단순 권한을 가진 1k 유저 미만의 대부분 앱 | DIY enum + guard |
| ABAC (attributes + policies) | 멀티 테넌트, 복잡한 권한 그래프 | CASL (NestJS), oso, ts-permit |
| Hybrid | 거친 단위는 role + 리소스 레벨은 ABAC | role 기반 규칙이 있는 CASL |

**Day-1 잠금: RBAC.** ABAC 업그레이드는 가산적 — 단순하게 시작.

## C7. argon2 vs bcrypt

| Algorithm | Memory-hard | Recommended (2026) |
|---|---|---|
| **argon2id** ✅ | Yes | Yes (OWASP top pick) |
| bcrypt | No | Acceptable fallback |
| scrypt | Yes | Acceptable |
| PBKDF2 | No | Legacy only |

`@node-rs/argon2` (Rust 바인딩)은 빠르고 유지보수가 잘 됨. 선택한 라이브러리가 다른 것을 강제하지 않는 한 사용.

---

# 8. 결정 기준 프레임워크

| Criterion | Weight (1–5) | What to measure |
|---|---|---|
| Framework fit (네이티브 vs adapter) | 5 | 선택한 백엔드의 idiom에 끼워지는가? |
| Day-1 features covered without DIY | 4 | login / refresh / reset / verify / RBAC |
| Phase-2 features as config (not rewrite) | 3 | OAuth, magic link |
| Self-hosted (no SaaS dependency) | 4 | 우리 인프라에서 완전히 동작 |
| Vendor neutrality (swap cost) | 4 | 나중에 버릴 때의 마이그레이션 부담 |
| AI-friendliness (idiomatic patterns) | 4 | AI가 아는가? |
| Frontend SDK quality | 3 | React hook, refresh interceptor, route guard 에르고노믹? |
| Security defaults | 5 | CSRF, 로테이션, 잠금, secure 쿠키가 기본 내장? |
| Audit-ability | 3 | 열린 코드, audit trail 로그 |
| Onboarding cost | 2 | 첫 로그인 PR까지의 시간 |

---

# 9. 스파이크 계획 (ADR-005 스파이크와 함께 실행)

ADR-005 §9 스파이크에 추가:

| Step | Output | Time |
|---|---|---|
| `packages/shared/auth-contracts-spike` 추가: Session, User, JwtPayload zod 스키마 | 스키마 export 가능 | 1h |
| `packages/backend/auth-spike` 추가: 후보 라이브러리 + login/refresh/logout/me | curl 플로우 통과 | 4h |
| `packages/frontend/auth-spike` 추가: React provider + useSession hook + refresh interceptor + protected route | 브라우저 로그인 → 리다이렉트 → 로그아웃 동작 | 3h |
| 통합 테스트: form submit → API → Postgres → JWT → protected fetch → logout | testcontainers에서 전부 green | 2h |
| 측정: 추가된 LOC, refresh interceptor 복잡도, RBAC guard 에르고노믹 | 아래 §11에 기록 | 1h |

## 9.1 게이트 기준

| Metric | Pass threshold |
|---|---|
| 브라우저에서 전체 로그인 라운드 트립 동작 | yes |
| Refresh interceptor가 401 → refresh → retry를 깔끔히 처리 | yes |
| RBAC guard가 권한 없는 role을 거부 | yes |
| Refresh denylist(로그아웃)가 즉시 토큰 무효화 | yes |
| 패스워드 해싱이 argon2 또는 적절한 cost factor의 bcrypt 사용 | yes |
| 세션 컨트랙트가 수동 캐스트 없이 FE/BE 간 공유 | yes |
| 리포에 추가된 auth 관련 LOC | ≤ 800 (라이브러리 코드 제외) |

게이트 중 하나라도 실패 → **Custom JWT + argon2**로 폴백(완전 제어, 코드 더 많음, 그러나 라이브러리 서프라이즈 없음).

---

# 10. 아키텍처적 함의

| Chosen library | Frontend SDK | Migrations to author | RBAC mechanism | Refresh model |
|---|---|---|---|---|
| @nestjs/passport + @nestjs/jwt | DIY React hook + interceptor (~150 LOC) | `users`, `refresh_tokens` (DIY) | DIY guard + roles enum | Redis denylist (DIY) |
| better-auth | `better-auth/react` (ready) | better-auth-managed (users/accounts/sessions/verifications) | better-auth permissions API | better-auth handles |
| Supabase Auth | `@supabase/ssr` + `supabase-js` | Supabase manages | RLS + custom claims | Supabase handles |
| Custom JWT | DIY everything | DIY everything | DIY everything | DIY everything |

**시퀀싱 함의:** auth 라이브러리는 ADR-005 해결 시 잠긴다. `@repo/backend/auth`, `@repo/shared/auth-contracts`, `@repo/frontend/auth` 패키지 설계가 모두 여기서 파생된다.

---

# 11. 스파이크 결과

_스파이크(§9)가 실행되면 채워질 예정._

```
Date:
Library tested:
Framework (from ADR-005):
LOC added (auth-related):
Refresh interceptor complexity (1–5):
RBAC guard ergonomics (1–5):
FE/BE contract sharing works:
Vitest setup notes:
Decision: GO / NO-GO
Fallback chosen if NO-GO:
```

---

# 12. 재평가 트리거 (최종 결정 이후)

| Trigger | Action |
|---|---|
| 선택한 라이브러리가 deprecated/sunset (Lucia 전례) | 재평가 계획에 따라 이전 |
| 컴파일런스 요구사항(SOC2, GDPR 데이터 거주성) 충돌 | 재선택 |
| Frontend SDK가 병목(빈약한 refresh 처리, race condition) | 재고 |
| Passkey / MFA가 Phase 3에서 Day-1로 격상 | 재선택 (better-auth로 뒤집힐 가능성 큼) |
| 멀티 테넌시 요구사항 추가 | 모델 재고 (ABAC 필요할 수 있음) |

---

# 13. 결정 시점에 해결할 미해결 질문

| Question | Why it matters |
|---|---|
| 패스워드 리셋 / 검증용 이메일 sender | nodemailer+SMTP / Resend / Postmark / stub |
| "Remember me" 시맨틱 | 더 긴 refresh? device-tied refresh? |
| 활성화 시 OTP secret 저장 | Postgres 컬럼 vs Redis vs encrypted-at-rest |
| 멀티 테넌시 | 유저별 account vs 조직/팀 모델 |
| 서비스 간 auth (MSA 도래 시) | mTLS / 공유 JWT issuer / OAuth client_credentials |
| OAuth provider 순서 (Google + GitHub 먼저?) | Phase-2 스코프 |
| 쿠키 도메인 설정 | 동일 도메인 vs 크로스 도메인 API |

---

# 14. 미리 잠긴 3-package 아키텍처

선택한 라이브러리와 무관하게, 3개 패키지는 다음 책임을 가진다:

## `@repo/shared/auth-contracts`
* Zod 스키마: `SessionSchema`, `UserSchema`, `JwtPayloadSchema`
* Enum: `Role`, `Permission`
* 에러 코드: `InvalidCredentialsError`, `TokenExpiredError`, `MfaRequiredError` 등
* zod 외 런타임 의존성 없음
* 백엔드와 프론트엔드 양쪽에서 import됨

## `@repo/backend/auth`
* 프레임워크 모듈 (NestJS Module **또는** Fastify plugin) — 동일한 export API 표면
* Login / refresh / logout / me 핸들러
* JWT 발급 + 검증
* 패스워드 해싱 (argon2)
* RBAC 가드
* Refresh denylist (Redis)
* Audit 로그 emitter (OTel span + metric)

## `@repo/frontend/auth`
* Auth provider (React context)
* `useSession` / `useUser` hook
* `login` / `logout` action
* HTTP interceptor (401에서 자동 refresh)
* `<Protected>` route guard 컴포넌트
* `@repo/shared/auth-contracts`로부터 타입 재-export

---

# 15. 관련 문서

* [ADR-003](./0003-package-layout-and-naming.md) — 3-package auth split (pre-bound)
* [ADR-005](./0005-backend-framework-and-orm-strategy.md) — 이 결정을 gating함
* Future: `docs/features/0001-login.md` — 이 결정을 소비하는 vertical-slice 기능 스펙
* Future: `docs/conventions/backend-module-layout.md` — auth 모듈이 레이어드 아키텍처 안에서 어디에 들어가는지
