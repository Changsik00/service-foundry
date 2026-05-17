# ADR-006: Auth Strategy (Deferred)

* Status: **Deferred** — coupled with ADR-005 (backend framework). Decision executed jointly during the Phase 3 spike.
* Date: 2026-05-17
* Decision deadline: Same as ADR-005 (before scaffolding first `packages/backend/*`)
* Owners: Platform / Backend / Frontend
* Scope: Identity, authentication, session management, authorization (RBAC), and account lifecycle
* Audience: future humans **and** AI agents who need to execute this decision quickly when ADR-005 is finalized

---

# 1. Context

Auth selection is **gated by ADR-005**:

| Backend pick | Idiomatic auth |
|---|---|
| NestJS | `@nestjs/passport` + `@nestjs/jwt` |
| Fastify | `better-auth` or `@fastify/jwt` |
| Hono | `better-auth` or `hono/jwt` |

Auth touches every part of the stack:

* **Backend**: middleware/guard, token verify, RBAC
* **Frontend**: session hook, refresh interceptor, route guard
* **Shared**: session/user/JWT payload schemas, error codes
* **Database**: user/account/session/verification tables
* **Security**: CSRF, rate-limit, brute-force, refresh rotation
* **Observability**: login traces, failed-attempt metrics

This ADR captures all known evidence so the final pick is mechanical when ADR-005 resolves.

---

# 2. Decision

**DEFERRED.**

| Field | Value |
|---|---|
| Status | Deferred (gated by ADR-005) |
| Contingent recommendation if ADR-005 = NestJS+Drizzle | **`@nestjs/passport` + `@nestjs/jwt` + `argon2` + custom RBAC guard** |
| Contingent recommendation if ADR-005 = Fastify+Drizzle | **`better-auth`** (Drizzle adapter, Fastify plugin) |
| Contingent recommendation if ADR-005 = Hono+Drizzle | **`better-auth`** (Drizzle adapter, Hono adapter) |
| Confidence | Medium-high (contingent matrix is well-supported) |
| Trigger for final decision | Co-executed with ADR-005 spike |

---

# 3. Pre-bound decisions (locked regardless of outcome)

| Pre-bound | Source |
|---|---|
| 3-package split: `shared/auth-contracts` + `backend/auth` + `frontend/auth` | ADR-003 |
| User record storage: PostgreSQL | ADR-005 |
| Session contracts shared as Zod schemas | Locked stack memory |
| Token strategy: **JWT access (short) + refresh (long) with rotation** | This ADR |
| Refresh denylist storage: Redis (ioredis) | Locked stack memory |
| Password hashing: **argon2** (fall back to bcrypt only if a chosen lib mandates it) | This ADR |
| Cross-domain transport: **httpOnly cookies preferred** (Authorization header for non-browser clients) | This ADR |
| Auth events emitted as OpenTelemetry spans + metrics | Locked stack memory |
| `@repo/backend/auth` is the single entry — no app bypasses | This ADR |

---

# 4. Feature requirement timeline

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

The chosen library must cover all Day-1 items without DIY. Phase-2 items should be "config switch", not "rebuild".

---

# 5. Comparison matrix

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

## 5.1 Framework × Library compatibility one-liner

| | NestJS | Fastify | Hono |
|---|---|---|---|
| @nestjs/passport+jwt | **best fit** | impossible | impossible |
| better-auth | possible (mount handler) | **best fit** | best fit |
| Supabase Auth (as verifier) | OK | OK | OK |
| Custom JWT | OK | OK | OK |

## 5.2 Industry snapshot (2026-05)

| 카테고리 | 분위기 |
|---|---|
| Lucia 후계 | better-auth (사실상 합의) |
| NestJS 표준 | @nestjs/passport + @nestjs/jwt (이동 없음) |
| SaaS 채택 | Clerk 상승, Auth0 안정, Supabase 안정 |
| Self-hosted 트렌드 | better-auth + Drizzle/Prisma adapter |
| Next.js 전용 | Auth.js v5 |
| 폐기 진행 | passport.js의 일부 strategy (유지보수 정지) |

---

# 6. Storage architecture

## 6.1 Tables required

Most libraries assume some of these:

| Table | Purpose | Required by |
|---|---|---|
| `users` | Identity + credentials | all |
| `accounts` | OAuth provider links | better-auth, Auth.js, Clerk export |
| `sessions` | Server-side session state | better-auth (default), Supabase |
| `verifications` / `verification_tokens` | Email verify, password reset, magic link | better-auth, Auth.js |
| `refresh_tokens` (or Redis) | Refresh denylist / rotation log | DIY, @nestjs/passport |
| `mfa_secrets` | TOTP seeds | Phase 3 |
| `passkeys` / `webauthn_credentials` | Passkey credentials | Phase 3 |

