# Task List: spec-x-auth-foundation-prep

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 본 spec-x는 *순수 docs* 작업 — prototype/코드 없음.

## Pre-flight

- [x] Spec ID 확정 + 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + spec/plan/task.md commit

- [ ] `git checkout -b spec-x-auth-foundation-prep`
- [ ] `git add specs/spec-x-auth-foundation-prep/{spec,plan,task}.md`
- [ ] Commit: `docs(spec-x-auth-foundation-prep): scaffold spec/plan/task for auth foundation prep`

---

## Task 2: queue.md + 9 phase.md 재조정

- [ ] `backlog/queue.md`: 본 spec-x를 진행 중 spec-x에 표기.
- [ ] `backlog/phase-03.md`: 본문 갱신
  - 블로커 해소 문구 제거 ("ADR-0005 / 0006 결정 전까지 블록 상태" → 삭제)
  - 상태: Planning (블로커 해소 대기) → **Planning (진입 가능)**
  - 제목/요점: "Backend Primitives" → **"Backend Foundation"**
  - 스코프: NestJS + Drizzle + apps/api scaffold + health/config/observability hooks (auth 제외 명시)
  - 본래 "10 backend 패키지" → phase-05~08로 *분산* 명시
- [ ] `backlog/phase-04.md`: 본문 갱신
  - 제목/요점: "Apps" → **"Frontend Foundation"**
  - 스코프: Vite/Next + apps/web-* scaffold + TanStack Query + ui/sdk 기본 (auth 제외)
  - 본래 "Apps + login slice"는 phase-09로 이동 명시
- [ ] `backlog/phase-05.md`: 본문 *신규 작성* (Auth Core + Security)
  - 2차안 §Phase 1+2 통합
  - 예정 패키지: `@repo/auth-contracts` 확장 / `@repo/auth-session` / `@repo/auth-jwt` / `@repo/auth-security`
  - 플로우: password reset / email verification
  - Related ADR: 0005 / 0006 / 0009 / 0010 / 0012 / 0013 / 0014
- [ ] `backlog/phase-06.md`: 본문 *신규 작성* (Auth Integration)
  - 2차안 §Phase 3
  - 예정 패키지: `@repo/auth-nestjs` / `@repo/auth-react`
  - Cookie 전략 + Audit & Events
- [ ] `backlog/phase-07.md`: 본문 *신규 작성* (Auth Extension)
  - 2차안 §Phase 4
  - 예정 패키지: `@repo/auth-oauth` / `@repo/auth-mfa` / `@repo/auth-passkey`
- [ ] `backlog/phase-08.md`: 본문 *신규 작성* (Provider Adapters)
  - 2차안 §Phase 5
  - 예정 패키지: `@repo/auth-firebase` / `@repo/auth-supabase` / `@repo/auth-testing`
  - Core Surface 컨벤션 실증
- [ ] `backlog/phase-09.md`: 본문 *신규 작성* (Apps + Admin Tools)
  - vertical slice + apps/admin or auth-admin 패키지
  - 본래 phase-04 "Apps" 본문 이전 + Admin Tools 추가
- [ ] `backlog/phase-10.md`: 본문 갱신 (Ops & Tooling)
  - 본래 phase-05 본문 이전 + auth observability dashboards 추가
- [ ] `backlog/phase-11.md`: 본문 *신규 작성* (CI/CD)
  - 본래 phase-06 본문 이전
- [ ] Commit: `docs(spec-x-auth-foundation-prep): restructure 9 phases (option A — auth foundation 완전판)`

---

## Task 3: ADR-0005 본문 작성 (NestJS + Drizzle 확정)

- [ ] `docs/adr/0005-backend-framework-and-orm-strategy.md` 본문 *전면 갱신*:
  - 상태: 보류 → **Accepted (2026-05-18)**
  - Decision: NestJS + Drizzle (단일)
  - Rationale 6건: framework / ORM / Auth integration / Session storage / 운영 비용 / memory 정정
  - Alternatives 5건: Fastify+Drizzle / Hono+Drizzle / NestJS+Prisma / NestJS+raw SQL / Bun+Elysia
  - Memory 충돌 명시 + 정정 가이드 (`project_boilerplate_locked_stack` Prisma 제거)
  - Related: ADR-0002 (catalog) / ADR-0004 (JIT) / ADR-0006 (auth strategy) / ADR-0013 (session)
- [ ] Commit: `docs(spec-x-auth-foundation-prep): accept ADR-0005 — NestJS + Drizzle (single ORM)`

---

## Task 4: ADR-0006 본문 작성 (Auth Platform 전략)

- [ ] `docs/adr/0006-auth-strategy.md` 본문 *전면 갱신*:
  - 상태: 보류 → **Accepted (2026-05-18)**
  - 5 Decision:
    1. "한 앱 한 Provider" — runtime 추상화 ❌
    2. "Consistent Wrapped SDK" 컨벤션 — Core Surface + Provider별 강점
    3. AuthResult union (session / mfa_required / email_verification_required) — 처음부터
    4. Identity vs Session 분리 + Authentication vs Authorization 분리
    5. "Auth Engine 외부 라이브러리, Auth Platform 자체 구축" 원칙
  - Core Surface interface 예시 (AuthSDK + AuthResult)
  - Alternatives 4건: LCD 추상화 (1차안) / Better-auth / Auth.js / Lucia
  - Related: ADR-0005 / 0012 / 0013 / 0014 + design note
- [ ] Commit: `docs(spec-x-auth-foundation-prep): accept ADR-0006 — Auth Platform strategy (Consistent Wrapped SDK)`

---

