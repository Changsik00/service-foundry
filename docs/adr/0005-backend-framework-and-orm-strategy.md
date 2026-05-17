# ADR-005: Backend Framework & ORM Strategy (Deferred)

* Status: **Deferred** — decision postponed until backend implementation phase
* Date: 2026-05-17
* Decision deadline: Before scaffolding the first `packages/backend/*` package (Phase 3)
* Owners: Platform / Backend
* Scope: HTTP framework, ORM/query layer, and the architectural patterns that follow from the combination
* Audience: This document is written to be consumed by future humans **and** AI agents who need to make this decision quickly and defensibly when the time comes.

---

# 1. Context

This is the single most consequential undecided choice in the boilerplate. Backend framework selection cascades into many other ADRs:

| Downstream concern | Depends on framework |
|---|---|
| Validation library wrapper | `nestjs-zod` vs `fastify-type-provider-zod` vs `@hono/zod-openapi` |
| Auth implementation | `@nestjs/passport` vs `better-auth` vs custom |
| Logger adapter | `nestjs-pino` vs `@fastify/pino` (built-in) vs `hono/logger` |
| OpenAPI pipeline | `@nestjs/swagger` vs `fastify-swagger` vs `@hono/zod-openapi` |
| Dependency injection | Framework DI vs explicit wiring |
| Test patterns and CI speed | `Test.createTestingModule` vs `fastify.inject` vs Hono Request |
| MSA evolution | `@nestjs/microservices` vs custom transport |
| Error handling | `ExceptionFilter` vs `setErrorHandler` vs `onError` |
| Config injection | `ConfigModule.forRoot()` vs Fastify plugin vs context binding |

Because this decision touches 5–10 follow-on ADRs, we **defer it explicitly** rather than lock prematurely. This ADR captures all currently-known evidence so the eventual decision can be executed quickly when the time comes.

Multiple analyses (project owner, Claude, external AI assistants) have converged on a few combinations but disagree on which axis dominates. The disagreement is recorded here transparently.

---

# 2. Decision

**DEFERRED.**

| Field | Value |
|---|---|
| Status | Deferred |
| Leading candidate | **NestJS + Drizzle + PostgreSQL + thin layered architecture + integration-first testing + Zod** |
| Confidence in leading candidate | Medium |
| Trigger for final decision | Before first `packages/backend/*` package scaffolding (Phase 3 in ROADMAP) |
| Required input before deciding | 1–2 day spike on the leading combination (see §8) |

---

# 3. Pre-bound decisions (locked regardless of outcome)

These hold across every candidate combo:

| Pre-bound decision | Source |
|---|---|
| Database engine: **PostgreSQL** | This ADR (locked) |
| Validation: **Zod** | Locked stack memory |
| Test framework: **Vitest** | ADR-002 |
| Logger core: **pino** | Locked stack memory |
| Module system: ESM only, NodeNext | ADR-002 / ADR-004 |
| TypeScript: strict | ADR-004 |
| Backend package compilation: **tsup** | ADR-004 |
| Auth folder split: 3 packages (`shared/auth-contracts`, `backend/auth`, `frontend/auth`) | ADR-003 |
| Observability: OpenTelemetry | Locked stack memory |
| Cache/queue: Redis (ioredis) + BullMQ | Locked stack memory |
| Edge runtime example: Hono in `apps/edge-api` | Locked stack memory |

The decision below selects only: HTTP framework, ORM, and the conventional architecture pattern.

---

# 4. Full comparison matrix

10 candidate combinations. Source: project owner's research aggregating multiple AI assistant analyses (2026-05-17).

