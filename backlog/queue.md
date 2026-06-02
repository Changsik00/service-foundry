# Backlog Queue

> 본 문서는 *대시보드* 입니다. "지금 무엇을 하고 있고, 다음에 무엇을 해야 하는가"를 한눈에 보기 위함.
>
> **자동 갱신 마커**: `active`, `specx`, `done` — 마커 (`<!-- sdd:... -->`) 사이는 sdd가 관리하므로 그대로 두세요.
> **사람 편집 섹션**: `🧊 Icebox`, `📋 대기 Phase` — 자유 메모.

## 📦 진행 중 Phase

<!-- sdd:active:start -->
(active phase 없음. `bin/sdd phase new <slug>` 로 시작)
<!-- sdd:active:end -->

## 📥 spec-x 대기

<!-- sdd:specx:start -->
<!-- sdd:specx:end -->

## 🧊 Icebox

> 아이디어·보류 항목 보관소. 실행 불가. 관련 항목이 쌓이면 Phase로, 단발이면 spec-x로 승격.
> 이 섹션은 sdd가 건드리지 않습니다. 자유롭게 편집하세요.

- [ ] apps/admin 별도 앱 vs apps/web-vite route 결정 (phase-09)
- [ ] tailwind를 packages/frontend/ui에만 둘지 각 앱에도 설치할지 (phase-04)
- ~~Drizzle/Prisma 마이그레이션 공통 wrapper~~ **해소**: ADR-0005 Drizzle 단일 결정 (2026-05-18, spec-x-auth-foundation-prep)
- [ ] Integration test orchestration: testcontainers (per-test 격리) vs docker-compose snapshot (전체 환경 미리 부팅) (phase-10)
- [ ] Hono apps/edge-api scope: 같은 `/api` 모방 / 다른 엔드포인트 / Cloudflare Workers 전용 데모 (phase-09)
- [ ] commit-time hook 명령 set (Biome only / + typecheck / + affected test) (phase-03~10 중 결정)
- ~~보안 linter (semgrep / socket.dev) 추가 여부~~ **해소**: ADR-0019 No-Go (phase-15 CI 재평가) — spec-10-03 (2026-05-30)
- [ ] check-secrets 훅 false positive 개선 — compose/env 의 `${VAR:-default}` 보간값을 시크릿으로 오탐 (spec-10-01 에서 2회 warn 우회). `${...}`-only 값 무시 또는 allowlist. spec-x 후보 — **RCA-002 작성됨** (spec-14-07, docs 예시도 오탐)
- ~~🔒 **CSRF 미배선**~~ **→ phase-15-01 로 승격** (2026-06-01, wiring audit §A)
- ~~**생성기 backend tsconfig `types:["node"]` 누락**~~ **→ phase-15-05 로 승격** (2026-06-01, wiring audit §E)
- [ ] **wiring audit 🟡 의도적 미배선 항목들** (passkey env · HttpClient/Settings DI · web-vite theme · 프론트 MFA/Passkey UI · RequireAuth · provider 교체) — 보일러플레이트 의도적, 필요 시 개별 승격. `docs/review/2026-06-01-wiring-audit.md` §🟡
- [ ] **MFA/passkey 상태변경 POST 8개 CSRF 보호** (phase-15 회고 W5) — `mfa/totp/{enroll,enroll/confirm,verify,disable}`·`passkey/{register,authenticate}/{options,verify}`. ADR-0021 메커니즘(csrf_id) 동일 적용 가능, 배선만 후속. 특히 `mfa/totp/verify`·`passkey/authenticate/verify` 는 미인증 로그인 완료 endpoint. spec-x/phase-16 후보
- [ ] **CSRF/OAuth secret production 가드** (phase-15 회고 W3) — `CSRF_SECRET`·`OAUTH_STATE_SECRET` 이 `NODE_ENV=production` 에서도 dev 기본값 통과. production 기동 시 기본값 거부 가드 추가. spec-x 후보
- [ ] **web-next CSRF 403 자가복구 + web-vite/SDK 헤더 동반** (phase-15 회고 W6) — 403(토큰 만료/불일치) 시 재부트스트랩+재시도. password-reset/email-verify 흐름 클라이언트 부재분. web-vite·`packages/frontend/auth-*` SDK CSRF 헤더. 후속
- [ ] **knip-config ignoreDependency 정리** (phase-15 회고 W4) — spec-15-02 가 `@repo/backend-auth-rate-limit` 실배선 후 spec-15-01 등록 ignore 잔존 → knip 40 redundant hint. 배선 완료 dep 의 ignore 제거. 비차단, 정리 항목
- [ ] **configureApp SoT 에 applySecurity 흡수** (phase-15 2차회고 V1) — `app.setup.ts` 의 `configureApp` 가 requestId+cookieParser 만 캡슐화 → `main.ts` 의 `applySecurity`(helmet/CORS) 배선은 e2e 미검증(제거해도 GREEN, C1 과 동일 계열 갭). applySecurity 를 configureApp 에 흡수 + e2e 보안헤더 검증 추가. phase-16/spec-x 후보
- [ ] **csrf.ts 주석 drift 정정** (phase-15 2차회고 V2) — `packages/backend/auth-rate-limit/src/csrf.ts:12,16` 주석이 폐기된 session-binding 전략을 설명. ADR-0021(csrf_id, session 비의존) 결정과 모순 → 주석 동기화. V1 과 함께 처리 응집적
- [ ] lat.md Phase 2 도입 평가 (지식 그래프 도구)
- [ ] ARCHITECTURE.md 본체 재작성 (Phase 3 직전, ADR-0005 결정 후)

