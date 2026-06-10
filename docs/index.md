---
type: index
aliases: [지식베이스 홈, docs index, MOC, 카탈로그]
tags: [service-foundry, index, meta]
---

# service-foundry 지식베이스

> 💡 이 문서는 **단일 카탈로그(MOC)** 다. 모든 노트가 여기 1줄씩 등재된다. (디렉토리별 README 없음 — [[CONVENTIONS]] 참조)
> 처음이라면: [[reference/architecture|아키텍처]] → 관심 패키지 [[#Reference — 패키지]] → 동작 원리 [[#Explainers — 동작 메커니즘]] 순으로.

## 3층 모델

| 층 | 질문 | 위치 |
|---|---|---|
| [[reference/architecture|reference]] | 무엇인가 (계약·표면) | `reference/` |
| [[#Decisions (ADR)\|decision]] | 왜 그렇게 정했나 | `adr/` |
| [[#Explainers — 동작 메커니즘\|explainer]] | 어떻게 동작하나 | `explainers/` |

## 메타
- [[CONVENTIONS]] — 문서 작성 규약 (frontmatter/태그/wikilink/스켈레톤)
- [[glossary]] — 용어/약어 사전
- [[log]] — 변경 로그
- [[reference/architecture]] — 시스템 구조 + 의존 그래프
- [[reference/stack]] — 의존성 도입 근거

---

## Reference — 앱
- [[reference/apps/api|api]] — NestJS 인증/도메인 REST 백엔드
- [[reference/apps/web|web]] — Next.js 16 SSR 웹 (메인)
- [[reference/apps/worker|worker]] — BullMQ consumer 워커

## Reference — 패키지

### backend (core, 22)
- [[reference/packages/backend-auth-session|@repo/backend-auth-session]] — refresh 토큰 rotation/family reuse
- [[reference/packages/backend-auth-jwt|@repo/backend-auth-jwt]] — EdDSA 토큰 + JWKS
- [[reference/packages/backend-auth-password|@repo/backend-auth-password]] — argon2id 해싱
- [[reference/packages/backend-auth-rate-limit|@repo/backend-auth-rate-limit]] — sliding window + lockout + CSRF
- [[reference/packages/backend-auth-oauth|@repo/backend-auth-oauth]] — OAuth PKCE + 계정 연결
- [[reference/packages/backend-auth-mfa|@repo/backend-auth-mfa]] — TOTP MFA
- [[reference/packages/backend-auth-passkey|@repo/backend-auth-passkey]] — WebAuthn/Passkey
- [[reference/packages/backend-auth-audit|@repo/backend-auth-audit]] — 인증 감사 로그
- [[reference/packages/backend-database|@repo/backend-database]] — Drizzle + PG + Repository
- [[reference/packages/backend-logger|@repo/backend-logger]] — pino + request-id + redaction
- [[reference/packages/backend-http-client|@repo/backend-http-client]] — undici typed client
- [[reference/packages/backend-settings|@repo/backend-settings]] — env validation
- [[reference/packages/backend-observability|@repo/backend-observability]] — OTel + prom-client
- [[reference/packages/backend-notification|@repo/backend-notification]] — Notifier 포트
- [[reference/packages/backend-queue|@repo/backend-queue]] — BullMQ Producer/Consumer 포트
- [[reference/packages/backend-cache|@repo/backend-cache]] — Cache 포트 (getOrSet)
- [[reference/packages/backend-lifecycle|@repo/backend-lifecycle]] — graceful shutdown
- [[reference/packages/backend-idempotency|@repo/backend-idempotency]] — Idempotency-Key replay
- [[reference/packages/backend-outbox|@repo/backend-outbox]] — transactional outbox
- [[reference/packages/backend-storage|@repo/backend-storage]] — Storage 포트
- [[reference/packages/backend-rate-limit|@repo/backend-rate-limit]] — 범용 RateLimiter 포트
- [[reference/packages/backend-secrets|@repo/backend-secrets]] — SecretsProvider 포트

### nestjs (adapter, 6)
- [[reference/packages/nestjs-auth|@repo/nestjs-auth]] — AuthGuard/RolesGuard + 데코레이터
- [[reference/packages/nestjs-database|@repo/nestjs-database]] — DatabaseModule (Drizzle DI)
- [[reference/packages/nestjs-http-client|@repo/nestjs-http-client]] — HttpClientModule
- [[reference/packages/nestjs-logger|@repo/nestjs-logger]] — LoggerModule + interceptor
- [[reference/packages/nestjs-security|@repo/nestjs-security]] — helmet/cors/throttler
- [[reference/packages/nestjs-settings|@repo/nestjs-settings]] — SettingsModule

### frontend (7)
- [[reference/packages/frontend-auth-react|@repo/frontend-auth-react]] — AuthProvider/useAuth + MFA·Passkey 훅
- [[reference/packages/frontend-auth-firebase|@repo/frontend-auth-firebase]] — Firebase → CoreAuthSDK
- [[reference/packages/frontend-auth-supabase|@repo/frontend-auth-supabase]] — Supabase → CoreAuthSDK
- [[reference/packages/frontend-auth-testing|@repo/frontend-auth-testing]] — Mock CoreAuthSDK
- [[reference/packages/frontend-auth-http|@repo/frontend-auth-http]] — (스텁/예정)
- [[reference/packages/frontend-http-client|@repo/frontend-http-client]] — ky typed client
- [[reference/packages/frontend-ui|@repo/frontend-ui]] — shadcn 공유 UI

### shared (6)
- [[reference/packages/shared-errors|@repo/errors]] — AppError + JSON 직렬화
- [[reference/packages/shared-utils|@repo/utils]] — Result + sleep/pick/omit
- [[reference/packages/shared-validation|@repo/validation]] — zod ↔ Result 통합
- [[reference/packages/shared-contracts|@repo/contracts]] — 도메인 계약 + cursor pagination
- [[reference/packages/shared-auth-contracts|@repo/auth-contracts]] — auth 스키마 + AuthResult
- [[reference/packages/shared-factory|@repo/factory]] — 의존성 조립 factory

### config (7)
- [[reference/packages/config-typescript-config|@repo/typescript-config]] — TS strict preset
- [[reference/packages/config-vitest-config|@repo/vitest-config]] — Vitest preset
- [[reference/packages/config-biome-config|@repo/biome-config]] — Biome lint/format preset
- [[reference/packages/config-tsup-config|@repo/tsup-config]] — tsup 빌드 preset
- [[reference/packages/config-tailwind-config|@repo/tailwind-config]] — Tailwind v4 preset
- [[reference/packages/config-depcruise-config|@repo/depcruise-config]] — 경계 규칙 preset
- [[reference/packages/config-knip-config|@repo/knip-config]] — dead-code preset

---

## Explainers — 동작 메커니즘

### auth (12)
- [[explainers/auth/session-rotation-chain]] — refresh rotation + family reuse 감지
- [[explainers/auth/jwt-verify-edDSA]] — EdDSA 발급/검증 + JWKS
- [[explainers/auth/password-hash-argon2id]] — argon2id + needsRehash
- [[explainers/auth/auth-rate-limit-lockout]] — sliding window + lockout + CSRF
- [[explainers/auth/password-reset-flow]] — hash 저장 + always-200 + TTL
- [[explainers/auth/email-verify-flow]] — token → hash → confirm
- [[explainers/auth/cookie-strategy]] — httpOnly + SameSite cookie 5-endpoint
- [[explainers/auth/audit-event-bus]] — AuthEventBus + AuditService
- [[explainers/auth/oauth-pkce-flow]] — PKCE + State + 계정 연결
- [[explainers/auth/mfa-totp-challenge]] — TOTP enroll/verify + signin 분기
- [[explainers/auth/passkey-webauthn]] — WebAuthn ceremony
- [[explainers/auth/auth-guard-verified-claims]] — 검증된 claim 사용 footgun 수정

### backend (11)
- [[explainers/backend/drizzle-migrations-lifecycle]] — Drizzle 마이그레이션 + pool lifecycle
- [[explainers/backend/request-id-propagation]] — AsyncLocalStorage reqId 전파
- [[explainers/backend/otel-tracing-init-order]] — NodeSDK init 순서 + env-gated
- [[explainers/backend/prom-metrics-auth-counters]] — prom-client + /metrics
- [[explainers/backend/notification-port-adapter]] — Notifier 포트/어댑터
- [[explainers/backend/queue-worker-bullmq]] — BullMQ producer/consumer
- [[explainers/backend/cache-aside-port]] — Cache 포트 getOrSet
- [[explainers/backend/graceful-shutdown-lifecycle]] — SIGTERM drain
- [[explainers/backend/idempotency-key-replay]] — Idempotency-Key replay
- [[explainers/backend/transactional-outbox]] — outbox + relay poller
- [[explainers/backend/secrets-provider-port]] — SecretsProvider/RateLimiter 포트

### frontend (6)
- [[explainers/frontend/auth-react-provider-sdk-contract]] — AuthProvider(CoreAuthSDK) + 스왑
- [[explainers/frontend/auth-sdk-provider-adapters]] — Consistent Wrapped SDK
- [[explainers/frontend/mfa-passkey-react-hooks]] — useMfaChallenge/usePasskeyRegister
- [[explainers/frontend/frontend-http-client-ky-wrapper]] — ky + AppError 변환
- [[explainers/frontend/login-ui-form]] — LoginForm + useAuth
- [[explainers/frontend/http-auth-sdk-inline]] — auth-api/auth-sdk 2-layer

### platform (8)
- [[explainers/platform/monorepo-build-turbo-tsup]] — turbo pipeline + tsup
- [[explainers/platform/config-packages-presets]] — config preset extends
- [[explainers/platform/nestjs-adapter-module-pattern]] — pure+adapter + @Module
- [[explainers/platform/docker-compose-local-infra]] — 로컬 인프라 스택
- [[explainers/platform/turbo-gen-scaffolding]] — pnpm new package/app
- [[explainers/platform/grafana-prometheus-provisioning]] — 대시보드/알럿 provisioning
- [[explainers/platform/ci-verify-gate]] — GHA PR 검증 게이트
- [[explainers/platform/ci-release-changesets-docker]] — changesets + GHCR docker

---

## Decisions (ADR)

> 결정 본문은 `docs/adr/` (영어 — AI 컨텍스트 친화). 아래는 카탈로그.

- [[adr/0001-linting-formatting-strategy|ADR-0001]] — Biome + Knip + dependency-cruiser
- [[adr/0002-monorepo-foundations|ADR-0002]] — pnpm 11 + turborepo + Node 22
- [[adr/0003-package-layout-and-naming|ADR-0003]] — `packages/<category>/<pkg>` + `@repo/*`
- [[adr/0004-typescript-and-compilation-strategy|ADR-0004]] — TS strict + tsup/JIT
- [[adr/0005-backend-framework-and-orm-strategy|ADR-0005]] — NestJS + Drizzle + PostgreSQL
- [[adr/0006-auth-strategy|ADR-0006]] — Consistent Wrapped SDK
- [[adr/0007-polyglot-strategy|ADR-0007]] — Python 격리 서브트리
- [[adr/0008-result-type|ADR-0008]] — Result discriminated union
- [[adr/0009-app-error-design|ADR-0009]] — AppError + toJSON/fromJSON
- [[adr/0010-validation-zod-result-integration|ADR-0010]] — zod ↔ Result
- [[adr/0011-contracts-package-layout|ADR-0011]] — contracts / auth-contracts 분리
- [[adr/0012-auth-error-normalize|ADR-0012]] — AuthErrorCode를 errors에 흡수
- [[adr/0013-session-lifecycle|ADR-0013]] — EdDSA + rotation chain + reuse 감지
- [[adr/0014-auth-security-baseline|ADR-0014]] — SameSite/rate-limit/PKCE/argon2id
- [[adr/0015-framework-adapter-naming-and-layout|ADR-0015]] — framework adapter 카테고리
- [[adr/0016-nestjs-adapter-standard-module-pattern|ADR-0016]] — 표준 @Module class
- [[adr/0017-auth-provider-sdk-prop-contract|ADR-0017]] — CoreAuthSDK prop 계약
- [[adr/0018-auth-provider-package-location|ADR-0018]] — auth 패키지 위치
- [[adr/0019-security-linter|ADR-0019]] — 보안 linter No-Go (재평가)
- [[adr/0020-error-handling-convention|ADR-0020]] — 에러 처리 결정 트리

## 기타 문서
- `docs/notes/auth-foundation-architecture.md` — Auth Platform 설계 배경
- `docs/notes/error-handling-paradigms.md` — 에러 패러다임 비교
- [[RCA-001-lefthook-typecheck-non-blocking|RCA-001]] — lefthook typecheck 비차단 RCA
- [[RCA-002-check-secrets-false-positive|RCA-002]] — check-secrets 오탐 RCA
- `docs/turborepo-rules.md` — turbo 사용 룰 요약