| 조합 | 장점 | 단점 | AI 시대 관점 | 테스트 관점 | 현재 시장/트렌드 | 추천 상황 |
|---|---|---|---|---|---|---|
| **NestJS + Prisma** | 구조 표준화 강함, 온보딩 쉬움, CRUD 생산성 최고급, ecosystem 매우 큼 | abstraction inflation 위험, hidden SQL, Prisma lock-in 느낌, DTO/repository 증식 가능 | AI가 가장 안정적으로 생성하는 조합 중 하나 | unit test 패턴 명확, mock 기반 테스트 쉬움 | 현재 mainstream / 실무 표준급 | 조직 운영, 빠른 개발, 채용/온보딩 중요 |
| **NestJS + Drizzle** | Nest convention + SQL explicitness 조합, PostgreSQL 활용 좋음, 구조 안정성 높음 | Nest boilerplate 존재, Drizzle relation ergonomics 약간 약함 | AI 흔들림 줄이고 explicit SQL 유지 가능 | integration-first 구조 만들기 좋음 | 증가 중인 modern hybrid 흐름 | 장기 유지보수 + 조직화 둘 다 원하는 경우 |
| **Fastify + Prisma** | Fastify 성능 + Prisma DX, 비교적 단순한 구조 가능 | Prisma 한계 그대로 존재, 구조 직접 설계 필요 | explicit runtime + 높은 CRUD 생산성 | 테스트 전략 직접 설계 필요 | startup/backend 실무에서 꽤 현실적 | 빠른 API 개발 + lightweight framework 선호 |
| **Fastify + Drizzle** | explicit, low magic, SQL visibility 최고, PostgreSQL 친화적, infra/control 강함 | 구조를 직접 만들어야 함, 초기 convention 부재 | AI-friendly explicit architecture | integration/e2e 중심 테스트와 궁합 좋음 | modern AI-native/backend trend 상승 중 | platform/backend/core service |
| **Hono + Drizzle** | 초경량, edge 친화적, zod-first, runtime portability 좋음 | enterprise ecosystem 약함, 대규모 운영 사례 적음 | AI가 다루기 쉬운 단순 구조 | contract/e2e 테스트 중심 | 급상승 중 | edge/BFF/serverless |
| **Hono + Prisma** | 빠른 DX, lightweight API 구축 쉬움 | Prisma runtime/engine 특성과 edge 궁합 애매 | AI 생산성 높음 | CRUD 테스트는 쉬움 | niche | 작은 서비스/BFF |
| **NestJS + TypeORM** | 오래된 ecosystem, 자료 많음 | decorator magic 많음, runtime ambiguity, AI가 실수하기 쉬움 | AI 시대엔 점점 불리 | mock-heavy 구조로 가기 쉬움 | 감소 추세 | legacy 유지보수 |
| **NestJS + Sequelize** | 전통적 ORM 패턴 | 타입 안정성 약함, modern TS 흐름과 거리 있음 | AI 생성 품질 편차 큼 | integration 의존 증가 | legacy | 신규 추천 거의 없음 |
| **Fastify + Raw SQL** | 성능/제어 최상, PostgreSQL 100% 활용 가능 | 유지보수 난이도 상승, convention 필요 | AI가 SQL은 잘 짜지만 drift 위험 존재 | integration test 필수 | infra-heavy 팀 일부 사용 | analytics/high-performance |
| **NestJS + Raw SQL** | 조직화 + SQL control | abstraction 혼합 시 복잡성 증가 | AI가 layer 혼합 실수 가능 | 테스트 boundary 명확하면 강함 | 일부 enterprise | complex enterprise backend |

## 4.1 Axis summary

| 방향 | 특징 |
|---|---|
| 과거 mainstream | `NestJS + Prisma` |
| 현재 modern trend | `Fastify/Hono + Drizzle` |
| 조직 안정성 중심 | `NestJS` |
| infra/control 중심 | `Drizzle` |
| AI 생산성 최고 | `Prisma` |
| AI 예측 가능성 최고 | `Drizzle` |
| 테스트 convention 강함 | `NestJS` |
| explicit architecture 강함 | `Fastify` |
| PostgreSQL 활용 최강 | `Drizzle + SQL-first` |
| onboarding 쉬움 | `NestJS + Prisma` |
| 장기 runtime visibility | `Drizzle` |
| boilerplate 최소화 | `Hono/Fastify` |

## 4.2 Industry snapshot (2026-05)

| 카테고리 | 현재 분위기 |
|---|---|
| 안전한 실무 선택 | `NestJS + Prisma` |
| modern backend engineering | `Fastify + Drizzle` |
| AI-native architecture | `explicit schema + SQL-first` |
| 대규모 조직 운영 | `NestJS` 여전히 강세 |
| infra/platform 팀 선호 | `Drizzle` 빠르게 증가 |
| AI 코드 품질 안정성 | convention 기반 (Nest) 강점 |
| AI runtime 예측 가능성 | explicit 기반 (Drizzle/Fastify) 강점 |

---

# 5. Project owner preference profile