For NestJS+passport+jwt path: we own every table.
For better-auth: the lib provides migrations for users/accounts/sessions/verifications.
For Supabase: tables live in Supabase's `auth` schema; we don't touch them directly.

## 6.2 Refresh token model

| Model | Storage | Pros | Cons |
|---|---|---|---|
| Stateless JWT refresh | Signed JWT in cookie | No DB lookup on refresh | Hard to revoke individually |
| Opaque token + DB lookup | `refresh_tokens` table | Easy revoke, audit trail | DB hit each refresh |
| **JWT refresh + Redis denylist** ✅ | Signed JWT + Redis SET on rotate/logout | Fast (Redis), revocable, simple | Redis dependency (already locked) |

**Locked: JWT refresh + Redis denylist + rotation on use.**

## 6.3 Token transport

| Transport | When |
|---|---|
| **httpOnly + Secure + SameSite=Lax cookie** ✅ | Browser apps (default) |
| Authorization Bearer header | API clients, mobile, SDK |
| SameSite=None (cross-site) | Only if API and web are on different registrable domains; requires Secure |

---

# 7. Active critique

## C1. better-auth + NestJS is "possible" but not idiomatic

better-auth exposes a request handler that you mount; it doesn't slot into NestJS Module / Provider / Guard semantics. If we pick NestJS we lose the framework-coherence value that motivated picking NestJS.

**Implication:** if ADR-005 = NestJS → don't use better-auth. Use @nestjs/passport. Accept that we DIY more features (passkey, magic link) later.

## C2. Custom JWT means rebuilding 6 features

Password reset / email verify / refresh rotation / brute-force lockout / device-tracking / OAuth callbacks. Each is 50–200 LOC plus edge cases (timing attacks, token reuse, replay).

**Implication:** Custom JWT only for "I specifically want to teach this" — not for production boilerplate.

## C3. Supabase Auth lock-in is real

Tables, password hash format, email templates, OAuth registration — all live in Supabase. Migrating off later means rebuilding all of it. Self-hosted GoTrue is the middle ground but you take on Postgres+GoTrue+SMTP ops.

**Implication:** Use Supabase Auth only if the project will *be* a Supabase project end-to-end. For a generic boilerplate: rejected.

## C4. Auth.js is Next.js-first

Vite SPA support exists but secondary. Server-side patterns assume Next route handlers.

**Implication:** Auth.js makes sense only if we drop `apps/web-vite` and `apps/admin`. We don't.

## C5. Passkey day-1 mandate flips the recommendation

If passkeys are a Day-1 requirement (not Phase 3): better-auth has it built-in. @nestjs/passport requires `@simplewebauthn/server` manual wiring (~200 LOC).

**Currently passkeys are Phase 3, so this critique is inactive.** Re-evaluate if requirements change.

## C6. RBAC vs ABAC

| Model | When | Library |
|---|---|---|
| **RBAC** (role → permissions) ✅ | Most apps under 1k users with simple permissions | DIY enum + guard |
| ABAC (attributes + policies) | Multi-tenant, complex permission graphs | CASL (NestJS), oso, ts-permit |
| Hybrid | Roles for coarse + ABAC for resource-level | CASL with role-based rules |

**Locked Day-1: RBAC.** ABAC upgrade is additive — start simple.

## C7. argon2 vs bcrypt

| Algorithm | Memory-hard | Recommended (2026) |
|---|---|---|
| **argon2id** ✅ | Yes | Yes (OWASP top pick) |
| bcrypt | No | Acceptable fallback |
| scrypt | Yes | Acceptable |
| PBKDF2 | No | Legacy only |

`@node-rs/argon2` (Rust binding) is fast and well-maintained. Use it unless a chosen lib forces otherwise.

---

# 8. Decision criteria framework

| Criterion | Weight (1–5) | What to measure |
|---|---|---|
| Framework fit (native vs adapter) | 5 | Does it slot into the chosen backend's idioms? |
| Day-1 features covered without DIY | 4 | login / refresh / reset / verify / RBAC |
| Phase-2 features as config (not rewrite) | 3 | OAuth, magic link |
| Self-hosted (no SaaS dependency) | 4 | Runs entirely in our infra |
| Vendor neutrality (swap cost) | 4 | Migration burden if we drop it later |
| AI-friendliness (idiomatic patterns) | 4 | Does AI know it? |
| Frontend SDK quality | 3 | React hooks, refresh interceptor, route guard ergonomic? |
| Security defaults | 5 | CSRF, rotation, lockout, secure cookies baked in? |
| Audit-ability | 3 | Open code, audit trail logs |
| Onboarding cost | 2 | Time to first login PR |

---

# 9. Spike plan (co-executed with ADR-005 spike)

Add to ADR-005 §9 spike:

