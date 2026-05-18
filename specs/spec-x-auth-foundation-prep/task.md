# Task List: spec-x-auth-foundation-prep

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 본 spec-x는 *순수 docs* 작업 — prototype/코드 없음.

## Pre-flight

- [x] Spec ID 확정 + 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + spec/plan/task.md commit

- [x] `git checkout -b spec-x-auth-foundation-prep`
- [x] `git add specs/spec-x-auth-foundation-prep/{spec,plan,task}.md`
- [x] Commit: `docs(spec-x-auth-foundation-prep): scaffold spec/plan/task for auth foundation prep` (`3801fcd`)

---

## Task 2: queue.md + 9 phase.md 재조정

- [x] `backlog/queue.md`: 본 spec-x를 진행 중 spec-x에 표기 + 대기 phase 9개로 갱신 + Icebox 정리.
- [x] `backlog/phase-03.md`: Backend Foundation 본문 갱신 (블로커 해소 + auth 제외).
- [x] `backlog/phase-04.md`: Frontend Foundation 본문 갱신 (auth 제외).
- [x] `backlog/phase-05.md`: Auth Core + Security 본문 신규 작성.
- [x] `backlog/phase-06.md`: Auth Integration 본문 신규 작성.
- [x] `backlog/phase-07.md`: Auth Extension 본문 신규 작성.
- [x] `backlog/phase-08.md`: Provider Adapters 본문 신규 작성.
- [x] `backlog/phase-09.md`: Apps + Admin Tools 본문 신규 작성.
- [x] `backlog/phase-10.md`: Ops & Tooling 본문 신규 작성.
- [x] `backlog/phase-11.md`: CI/CD 본문 신규 작성.
- [x] Commit: `docs(spec-x-auth-foundation-prep): restructure 9 phases (option A — auth foundation 완전판)` (`19553fb`)

---

## Task 3: ADR-0005 본문 작성 (NestJS + Drizzle 확정)

- [x] `docs/adr/0005-backend-framework-and-orm-strategy.md` 상태 + Decision 본문 갱신 (보류 분석은 향후 참조용 보존).
- [x] Decision: NestJS + Drizzle (단일) + PostgreSQL.
- [x] Rationale: framework Decorator DI / ORM session storage 강결합 / 두 ORM 운영 비용.
- [x] Alternatives 5건 비채택 분석.
- [x] Memory 정정 가이드 명시.
- [x] Commit: `docs(spec-x-auth-foundation-prep): accept ADR-0005 — NestJS + Drizzle (single ORM)` (`63eccc3`)

---

## Task 4: ADR-0006 본문 작성 (Auth Platform 전략)

- [x] `docs/adr/0006-auth-strategy.md` 본문 갱신 (Decision 섹션 추가 + 보류 본문 보존):
  - [x] 상태: 보류 → **Accepted (2026-05-18)**
  - [x] 5 Decision 박음 (한 앱 한 Provider / Consistent Wrapped SDK / AuthResult union / Identity-Session 분리 / Engine-Platform 분리)
  - [x] Core Surface AuthSDK + AuthResult interface 예시
  - [x] Alternatives 5건 (LCD / Better-auth / Auth.js / Lucia / 자체 OAuth)
  - [x] 패키지 구조 + Cross-ref ADR (0012/13/14) 표
  - [x] Related: ADR-0005 / 0012 / 0013 / 0014 + design note
- [x] Commit: `docs(spec-x-auth-foundation-prep): accept ADR-0006 — Auth Platform strategy (Consistent Wrapped SDK)`

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