Recorded so a future decision-maker (human or AI) can re-derive the recommendation with the same inputs.

## 5.1 What the owner consistently values

* **장기 유지보수 가능한 구조** — design for years, not weeks
* **AI 시대의 안정성** — code that survives multiple AI editing sessions without drift
* **테스트 가능성** — boundaries that allow real tests
* **명확한 경계** — strong layer/module boundaries
* **운영 예측 가능성** — at runtime, behavior is predictable

## 5.2 Five observed preferences

1. **자유도보다 통제된 생산성 선호** — prefers "fast inside a defined direction" over "fully free structure". Platform/team-oriented thinking.
2. **테스트를 품질 핵심으로 봄** — values DI, service boundaries, layer separation, mocking, integration structure. Will accept enterprise-architecture costs for testing benefits.
3. **과한 abstraction은 싫어함** — values explicitness, SQL visibility, PostgreSQL native features, runtime predictability. Wants testable structure without abstraction inflation.
4. **PostgreSQL을 플랫폼으로 봄** — not "a place to put rows". Values SQL ownership, query visibility, migration control, infra independence. Strong alignment with Drizzle.
5. **AI 시대 관점이 강함** — recurring concern: how does the architecture hold up when AI makes mistakes? Treats convention / boundaries / explicitness as AI safety mechanisms.

## 5.3 What this profile implies

The owner is not "최신 유행" optimized. They are **"modernized enterprise architecture"** oriented:
* Reduce: heavy OOP, excessive abstraction, hidden ORM magic
* Strengthen: testing, structure, observability, explicitness

---

# 6. Leading recommendation rationale

**Recommended combination:**

```
NestJS
+ Drizzle
+ PostgreSQL
+ Layered Architecture (THIN)
+ Integration-first Testing
+ Zod
```

## 6.1 What NestJS solves

| Need | How NestJS addresses it |
|---|---|
| Convention | AI doesn't have to invent file layout, naming, dependency direction |
| Test structure | Modules / providers / DI / isolation patterns are canonical |
| Organization | Onboarding, consistency, scalability for platform thinking |

## 6.2 What Drizzle solves

| Need | How Drizzle addresses it |
|---|---|
| SQL ownership | ORM doesn't hide the database |
| Runtime predictability | Generated SQL is visible, traceable, tunable |
| PostgreSQL exploitation | JSONB, CTE, indexing, query optimization stay first-class |
| Zod synergy | `drizzle-zod` generates contracts from DB schema → single source of truth |

## 6.3 Critical constraint — keep layers THIN

| Acceptable layering | Forbidden layering (AI-explosion risk) |
|---|---|
| Controller → Service → Repository (optional) → DB | Controller → Service → UseCase → Repository → Adapter → Mapper → Factory → Entity → DTO |

The owner values *boundaries*, not *layers themselves*. Adding layers is allowed only when a boundary becomes load-bearing.

## 6.4 Testing strategy

**integration-first + critical-domain unit tests**

Rationale: in AI-assisted dev, mock-heavy tests catch fewer real bugs than integration tests against testcontainers Postgres. Reserve unit tests for pure-logic domain rules.

## 6.5 Realistic positioning

| Aspect | Verdict |
|---|---|
| AI safety | High |
| Long-term maintainability | Strong |
| Onboarding | Good |
| Test discipline | Achievable |
| PostgreSQL control | Preserved |
| Risk: initial boilerplate | Present |
| Risk: Nest abstraction | Still present in moderation |
| Risk: layer inflation | Mitigated only by discipline |
| Risk: CRUD DX | Not as fast as Prisma |

---

# 7. Active critique — what could still kill this recommendation

Adversarial section. The recommendation survives only if these critiques can be answered at decision time.

## C1. NestJS + Drizzle is community-only integration

There is **no first-party `@nestjs/drizzle` module**. Real-world patterns:

* `@knaadh/nestjs-drizzle-postgres` — community wrapper, low star count
* DIY `DrizzleModule` with custom provider (most common; ~20–40 lines per pattern)
* Connection string forwarded from `@nestjs/config` or our `@repo/backend/settings`

**Implication:** the boilerplate owns the `DrizzleModule` source — acceptable but adds maintenance.

**Mitigation:** Include a reference `@repo/backend/database-drizzle` implementing the canonical pattern. Treat as part of the boilerplate's value-add.

