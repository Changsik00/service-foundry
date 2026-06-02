# Task List: spec-08-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new auth-testing`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 백로그 업데이트 (phase-08.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + auth-testing 패키지 스캐폴딩

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-08-03-auth-testing` (from `phase-08-provider-adapters`)

### 1-2. 패키지 초기화
- [ ] `packages/frontend/auth-testing/` 디렉토리 + `package.json` / `tsconfig.json` / `vitest.config.ts` 생성
- [ ] `packages/frontend/auth-testing/src/index.ts` — `export {};` placeholder (TS18003 방지)
- [ ] `pnpm install --ignore-scripts`
- [ ] Commit: `chore(spec-08-03): auth-testing 패키지 스캐폴딩`

---

## Task 2: createMockAuthSDK 구현 (TDD)

### 2-1. index.test.ts 작성 → Fail
- [ ] `packages/frontend/auth-testing/src/index.test.ts` 작성
  - `createMockAuthSDK()` — 기본 상태 (currentUser null, signInResult 실패)
  - `signIn` 성공 시 `_state.currentUser` 업데이트 + `_calls.signIn` 기록
  - `signIn` 실패 시 `AuthResult { success: false }` 반환
  - `signUp` 성공/실패
  - `signOut` — currentUser null + signOutCount 증가
  - `getCurrentUser` — _state.currentUser 반환 + getCurrentUserCount 증가
  - `refresh` — _state.refreshResult 반환 + refreshCount 증가
  - `_reset()` — 상태/호출 초기화
  - MFA 메서드 → throw Error
  - `createMockAuthSDK(initial)` — 초기 상태 오버라이드
- [ ] `pnpm --filter frontend-auth-testing test` → Fail 확인

### 2-2. index.ts 구현 → Pass
- [ ] `packages/frontend/auth-testing/src/index.ts` — `createMockAuthSDK` 구현
- [ ] `pnpm --filter frontend-auth-testing test` → PASS
- [ ] `pnpm -r typecheck` → PASS (전체 패키지)
- [ ] Commit: `feat(spec-08-03): createMockAuthSDK — AuthSDK 테스트용 mock 팩토리`

---

## Task 3: Ship

- [ ] `pnpm --filter frontend-auth-testing test` → 전체 PASS
- [ ] `pnpm -r typecheck` → PASS
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-08-03): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-08-03-auth-testing`
- [ ] **PR 생성** (base: `phase-08-provider-adapters`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