### 🐛 spec-02-01/02에서 발견된 이슈/주의 사항

- [x] ~~**lefthook typecheck quirk**~~ — 2회 발생(spec-02-01 + spec-02-02) → **RCA-001 작성 + lefthook.yml fix 적용** (2026-05-18 resolved) → `docs/rca/RCA-001-lefthook-typecheck-non-blocking.md`
- [ ] **shared/* DOM lib 패턴 표준화** — 2회째 적용(spec-02-01 utils + spec-02-02 errors). `@repo/typescript-config`에 `env-agnostic` 변형 추가 spec 후보. Phase 2 후반 또는 별 spec에서 결정.
- 📚 **Biome auto-modernize 적용**: `Object.prototype.hasOwnProperty.call` → `Object.hasOwn` (ES2022 표준). 학습 사항 — 액션 불필요.
- 📚 **vitest "no tests in file" 룰**: 빈 test 파일 = exit 1. cleanup-only commit 분리 시 *test 파일을 통째로 두지 않거나 placeholder describe 유지*. 학습 사항 — 액션 불필요.

## 📋 대기 Phase

> 다음에 진행할 phase 를 자유롭게 메모합니다 (사람이 직접 편집).
> 자동 갱신되지 않습니다 — Icebox 와 동일한 정책.

> **2026-05-18 재조정**: spec-x-auth-foundation-prep에서 auth foundation 2차안 채택 + 옵션 A 9 phase 분할. 본래 phase-03~06(6개) → phase-03~11(9개).

- **phase-03** — Backend Foundation (NestJS + Drizzle + apps/api scaffold + health/config/observability hooks) — auth 제외
- **phase-04** — Frontend Foundation (Vite/Next + apps/web-* scaffold + TanStack Query + ui/sdk 기본) — auth 제외
- **phase-05** — Auth Core + Security (auth-contracts 확장 + auth-session + auth-jwt + auth-security + password reset / email verify) — 2차안 §Phase 1+2
- **phase-06** — Auth Integration (auth-nestjs + auth-react + Cookie + Audit & Events) — 2차안 §Phase 3
- **phase-07** — Auth Extension (auth-oauth + auth-mfa + auth-passkey) — 2차안 §Phase 4
- **phase-08** — Provider Adapters (auth-firebase + auth-supabase + auth-testing — Core Surface 컨벤션 실증) — 2차안 §Phase 5
- **phase-09** — Apps + Admin Tools (vertical-slice login acceptance + apps/admin or auth-admin)
- **phase-10** — Ops & Tooling (docker-compose / generators / service-manifest + auth observability dashboards)
- **phase-11** — Observability + App Generator (구 phase-10 이월: prometheus metric + grafana dashboard + alert rule + **OTEL tracing 배선**(compose tempo 활용) + `pnpm new app`) — 2026-05-30 phase-10 종료 시 분리

> **2026-05-30 신설 (보일러플레이트 품질·완성도 트랙)**: "어떤 작업에도 들어가는 공통 기반" + 코드 품질 평점(현 보안 B+/에러 A-) 상향을 phase 로 구분. CI/CD 는 당장 불급이라 후순위(phase-15)로 재배치.

- **phase-12** — Service Foundations I · Runtime (**Tier 1**): `worker` 앱 + job queue (BullMQ/pg-boss) · **email/notification 포트**(Resend/SES 어댑터 — token-logging 결함의 근본 해소) · caching 추상화(Redis cache-aside/TTL) · graceful shutdown / lifecycle (SIGTERM drain, readiness≠liveness)
- **phase-13** — Service Foundations II · API & Data (**Tier 2**): idempotency-key 미들웨어 · pagination/cursor 표준 계약(`contracts`) · typed client codegen(`contracts`→프론트 클라이언트) · object storage 포트(S3/R2) · outbox/도메인 이벤트 신뢰성 발행 · DB seeding + 테스트 팩토리 + 마이그레이션 통합 러너
- **phase-14** — Quality Hardening (**평점 상향**): 에러 규약 통일(Result/throw/boolean → ADR + 리팩터, 에러 A-→A) · `auth.guard` role 을 verified claims(`result.value`)에서 읽기(footgun 제거) · 비-auth 패키지(http-client/logger/utils) 경계 테스트 보강 · general rate-limit / secrets provider 포트(보안 B+→A) · knip/depcruise CI gate(phase-15 연계)
- **phase-15** — Security & Wiring Hardening: 구현됐으나 미배선된 보안·검증 기능 배선(CSRF · 로그인 rate-limit/lockout · CI knip/depcruise 게이트 · request-id · 생성기 tsconfig). 근거 `docs/review/2026-06-01-wiring-audit.md` — **2026-06-01 신설** (CSRF 미배선 발견 → 전수조사)
- **phase-16** — Deploy (k8s manifest): 구 phase-15 잔류분 (CI/CD 는 phase-14 흡수). k8s sample manifest — **후순위**

> **완료 (spec-x)**: 보안 결함 reset/verify raw 토큰 평문 로깅 → NODE_ENV 가드 (PR #67, 2026-05-30). 근본 해소(notification 포트)는 phase-12.

## ✅ 완료

<!-- sdd:done:start -->
없음
- [x] spec-x-roadmap-migration (완료)
- **phase-01** — 모노레포 골격 (Monorepo Skeleton) — completed 2026-05-17
- **phase-02** — Shared Primitives — completed 2026-05-18
- [x] spec-x-auth-foundation-prep (완료)
- **phase-03** — Backend Foundation — completed 2026-05-20
- **phase-04** — Frontend Foundation — completed 2026-05-20
- [x] spec-x-frontend-dev-fixes (완료)
- [x] spec-x-frontend-foundation-followup (완료)
- **phase-5** — ? — completed 2026-05-21
- **phase-6** — ? — completed 2026-05-22
- **phase-07** — Auth Extension — OAuth + MFA + Passkey — completed 2026-05-22
- **phase-8** — ? — completed 2026-05-22
- **phase-09** — 로그인 UI + 수직 통합 슬라이스 — completed 2026-05-23
- [x] spec-x-governance-reset-package-layout (완료)
- [x] spec-x-nestjs-adapter-standard-module (완료)
- **phase-10** — Ops & Tooling — completed 2026-05-30
- [x] spec-x-secure-reset-token-logging (완료)
- **phase-11** — Observability + App Generator — completed 2026-05-30
- **phase-12** — Service Foundations I · Runtime — completed 2026-05-30
- **phase-13** — Service Foundations II · API & Data — completed 2026-05-31
- **phase-14** — Quality Hardening + CI/CD — completed 2026-06-01
- **phase-15** — Security & Wiring Hardening — completed 2026-06-02
<!-- sdd:done:end -->

---

## 📖 사용 방법

| 명령 | 동작 |
|---|---|
| `sdd phase new <slug>` | 새 Phase 생성 → 진행 중으로 등록 |
| `sdd phase new <slug> --base` | Phase base branch 모드로 생성 (opt-in) |
| `sdd spec new <slug>` | 진행 중 Phase에 다음 spec 등록 |
| `sdd plan accept` | spec Plan Accept → 실행 모드 진입 |
| `sdd ship` | spec 완료 처리 → Merged 갱신 + state 초기화 + NEXT 안내 |
| `sdd phase done <N>` | Phase 완료 → 완료 섹션으로 이동 |

자세한 사용법: `agent/constitution.md` §3 Work Type Model, `agent/agent.md`