## C2. NestJS + Vitest has known setup friction (locked Vitest by ADR-002)

NestJS defaults to Jest. Our locked stack is Vitest. Working combinations require:

* `unplugin-swc` for decorator metadata transform
* Specific `vite.config.ts` settings (e.g. `isolate: false`)
* `reflect-metadata` import order discipline
* Mock resolution edge cases with `vmThreads`

**Implication:** Not fatal. `@repo/vitest-config` will need a NestJS-specific preset. Test boot time will be slower than Fastify equivalent (~5–10× per file).

**Mitigation:** Reuse `INestApplication` across tests within a file. Define golden Vitest preset in `@repo/vitest-config/node-nestjs`.

## C3. "Modern trend" framing in the matrix is editorial

Quantitative reality (2026-05):

* NestJS: ~70k GitHub stars, massive npm download share, dominant in large-company adoption
* Fastify: ~33k stars, steady growth
* Hono: ~22k stars, rising fastest

Trend ≠ dominance. NestJS is **production-mainstream**. Fastify+Drizzle is **modern-mainstream** with smaller installed base. Hono is **edge-mainstream**.

**Implication:** None blocking — both NestJS and Fastify are safe. Listed to keep framing honest.

## C4. "Thin layered architecture" is currently under-defined

The recommendation says "Controller → Service → Repository(optional) → DB". Open questions:

* Where do domain models live? In `service/` as plain classes? Separate `domain/` folder?
* Where does cross-cutting validation happen? Pipe? Interceptor? Service?
* Where do business invariants live? Service? Domain object?
* What goes in `Repository(optional)`? Pure Drizzle queries? Domain-typed methods?

**Implication:** Without concrete answers, AI agents will pick different answers each session — defeating the "convention" benefit that motivated NestJS.

**Mitigation:** Pair this ADR's eventual decision with **a separate `docs/conventions/backend-module-layout.md`** written immediately after the framework is chosen. That doc is a blocker for Phase 3 acceptance.

## C5. Integration-first testing has real CI cost

| Aspect | Unit-first | Integration-first |
|---|---|---|
| CI wall time | Fast | 3–10× slower |
| Setup overhead | Low | testcontainers + fixtures |
| Bug-catching power | Limited | High |
| Failure isolation | Easy | Often unclear |
| TDD inner loop speed | Fast | Slow |

**Implication:** Sound for AI-first goals but TDD inner loop suffers. Need a tiered policy:

| Trigger | Tests run |
|---|---|
| File save (watch) | Affected unit tests only |
| Pre-commit (lefthook) | Affected unit tests + lint |
| Pre-push (lefthook) | Affected integration tests |
| CI | Full suite |

## C6. Drizzle + Zod synergy is a quiet win not in the matrix

`drizzle-zod` generates Zod schemas from Drizzle tables. Combined with our locked Zod-first contracts:

```
Drizzle schema  →  drizzle-zod  →  @repo/shared/contracts  →  frontend
```

Single source of truth from DB to UI. **This is an independent vote for Drizzle** regardless of framework.

---

# 8. Decision criteria framework (for the final call)

Score each candidate combo against these criteria. Weights reflect this project's stated priorities. Highest weighted total wins.

| Criterion | Weight (1–5) | What to measure |
|---|---|---|
| AI-friendly explicit wiring | 4 | Can an AI agent regenerate a typical module without metadata errors? |
| Convention enforcement | 4 | Does the framework prevent structural drift across sessions? |
| Test feedback speed (TDD loop) | 4 | Time for `vitest watch` round trip on changed file |
| PostgreSQL / SQL ownership | 4 | Can we see and edit the SQL? Tune indexes? Use JSONB? |
| Onboarding cost | 3 | Time for new dev / AI agent to make a useful PR |
| Long-term maintainability | 5 | Healthy choice in 3 years? |
| Operational predictability | 5 | At runtime, can we predict performance / queries / errors? |
| Community / training data depth | 3 | AI writes more consistent code for popular stacks |
| Vendor neutrality | 3 | Can we swap ORM / framework later without rewriting business logic? |
| CRUD development speed | 2 | Time to add a new endpoint with full CRUD |
| Edge / serverless portability | 1 | Can it run on Cloudflare / Vercel Edge? (covered by `apps/edge-api`) |

---

# 9. Spike plan (1–2 days before commit)

