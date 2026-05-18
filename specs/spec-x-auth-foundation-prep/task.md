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

- [x] `docs/adr/0012-auth-error-normalize.md` 신규 (5 Decision):
  - [x] Decision 1: `AuthErrorCode`를 `@repo/errors` 도메인 코드로 흡수 (별 패키지 ❌)
  - [x] Decision 2: AuthErrorCode 13 코드 표 (PROVIDER_ERROR + ACCOUNT_LOCKED 분리 포함)
  - [x] Decision 3: Provider Normalize Helper 각 `auth-{provider}` 내부 배치
  - [x] Decision 4: Account Enumeration 방지 원칙
  - [x] Decision 5: `AuthError extends AppError` 미생성 (ADR-0009 flat code 일관)
  - [x] Alternatives 4건 비채택
  - [x] Related: ADR-0009 / 0006 / 0010
- [x] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0012 — auth error normalize`

---

## Task 6: ADR-0013 신규 — Session Lifecycle

- [x] `docs/adr/0013-session-lifecycle.md` 신규 (8 Decision):
  - [x] D1: Access Token JWT EdDSA, 5~15min TTL
  - [x] D2: Algorithm = EdDSA (HS256/RS256/ES256 비교 표)
  - [x] D3: JWT Claims (필수/권장/금지/조건부)
  - [x] D4: Refresh Token opaque random 32+ bytes, DB hashed, 14~30일
  - [x] D5: Rotation Chain + Reuse Detection (RFC 6819 필수)
  - [x] D6: Session Model 13 필드 (geo / revokedReason 포함)
  - [x] D7: Key Rotation 90일 + JWKS endpoint + jti deny list 옵션
  - [x] D8: `@repo/auth-session` 별 패키지 결정 (jwt와 책임 분리)
  - [x] Alternatives 6건 비채택
  - [x] Related: ADR-0006 / 0014 / 0005 + RFC 6819
- [x] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0013 — session lifecycle (rotation + reuse detection)`

---

## Task 7: ADR-0014 신규 — Security Baseline

- [x] `docs/adr/0014-auth-security-baseline.md` 신규 (7 Decision):
  - [x] D1: CSRF (SameSite=Lax + Origin/Referer 검증)
  - [x] D2: Rate Limiting (IP+account+progressive backoff)
  - [x] D3: Account Lockout (응답 동일 — enumeration 방지)
  - [x] D4: OAuth PKCE 강제 + State (cookie-bound) + Nonce (OIDC) + redirect_uri allowlist
  - [x] D5: Password Hash = argon2id
  - [x] D6: Cookie (httpOnly + Secure + SameSite=Lax + Path=/) — localStorage 금지
  - [x] D7: Step-up Auth (민감 작업 시 재인증)
  - [x] Alternatives 8건 비채택
  - [x] Related: ADR-0006 / 0012 / 0013 + RFC 9700 / OWASP
- [x] Commit: `docs(spec-x-auth-foundation-prep): add ADR-0014 — auth security baseline`

---

## Task 8: design note — auth-foundation-architecture

- [x] `docs/notes/auth-foundation-architecture.md` 신규 (2차안 본문 + ADR cross-ref 표 + phase 매핑 표):
  - [x] 목표 / 핵심 컨셉 / 핵심 철학 / 전체 구조 / 패키지 역할
  - [x] Authentication vs Authorization / Identity vs Session 분리
  - [x] Provider 패키지 설계 원칙 (LCD 함정 회피 + Core Surface)
  - [x] Validation 전략 (Contract-First + FE/BE)
  - [x] Error Architecture (ADR-0012 cross-ref)
  - [x] Session 전략 / JWT 구체 결정사항 (ADR-0013 cross-ref)
  - [x] 보안 기본기 (ADR-0014 cross-ref)
  - [x] 핵심 플로우 (password reset / email verify / step-up / session fixation)
  - [x] MFA/Passkey / 권한 시스템 (RBAC + ABAC defer)
  - [x] Frontend/Backend 통합 / API 설계 / Cookie 전략 / OAuth 전략
  - [x] Auth Event System / Audit Log / Multi App / Observability / Admin Tools
  - [x] 추천 기술 스택 + Provider 라이브러리 + 구현 순서 (phase 매핑)
- [x] Memory 갱신:
  - [x] `project_boilerplate_locked_stack.md` — Prisma 제거 + Drizzle 단일 명시 + auth foundation 13 패키지 + Auth 영역 참조 가이드
  - [x] `auth_foundation_architecture.md` 신규 — 결정 요약 + ADR cross-ref + phase 분산
  - [x] `MEMORY.md` index 갱신
- [x] Commit: `docs(spec-x-auth-foundation-prep): add design note + update memory (Drizzle single)`

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
