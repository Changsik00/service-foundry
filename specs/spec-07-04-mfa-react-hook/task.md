# Task List: spec-07-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new mfa-react-hook`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase.md SPEC 표 자동 갱신)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + auth-contracts AuthSDK 확장

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-07-04-mfa-react-hook` (from `phase-07-auth-extension`)

### 1-2. auth-contracts 확장
- [ ] `packages/shared/auth-contracts/src/index.ts` — AuthSDK에 메서드 5개 추가
- [ ] `pnpm --filter auth-contracts test` → PASS 확인
- [ ] `pnpm --filter auth-contracts typecheck` → PASS 확인
- [ ] Commit: `feat(spec-07-04): auth-contracts — AuthSDK에 mfa/passkey 메서드 추가`

---

## Task 2: useMfaChallenge hook + 테스트

### 2-1. 의존성 추가
- [ ] `pnpm-workspace.yaml` catalog에 `@simplewebauthn/browser: "^13.1.1"` 추가
- [ ] `packages/frontend/auth-react/package.json`에 `@simplewebauthn/browser` 의존성 추가
- [ ] `pnpm install`

### 2-2. useMfaChallenge hook + 테스트 (TDD)
- [ ] `packages/frontend/auth-react/src/mfa.test.ts` 작성 → Fail 확인
- [ ] `packages/frontend/auth-react/src/mfa.ts` 구현 → Pass 확인
- [ ] `pnpm --filter frontend-auth-react test` → PASS
- [ ] Commit: `feat(spec-07-04): useMfaChallenge hook (TOTP + Passkey 인증)`

---

## Task 3: usePasskeyRegister hook + 테스트 + export

### 3-1. usePasskeyRegister hook + 테스트 (TDD)
- [ ] `packages/frontend/auth-react/src/passkey.test.ts` 작성 → Fail 확인
- [ ] `packages/frontend/auth-react/src/passkey.ts` 구현 → Pass 확인
- [ ] `packages/frontend/auth-react/src/index.ts` export 추가
- [ ] `pnpm --filter frontend-auth-react test` → PASS
- [ ] `pnpm -r typecheck` → PASS (36개 패키지)
- [ ] Commit: `feat(spec-07-04): usePasskeyRegister hook + index export`

---

## Task 4: Ship

- [ ] `pnpm --filter frontend-auth-react test` → 전체 PASS
- [ ] `pnpm -r typecheck` → PASS
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-07-04): ship walkthrough and pr description`
- [x] **Push**: `git push -u origin spec-07-04-mfa-react-hook`
- [x] **PR 생성** (base: `phase-07-auth-extension`)
- [x] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
