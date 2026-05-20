# Task List: spec-05-02 auth-session

## Pre-flight
- [x] spec / plan / task 작성
- [ ] Plan Accept

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-05-02-auth-session`

---

## Task 2: 패키지 scaffold
- [ ] `packages/backend/auth-session/{package.json, tsconfig.json, vitest.config.ts, drizzle.config.ts, README.md}`
- [ ] `src/index.ts` stub
- [ ] `pnpm install`
- [ ] Commit: `feat(spec-05-02): @repo/backend-auth-session 패키지 scaffold`

본 commit 에 spec/plan/task + phase 표 + queue 동봉.

---

## Task 3: schema + token primitives
- [ ] `src/schema.ts` (Drizzle sessions pgTable)
- [ ] `src/token.ts` (generateRefreshToken / hashToken)
- [ ] `src/token.test.ts` (2 test)
- [ ] Commit: `feat(spec-05-02): Drizzle schema + token primitives`

---

## Task 4: session functions (TDD)

### 4-1. test (Red)
- [ ] `src/session.test.ts` (5 test — drizzle mock via `vi.mock("@repo/backend-database")`)
- [ ] stub session.ts
- [ ] Commit: `test(spec-05-02): session functions (Red)`

### 4-2. 구현 (Green)
- [ ] `src/session.ts` 본체 (createSession / rotateSession / revokeSession)
- [ ] `src/index.ts` barrel
- [ ] test PASS
- [ ] Commit: `feat(spec-05-02): createSession/rotateSession/revokeSession (rotation + reuse detection)`

---

## Task 5: drizzle-kit migration
- [ ] `pnpm --filter @repo/backend-auth-session db:generate` → drizzle/0000_*.sql
- [ ] README 박음 (부트 가이드 + 수동 검증)
- [ ] Commit: `chore(spec-05-02): drizzle migration 박음 + README 수동 검증 가이드`

---

## Task 6: 통합 검증
- [ ] lint / typecheck / test / depcruise 모두 그린
- [ ] (수동, 사용자) 로컬 PG 부트 + db:migrate + 검증
- [ ] `sdd test passed`

---

## Task 7: Ship
- [ ] walkthrough.md / pr_description.md
- [ ] `sdd ship`
- [ ] push + PR (base = phase-05-auth-core-security)
- [ ] 사용자 알림 + 수동 PG 검증 가이드

---

| 항목 | 값 |
|---|---|
| **총 Task** | 7 |
| **예상 commit** | 6 (T2 scaffold + T3 schema/token + T4 Red/Green + T5 migration + T7 ship) |
| **현재 단계** | Planning |