| Step | Output | Time |
|---|---|---|
| Add `packages/shared/auth-contracts-spike`: Session, User, JwtPayload zod schemas | Schemas exportable | 1h |
| Add `packages/backend/auth-spike`: candidate library + login/refresh/logout/me | curl flows pass | 4h |
| Add `packages/frontend/auth-spike`: React provider + useSession hook + refresh interceptor + protected route | Browser login → redirect → logout works | 3h |
| Integration test: form submit → API → Postgres → JWT → protected fetch → logout | All green in testcontainers | 2h |
| Measure: LOC added, refresh interceptor complexity, RBAC guard ergonomics | Recorded in §11 below | 1h |

## 9.1 Gate criteria

| Metric | Pass threshold |
|---|---|
| Full login round-trip works in browser | yes |
| Refresh interceptor handles 401 → refresh → retry cleanly | yes |
| RBAC guard rejects unauthorized role | yes |
| Refresh denylist (logout) immediately invalidates token | yes |
| Password hashing uses argon2 or bcrypt with proper cost factor | yes |
| Session contracts shared between FE/BE without manual casts | yes |
| Auth-related LOC added to repo | ≤ 800 (excludes lib code) |

If any gate fails → fall back to **Custom JWT + argon2** (full control, more code, but no library surprise).

---

# 10. Architectural implications

| Chosen library | Frontend SDK | Migrations to author | RBAC mechanism | Refresh model |
|---|---|---|---|---|
| @nestjs/passport + @nestjs/jwt | DIY React hook + interceptor (~150 LOC) | `users`, `refresh_tokens` (DIY) | DIY guard + roles enum | Redis denylist (DIY) |
| better-auth | `better-auth/react` (ready) | better-auth-managed (users/accounts/sessions/verifications) | better-auth permissions API | better-auth handles |
| Supabase Auth | `@supabase/ssr` + `supabase-js` | Supabase manages | RLS + custom claims | Supabase handles |
| Custom JWT | DIY everything | DIY everything | DIY everything | DIY everything |

**Sequencing implication:** auth library locks once ADR-005 resolves. `@repo/backend/auth`, `@repo/shared/auth-contracts`, `@repo/frontend/auth` package designs all derive from this.

---

# 11. Spike results

_To be filled when the spike (§9) is executed._

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

# 12. Re-evaluation triggers (after final decision)

| Trigger | Action |
|---|---|
| Chosen library is deprecated/sunset (Lucia precedent) | Migrate per re-evaluation plan |
| Compliance requirement (SOC2, GDPR data residency) clashes | Re-pick |
| Frontend SDK becomes a bottleneck (poor refresh handling, race conditions) | Reconsider |
| Passkeys / MFA promoted to Day-1 from Phase 3 | Re-pick (likely flip to better-auth) |
| Multi-tenancy requirement added | Reconsider model (might need ABAC) |

---

# 13. Open questions to resolve at decision time

| Question | Why it matters |
|---|---|
| Email sender for password reset / verify | nodemailer+SMTP / Resend / Postmark / stub |
| "Remember me" semantics | Longer refresh? device-tied refresh? |
| OTP secret storage on enable | Postgres column vs Redis vs encrypted-at-rest |
| Multi-tenancy | Account-per-user vs org/team model |
| Service-to-service auth (when MSA arrives) | mTLS / shared JWT issuer / OAuth client_credentials |
| OAuth provider order (Google + GitHub first?) | Phase-2 scope |
| Cookie domain config | Same-domain vs cross-domain API |

---

# 14. Pre-bound 3-package architecture

Regardless of chosen library, the 3 packages have these responsibilities:

## `@repo/shared/auth-contracts`
* Zod schemas: `SessionSchema`, `UserSchema`, `JwtPayloadSchema`
* Enums: `Role`, `Permission`
* Error codes: `InvalidCredentialsError`, `TokenExpiredError`, `MfaRequiredError`, etc.
* No runtime deps except zod
* Imported by both backend and frontend

## `@repo/backend/auth`
* Framework module (NestJS Module **or** Fastify plugin) — same exported API surface
* Login / refresh / logout / me handlers
* JWT issue + verify
* Password hashing (argon2)
* RBAC guard
* Refresh denylist (Redis)
* Audit log emitter (OTel spans + metrics)

## `@repo/frontend/auth`
* Auth provider (React context)
* `useSession` / `useUser` hooks
* `login` / `logout` actions
* HTTP interceptor (auto-refresh on 401)
* `<Protected>` route guard component
* Type re-exports from `@repo/shared/auth-contracts`

---

# 15. Related

* [ADR-003](./0003-package-layout-and-naming.md) — 3-package auth split (pre-bound)
* [ADR-005](./0005-backend-framework-and-orm-strategy.md) — gates this decision
* Future: `docs/features/0001-login.md` — vertical-slice feature spec consuming this decision
* Future: `docs/conventions/backend-module-layout.md` — where the auth module fits in the layered architecture
