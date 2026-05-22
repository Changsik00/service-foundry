# Task List: spec-05-05

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] 백로그 업데이트 (`sdd spec new` 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + 패키지 scaffold

- [ ] `git checkout -b spec-05-05-auth-rate-limit`
- [ ] `packages/backend/auth-rate-limit/{package.json,tsconfig.json,vitest.config.ts,drizzle.config.ts,src/index.ts}` (auth-session 답습)
- [ ] `pnpm install` — workspace 등록
- [ ] `pnpm --filter @repo/backend-auth-rate-limit typecheck` 통과
- [ ] Commit: `chore(spec-05-05): scaffold @repo/backend-auth-rate-limit 패키지`

---

## Task 2: Drizzle schema + migration

- [ ] `src/schema.ts` — `failedLogins` (id/ip/accountKey/attemptedAt) + `lockouts` (accountKey/lockedAt/unlockAt/streak) + index
- [ ] `drizzle.config.ts` — auth-session 답습
- [ ] `pnpm --filter @repo/backend-auth-rate-limit db:generate` — `drizzle/0000_*.sql` 생성
- [ ] (수동 검증) Docker postgres:16 + `db:migrate` + `\d` 검증
- [ ] Commit: `feat(spec-05-05): Drizzle schema (failedLogins + lockouts) + migration`

---

## Task 3: `RateLimitStore` interface + fake (TDD)

### 3-1. 테스트 (Red)
- [ ] `src/store.test.ts` — fake store contract: insert + count(ip/account) + upsert lockout (3 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-05): RateLimitStore contract — TDD Red`

### 3-2. 구현 (Green)
- [ ] `src/store.ts` — `RateLimitStore` interface + `LockoutRow` type
- [ ] `src/fake-store.ts` — Map 기반 fake
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-05): RateLimitStore + fake store`

---

## Task 4: `drizzleRateLimitStore` (Green only — schema 기반 단순 adapter)

- [ ] `src/drizzle-store.ts` — `drizzleRateLimitStore(db)` thin adapter
- [ ] `src/index.ts` re-export
- [ ] typecheck pass — drizzle query 정합성 확인
- [ ] Commit: `feat(spec-05-05): drizzleRateLimitStore — thin adapter`

---

## Task 5: `checkRateLimit` / `recordFailure` / `recordSuccess` (TDD)

### 5-1. 테스트 (Red)
- [ ] `src/rate-limit.test.ts` — IP boundary / account boundary / 합산 (둘 다 카운트) / window slide / 성공 시 account reset (5 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-05): rate-limit 도메인 함수 — TDD Red`

### 5-2. 구현 (Green)
- [ ] `src/rate-limit.ts` — `RATE_LIMIT_DEFAULTS` + `checkRateLimit` / `recordFailure` / `recordSuccess`
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-05): rate-limit 도메인 함수 — sliding window`

---

## Task 6: `isLocked` + lockout state machine (TDD)

### 6-1. 테스트 (Red)
- [ ] `src/lockout.test.ts` — 5회 fail → locked / cooldown 진행 (만료 전 locked, 후 unlocked) / progressive backoff (반복 lockout ×2) / 성공 reset / 만료 자동 unlock (5 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-05): lockout state machine — TDD Red`

### 6-2. 구현 (Green)
- [ ] `src/lockout.ts` — `LOCKOUT_DEFAULTS` + `isLocked` + lockout 평가 helper (recordFailure 가 호출)
- [ ] `rate-limit.ts` 의 `recordFailure` 가 lockout 평가 통합
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-05): lockout state machine — progressive backoff`

---

## Task 7: CSRF token (TDD)

### 7-1. 테스트 (Red)
- [ ] `src/csrf.test.ts` — round-trip / wrong session id false / tamper false / 빈 input false (4 케이스)
- [ ] Red 확인
- [ ] Commit: `test(spec-05-05): CSRF token — TDD Red`

### 7-2. 구현 (Green)
- [ ] `src/csrf.ts` — `issueCsrfToken` (HMAC-SHA256) + `verifyCsrfToken` (timing-safe)
- [ ] `src/index.ts` re-export
- [ ] Pass 확인
- [ ] Commit: `feat(spec-05-05): CSRF token — HMAC-SHA256 double-submit`

---

## Task 8: 실 PG 검증 (Integration)

- [ ] Docker postgres:16 부트
- [ ] `db:migrate` → schema 적용
- [ ] `\d failed_logins` / `\d lockouts` 확인
- [ ] round-trip: insert failure + count + lockout upsert + isLocked
- [ ] cleanup (Docker rm)
- [ ] walkthrough 에 검증 로그 기록
- [ ] Commit: 없음 (검증 task)

---

## Task 9: README

- [ ] `packages/backend/auth-rate-limit/README.md` — auth-session/auth-jwt 답습. 사용 예제 (signin flow / lockout / CSRF) + 핵심 설계 결정 + Rate Limit 정공법 (미래 검토)
- [ ] Commit: `docs(spec-05-05): auth-rate-limit README 작성`

---

## Task 10: 최종 검증

- [ ] `pnpm --filter @repo/backend-auth-rate-limit lint` 통과
- [ ] `pnpm --filter @repo/backend-auth-rate-limit typecheck` 통과
- [ ] `pnpm --filter @repo/backend-auth-rate-limit test` 전체 PASS
- [ ] 루트 `pnpm typecheck` 통과
- [ ] depcruise 그린
- [ ] Commit: 없음

---

## Task N: Ship

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-05-05): ship walkthrough and pr description`
- [x] **Push**: `git push -u origin spec-05-05-auth-rate-limit`
- [x] **PR 생성**: https://github.com/Changsik00/service-foundry/pull/37 (target: `phase-05-auth-core-security`)

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 10 + Ship |
| **실 commit 수** | 9 (planning 1 + scaffold 1 + schema 1 + store+fake 1 + drizzle adapter 1 + 도메인 3 + README 1) + ship 1 예정 |
| **테스트** | 18/18 PASS (4 files) / 실 PG migration ✓ |
| **품질 게이트** | lint ✓ / typecheck ✓ / depcruise ✓ |
| **현재 단계** | Ship — push 대기 |
| **마지막 업데이트** | 2026-05-21 12:00 |