Prototype the leading combination with these acceptance criteria:

| Step | Output | Time |
|---|---|---|
| Create `apps/api-spike` with NestJS on Fastify adapter, ESM, Vitest | App boots, returns hello | 2h |
| Add `packages/backend/database-drizzle-spike` with one `users` table, Drizzle migrate, drizzle-zod schema | Migration runs, schema importable | 3h |
| Implement POST `/auth/login` with @nestjs/passport (JWT) + Drizzle query | curl login returns JWT | 4h |
| Vitest: unit test for service, integration test with testcontainers postgres | Both green | 3h |
| Measure: cold start, watch round-trip, test wall time, build time | Numbers recorded in spike report | 2h |
| Write spike report → append to §11 below | Pass / fail decision | 1h |

## 9.1 Gate criteria

| Metric | Pass threshold |
|---|---|
| Watch round-trip (changed service file) | ≤ 3s |
| Cold app boot | ≤ 2s |
| 50-test integration suite in CI | ≤ 30s |
| `drizzle-zod` schema sharing with `@repo/shared/contracts` | Works without manual casts |
| `reflect-metadata` order pitfalls | None observed |

If any gate fails, fall back to **Fastify + Drizzle + better-auth** (second-best per the matrix).

---

# 10. Architectural implications of each candidate

What each combo locks in for follow-on ADRs:

| Combo | Auth | Validation | Logger | OpenAPI | Errors |
|---|---|---|---|---|---|
| NestJS + Drizzle | `@nestjs/passport` + `@nestjs/jwt` | `nestjs-zod` + `ValidationPipe` | `nestjs-pino` | `@nestjs/swagger` + `nestjs-zod` | `ExceptionFilter` |
| NestJS + Prisma | same as above | same | same | same | same |
| Fastify + Drizzle | `better-auth` or `@fastify/jwt` | `fastify-type-provider-zod` | `@fastify/pino` (built-in) | `@fastify/swagger` + `zod-to-openapi` | `setErrorHandler` |
| Fastify + Prisma | same | same | same | same | same |
| Hono + Drizzle | `better-auth` | `@hono/zod-validator` + `@hono/zod-openapi` | `hono/logger` | `@hono/zod-openapi` (best in class) | `onError` |

**Sequencing implication:** until ADR-005 is decided, follow-on ADRs (auth / validation / logger / openapi / errors) cannot be authored without forking. Those ADRs are written **after** ADR-005 is decided.

---

# 11. Spike results

_To be filled when the spike (§9) is executed._

```
Date:
Combination tested:
Watch round-trip:
Cold boot:
50-test integration suite wall time:
Drizzle + zod schema sharing works:
Vitest setup notes:
Decision: GO / NO-GO
Fallback chosen if NO-GO:
```

---

# 12. Re-evaluation triggers (after final decision)

Reopen this ADR if:

* AI-assisted dev workflow shows >2× higher error rate on the chosen framework over 1 month
* Vitest + chosen framework requires hacks not documented upstream
* Drizzle releases first-party NestJS module that supersedes our DIY pattern (impacts maintenance burden)
* We need to add a second backend service (`apps/api-2`) and the chosen stack scales badly
* A new framework / runtime reaches production parity (likely candidates: Bun + ElysiaJS, Encore)

---

# 13. Open questions to resolve at decision time

| Question | Why it matters |
|---|---|
| Express adapter vs Fastify adapter under NestJS | Affects perf and middleware ecosystem |
| `apps/api` single deployment vs already-split modules | Pre-MSA prep |
| Drizzle migrations: Drizzle Kit vs custom script | Migration UX |
| Where does `@repo/backend/database-drizzle` end and `apps/api` schema begin? | Schema ownership boundary |
| Integration test orchestration: testcontainers vs docker-compose snapshot | CI complexity vs reproducibility |

---

# 14. Related

* [ADR-001](./0001-linting-formatting-strategy.md) — AI-first philosophy
* [ADR-002](./0002-monorepo-foundations.md) — Locks Node 22, pnpm, Vitest, lefthook
* [ADR-003](./0003-package-layout-and-naming.md) — Locks 3-package auth split
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — Locks compiled backend (tsup)
* `docs/turborepo-rules.md` — Build/test pipeline patterns
* Future: `docs/conventions/backend-module-layout.md` — Required after framework is chosen (mitigates C4)
