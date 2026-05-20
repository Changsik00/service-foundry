# Task List: spec-05-02 auth-session

## Pre-flight
- [x] spec / plan / task 작성
- [x] Plan Accept

---

## Task 1: 브랜치 생성
- [x] `git checkout -b spec-05-02-auth-session`

---

## Task 2: 패키지 scaffold
- [x] `packages/backend/auth-session/{package.json, tsconfig.json, vitest.config.ts, drizzle.config.ts, README.md}`
- [x] `src/index.ts` stub
- [x] `pnpm install`
- [x] Commit: `feat(spec-05-02): @repo/backend-auth-session 패키지 scaffold`

---

## Task 3: schema + token primitives
- [x] `src/schema.ts` (Drizzle sessions pgTable)
- [x] `src/token.ts` (generateRefreshToken / hashToken)
- [x] `src/token.test.ts` (6 test — token 길이/base64url/entropy + hash deterministic/distinct/SHA-256 64자)
- [x] Commit: `feat(spec-05-02): Drizzle schema + token primitives`

---

## Task 4: session functions (TDD)

### 4-1. test (Red)
- [x] `src/store.ts` (SessionStore interface — Repository 패턴 답습)
- [x] `src/session.test.ts` (6 test — fake in-memory store, drizzle mock 대신 Repository 의존)
- [x] stub session.ts (AppError throw)
- [x] Commit: `test(spec-05-02): session.test.ts — TDD Red (6 fail)`

### 4-2. 구현 (Green)
- [x] `src/session.ts` 본체 (createSession / rotateSession / revokeSession)
- [x] test PASS (12/12)
- [x] Commit: `feat(spec-05-02): session 함수 구현 — TDD Green (12 pass)`

---

## Task 5: drizzle-kit migration + adapter
- [x] `src/drizzle-store.ts` (drizzleSessionStore factory — production adapter)
- [x] `src/index.ts` barrel
- [x] `pnpm --filter @repo/backend-auth-session db:generate` → drizzle/0000_funny_jane_foster.sql
- [x] README 박음 (부트 가이드 + 수동 검증)
- [x] Commit: `feat(spec-05-02): drizzle adapter + 0000 migration`

---

## Task 6: 통합 검증
- [x] lint / typecheck / test / depcruise 모두 그린
- [x] 실 PG 검증 — Docker postgres:16 + db:migrate + `\d sessions` + round-trip + cleanup (서브에이전트 자동 검증 완료, phase-03 의 *postgres-pkg 실 PG 검증 이연* 해소)
- [x] `sdd test passed`

---

## Task 7: Ship
- [ ] walkthrough.md / pr_description.md
- [ ] `sdd ship`
- [ ] push + PR (base = phase-05-auth-core-security)
- [ ] 사용자 알림

---

| 항목 | 값 |
|---|---|
| **총 Task** | 7 |
| **실 commit** | 5 (T2 scaffold / T3 schema+token / T4-1 Red / T4-2 Green / T5 migration+adapter) + T7 ship |
| **현재 단계** | Ship |
