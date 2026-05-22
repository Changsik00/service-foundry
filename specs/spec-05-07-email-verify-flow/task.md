# Task List: spec-05-07

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-05.md SPEC 표 갱신 — sdd spec new)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-05-07-email-verify-flow` (base: `phase-05-auth-core-security`)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: email_verify_tokens Schema + Migration

### 2-1. 파일 작성
- [ ] `apps/api/src/infra/schema/email-verify-tokens.ts` — email_verify_tokens 테이블
- [ ] `apps/api/src/infra/schema/index.ts` — emailVerifyTokens 추가
- [ ] `apps/api/src/infra/schema/local.ts` — emailVerifyTokens re-export

### 2-2. drizzle-kit migration
- [ ] `pnpm --filter @apps/api db:generate` → `drizzle/0001_email_verify_tokens.sql` 생성 확인

### 2-3. 검증
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-05-07): email_verify_tokens schema + migration`

---

## Task 3: EmailVerifyService + request 엔드포인트

### 3-1. Store 작성
- [ ] `apps/api/src/auth/email-verify.stores.ts` — EmailVerifyTokenStore 인터페이스 + Drizzle 구현 + DI tokens
- [ ] `apps/api/src/auth/password-reset.stores.ts` — UserStore에 `updateEmailVerified` 추가

### 3-2. 단위 테스트 (TDD Red → Green)
- [ ] `apps/api/src/auth/email-verify.service.test.ts` 작성 (request 3케이스)
  - 케이스 1: 인증 필요 user → token DB 저장, TTL = 24h
  - 케이스 2: 미존재 email → token 저장 없음 (enumeration-safe)
  - 케이스 3: 이미 인증된 user → token 저장 없음 (silent)
- [ ] 테스트 실행 → Fail 확인

### 3-3. 서비스 + 엔드포인트 구현
- [ ] `apps/api/src/auth/email-verify.service.ts` — `request(email)` 구현
- [ ] `apps/api/src/auth/auth.controller.ts` — `POST /auth/email/verify/request` 추가
- [ ] `apps/api/src/auth/auth.module.ts` — EmailVerifyService + stores 추가
- [ ] 테스트 실행 → PASS 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-05-07): email verify request endpoint — 24h TTL + enumeration-safe`

---

## Task 4: EmailVerifyService.confirm + confirm 엔드포인트

### 4-1. 단위 테스트 (TDD Red → Green)
- [ ] `apps/api/src/auth/email-verify.confirm.service.test.ts` 작성 (confirm 4케이스)
  - 케이스 4: 유효 token → email_verified=true + used_at 설정
  - 케이스 5: 만료 token → 갱신 없음 (silent)
  - 케이스 6: 재사용 token → 갱신 없음 (single-use)
  - 케이스 7: 미존재 token → 갱신 없음 (enumeration-safe)
- [ ] 테스트 실행 → Fail 확인

### 4-2. 구현
- [ ] `email-verify.service.ts`에 `confirm(token)` 추가
- [ ] `auth.controller.ts`에 `POST /auth/email/verify/confirm` 추가
- [ ] 테스트 실행 → PASS 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-05-07): email verify confirm — token check + email_verified update`

---

## Task 5: E2E 테스트 + 품질 점검

### 5-1. E2E 테스트 (real PG)
- [ ] Docker postgres 기동 (port 5434)
- [ ] auth-session + auth-rate-limit + apps/api 마이그레이션 (0000 + 0001)
- [ ] `apps/api/src/auth/auth.e2e.test.ts`에 email verify E2E 추가
  - request (미존재 email) → 200
  - request (잘못된 payload) → 4xx
  - confirm (미존재 token) → 200
  - confirm (짧은 token payload) → 4xx
- [ ] `DATABASE_URL=... pnpm --filter @apps/api exec vitest run` PASS

### 5-2. 품질 점검
- [ ] `pnpm --filter @apps/api exec biome check src/` PASS
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `test(spec-05-07): E2E — email verify round-trip (real PG)`

---

## Task 6: Ship

> `/hk-ship` 절차를 따릅니다.

- [ ] 전체 테스트 재실행 → PASS
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-05-07): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-05-07-email-verify-flow`
- [ ] **PR 생성**: target `phase-05-auth-core-security`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (브랜치 포함) |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