## Task 5: ADR-0012 신규 — Auth Error Normalize

- [ ] `docs/adr/0012-auth-error-normalize.md` 신규:
  - frontmatter: type: convention, status: accepted
  - Context: ADR-0009(flat code) + 2차안의 AuthErrorCode 11개
  - Decision: `AuthErrorCode`를 `@repo/errors` 도메인 코드로 *흡수* (별 `auth-errors` 패키지 ❌)
  - 11 코드 명시: INVALID_CREDENTIALS / INVALID_TOKEN / TOKEN_EXPIRED / SESSION_REVOKED / USER_NOT_FOUND / EMAIL_ALREADY_EXISTS / EMAIL_NOT_VERIFIED / MFA_REQUIRED / MFA_INVALID_CODE / INSUFFICIENT_PERMISSION / TOO_MANY_ATTEMPTS / ACCOUNT_LOCKED / PROVIDER_ERROR
  - Provider normalize helper 위치: `auth-{provider}` 각 패키지 내부
  - Account enumeration 방지 원칙
  - Alternatives: 별 `auth-errors` 패키지 / `class AuthError extends AppError` / Per-provider error 그대로
  - Related: ADR-0009 / 0006 / 0010
- [ ] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0012 — auth error normalize`

---

## Task 6: ADR-0013 신규 — Session Lifecycle

- [ ] `docs/adr/0013-session-lifecycle.md` 신규:
  - frontmatter: type: convention, status: accepted
  - Context: 2차안 §Session 전략 / RFC 6819 Reuse Detection
  - Decision 7건:
    1. Access Token: JWT EdDSA, 5~15min TTL
    2. JWT Claims: sub, iat, exp, iss, aud, jti
    3. Refresh Token: opaque random 32+ bytes, DB hashed, 14~30일
    4. Rotation: `refreshTokenFamily` chain
    5. Reuse Detection: invalidate된 refresh 재진입 → 모든 session revoke + alert
    6. Key Rotation: 90일 + JWKS endpoint (`/.well-known/jwks.json`)
    7. Session Model: 12 필드 (위 spec.md 참조)
  - `@repo/auth-session` 별 패키지 결정 (jwt와 책임 분리)
  - 라이브러리: jose (JWT) / argon2 (password)
  - Alternatives: HS256 / Access token only (refresh 없음) / Single key (rotation 없음) / Reuse detection 안 함
  - Related: ADR-0006 / 0014
- [ ] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0013 — session lifecycle (rotation + reuse detection)`

---

## Task 7: ADR-0014 신규 — Security Baseline

- [ ] `docs/adr/0014-auth-security-baseline.md` 신규:
  - frontmatter: type: convention, status: accepted
  - Context: 2차안 §보안 기본기 / RFC 9700 (PKCE)
  - Decision 7건:
    1. CSRF: SameSite=Lax cookie + Origin/Referer 검증
    2. Rate Limiting: IP+account+progressive backoff (`auth-security` 패키지)
    3. Account Lockout: N회 실패 시 lockout, 응답 동일 (enumeration 방지)
    4. OAuth: PKCE 강제 + State (cookie-bound) + Nonce (OIDC)
    5. Password Hash: argon2
    6. Cookie: httpOnly + Secure + SameSite=Lax + Path=/ (localStorage JWT 금지)
    7. Step-up Auth: 비밀번호/이메일 변경 / 결제 변경 시 재인증
  - Alternatives: bcrypt / scrypt / Implicit OAuth / SameSite=None / Frontend-only OAuth
  - Related: ADR-0006 / 0013
- [ ] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0014 — auth security baseline`

---

## Task 8: design note — auth-foundation-architecture

- [ ] `docs/notes/auth-foundation-architecture.md` 신규:
  - 2차안 *전체 본문* 박음 (목표 / 핵심 철학 / 전체 구조 / 패키지 역할 / Auth vs Authorization / Identity vs Session / Provider SDK 설계 원칙 / Core Surface / Validation 전략 / Error Architecture / Session 전략 / JWT 구체 결정 / 보안 기본기 / 핵심 플로우 / MFA/Passkey / 권한 시스템 / Frontend 통합 / Backend 통합 / API 설계 / Cookie 전략 / OAuth 전략 / Auth Event System / Audit Log / Multi App / Observability / Admin Tools / 추천 기술 스택 / Provider 라이브러리 / 구현 순서)
  - ADR cross-ref 표: 각 결정이 어느 ADR에 박혔는지
  - phase 매핑 표: 어느 patterns/패키지가 어느 phase에 박힐지
- [ ] Memory 갱신: `/Users/dennis/.claude/projects/-Users-dennis-Project-ck-service-foundry/memory/project_boilerplate_locked_stack.md` Prisma 제거 (Drizzle 단일)
- [ ] Commit: `docs(spec-x-auth-foundation-prep): add design note + update memory (Drizzle single)`

---

## Task 9: Ship (필수)

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 그린 (코드 변경 없음 → 회귀 0 확인).
- [ ] `bash .harness-kit/bin/sdd test passed`.
- [ ] **walkthrough.md 작성** (결정 요약 + 2차안 채택 근거 + memory 정정 기록 + 발견 사항).
- [ ] **pr_description.md 작성**.
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-x-auth-foundation-prep`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 9 (T1 브랜치 + T2 phase 재조정 + T3~7 ADR 5개 + T8 design note + T9 ship) |
| **예상 commit 수** | 9 |
| **예상 LOC** | ~3000 docs (9 phase.md ~1500 + 5 ADR ~1000 + design note ~600) |
| **예상 test 수** | 0 (코드 변경 없음) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-18 |
