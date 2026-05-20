# Task List: spec-05-01 auth-contracts-extend

## Pre-flight

- [x] spec / plan / task 작성
- [ ] Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-05-01-auth-contracts-extend` (시작: `phase-05-auth-core-security`)
- Commit 없음

---

## Task 2: catalog ts-pattern + spec docs

- [ ] `pnpm-workspace.yaml` catalog 에 `ts-pattern` 추가
- [ ] `packages/shared/auth-contracts/package.json` dependencies: `ts-pattern` catalog
- [ ] `pnpm install`
- [ ] Commit: `chore(spec-05-01): catalog 에 ts-pattern 추가`

본 commit 에 spec-05-01 문서 (spec/plan/task) + phase-05.md spec 표 auto-update + queue 동봉.

---

## Task 3: 5 schema + AuthResult + MfaChallenge (TDD)

### 3-1. test 작성 (Red)
- [ ] `packages/shared/auth-contracts/src/index.test.ts` — 5 schema parse + AuthResult match + MfaChallenge shape
- [ ] stub 박은 채로 typecheck 통과 + test Red
- [ ] Commit: `test(spec-05-01): auth schema + AuthResult union + ts-pattern (Red)`

### 3-2. 구현 (Green)
- [ ] `packages/shared/auth-contracts/src/index.ts` 확장:
  - Password / Token primitive zod
  - 5 Input schema (SignIn / SignUp / Refresh / PasswordResetRequest / PasswordResetConfirm / EmailVerifyRequest / EmailVerifyConfirm — 실은 7 개)
  - 각각 type alias (z.output)
  - MfaChallenge interface
  - AuthResult discriminated union
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-05-01): 5 auth schema + AuthResult union + MfaChallenge (ts-pattern)`

---

## Task 4: 통합 검증

- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm test` PASS
- [ ] `pnpm exec depcruise` 0 violations
- [ ] `sdd test passed`
- Commit 없음

---

## Task 5: Ship

- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] `sdd ship`
- [ ] push + PR (base = phase-05-auth-core-security)
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task** | 5 |
| **예상 commit** | 4 (T2 catalog + T3 Red/Green + T5 ship) |
| **현재 단계** | Planning (Plan Accept 대기) |
