# Task List: spec-08-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new auth-firebase`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-08.md SPEC 표 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + auth-contracts CoreAuthSDK 추가

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-08-01-auth-firebase` (from `phase-08-provider-adapters`)

### 1-2. auth-contracts CoreAuthSDK 추가
- [ ] `packages/shared/auth-contracts/src/index.ts` — `CoreAuthSDK` 타입 export 추가
- [ ] `pnpm --filter auth-contracts test` → PASS 확인
- [ ] `pnpm --filter auth-contracts typecheck` → PASS 확인
- [ ] Commit: `feat(spec-08-01): auth-contracts — CoreAuthSDK 타입 추가`

---

## Task 2: auth-firebase 패키지 스캐폴딩 + 의존성

### 2-1. catalog 및 패키지 초기화
- [ ] `pnpm-workspace.yaml` catalog에 `firebase: "^11.0.0"` 추가
- [ ] `packages/frontend/auth-firebase/` 디렉토리 + `package.json` / `tsconfig.json` / `vitest.config.ts` 생성
- [ ] `packages/frontend/auth-firebase/package.json`에 의존성 추가 (`firebase`, `@repo/auth-contracts`, `@repo/errors`)
- [ ] `pnpm install --ignore-scripts`
- [ ] Commit: `chore(spec-08-01): auth-firebase 패키지 스캐폴딩`

---

## Task 3: FirebaseError 정규화 (TDD)

### 3-1. normalize.test.ts 작성 → Fail
- [ ] `packages/frontend/auth-firebase/src/normalize.test.ts` 작성
  - `auth/user-not-found` → `{ success: false, reason: "invalid_credentials" }`
  - `auth/wrong-password` → `{ success: false, reason: "invalid_credentials" }`
  - `auth/email-already-in-use` → `AppError` throw
  - `auth/too-many-requests` → `{ success: false, reason: "rate_limited" }`
  - `auth/user-disabled` → `{ success: false, reason: "account_locked" }`
  - 기타 에러 → re-throw
- [ ] `pnpm --filter frontend-auth-firebase test` → Fail 확인

### 3-2. normalize.ts 구현 → Pass
- [ ] `packages/frontend/auth-firebase/src/normalize.ts` 구현
- [ ] `pnpm --filter frontend-auth-firebase test` → PASS
- [ ] Commit: `feat(spec-08-01): FirebaseError 정규화 (normalize.ts)`

---

## Task 4: createFirebaseAuthSDK 구현 (TDD)

### 4-1. index.test.ts 작성 → Fail
- [ ] `packages/frontend/auth-firebase/src/index.test.ts` 작성
  - `vi.mock('firebase/auth', () => ({ ... }))` 설정
  - `signIn` 성공 경로 — `AuthResult { success: true }`
  - `signIn` 실패 — `auth/user-not-found` → `AuthResult { success: false, reason: "invalid_credentials" }`
  - `signUp` 성공 경로
  - `signOut` 위임
  - `getCurrentUser` null / 유저 있음
  - `refresh` null / Session 반환
  - `firebase.getIdTokenResult` 정상 호출
- [ ] `pnpm --filter frontend-auth-firebase test` → Fail 확인

### 4-2. index.ts 구현 → Pass
- [ ] `packages/frontend/auth-firebase/src/index.ts` 구현
  - `FirebaseExtensions` 타입
  - `createFirebaseAuthSDK(app)` — `CoreAuthSDK & { firebase: FirebaseExtensions }` 반환
- [ ] `pnpm --filter frontend-auth-firebase test` → PASS
- [ ] `pnpm -r typecheck` → PASS (전체 패키지)
- [ ] Commit: `feat(spec-08-01): createFirebaseAuthSDK — CoreAuthSDK 구현`

---

## Task 5: Ship

- [ ] `pnpm --filter frontend-auth-firebase test` → 전체 PASS
- [ ] `pnpm -r typecheck` → PASS
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-08-01): ship walkthrough and pr description`
- [x] **Push**: `git push -u origin spec-08-01-auth-firebase`
- [x] **PR 생성** (base: `phase-08-provider-adapters`)
- [x] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 |
| **예상 commit 수** | 5 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
