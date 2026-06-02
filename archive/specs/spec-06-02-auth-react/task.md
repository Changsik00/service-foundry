# Task List: spec-06-02 — React 인증 어댑터

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-06.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-06-02-auth-react` (base: `phase-06-auth-integration`)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: auth-contracts — AuthSDK interface 추가

### 2-1. 구현
- [ ] `packages/shared/auth-contracts/src/index.ts` — `Unsubscribe` 타입 + `AuthSDK` interface 추가

### 2-2. 검증
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-06-02): auth-contracts — AuthSDK Core Surface interface`

---

## Task 3: 패키지 스캐폴드

### 3-1. 파일 생성
- [ ] `packages/frontend/auth-react/package.json` — `@repo/frontend-auth-react`, peerDep: `react ^19.0.0`, dep: `@repo/auth-contracts`, devDep: testing-library + jsdom + vitejs/plugin-react
- [ ] `packages/frontend/auth-react/tsconfig.json` — `jsx: "preserve"` + DOM lib
- [ ] `packages/frontend/auth-react/vitest.config.ts` — reactPreset + react plugin
- [ ] `packages/frontend/auth-react/vitest.setup.ts` — jest-dom + cleanup (frontend/ui 패턴)
- [ ] `packages/frontend/auth-react/src/index.ts` — 빈 파일

### 3-2. 검증
- [ ] `pnpm install` (workspace 인식)
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `chore(spec-06-02): @repo/frontend-auth-react 패키지 스캐폴드`

---

## Task 4: AuthProvider + useAuth + useSession — TDD

### 4-1. 테스트 작성 (Red)
- [ ] `packages/frontend/auth-react/src/provider.test.tsx` 작성
  - 케이스 1: mount 시 `sdk.getCurrentUser()` 호출 → isLoading false, user 설정
  - 케이스 2: `useAuth()` 가 `<AuthProvider>` 외부에서 호출 시 Error
  - 케이스 3: `signIn()` 호출 → `sdk.signIn()` 위임 + success 시 user 업데이트
  - 케이스 4: `signOut()` 호출 → `sdk.signOut()` 위임 + user null
  - 케이스 5: `useSession()` — user/isLoading 반환 (read-only)
- [ ] 테스트 실행 → Fail 확인

### 4-2. 구현 (Green)
- [ ] `packages/frontend/auth-react/src/context.ts` — `AuthContextValue` + `AuthContext`
- [ ] `packages/frontend/auth-react/src/provider.tsx` — `<AuthProvider>` 구현
- [ ] `packages/frontend/auth-react/src/hooks.ts` — `useAuth()` + `useSession()`
- [ ] 테스트 실행 → Pass 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-06-02): AuthProvider + useAuth + useSession hooks`

---

## Task 5: RequireAuth + RequireRole + index.ts — TDD

### 5-1. 테스트 작성 (Red)
- [ ] `packages/frontend/auth-react/src/guards.test.tsx` 작성
  - 케이스 6: `<RequireAuth>` — isLoading → fallback
  - 케이스 7: `<RequireAuth>` — 미인증 → fallback
  - 케이스 8: `<RequireAuth>` — 인증 → children 렌더
  - 케이스 9: `<RequireRole role="admin">` — role 불일치 → fallback
  - 케이스 10: `<RequireRole role="admin">` — role 일치 → children 렌더
- [ ] 테스트 실행 → Fail 확인

### 5-2. 구현 (Green)
- [ ] `packages/frontend/auth-react/src/guards.tsx` — `<RequireAuth>` + `<RequireRole>` 구현
- [ ] `packages/frontend/auth-react/src/index.ts` — 모든 public export
- [ ] `pnpm --filter @repo/frontend-auth-react exec biome check src/` PASS
- [ ] 테스트 실행 → Pass 확인
- [ ] `pnpm typecheck` PASS

- [ ] Commit: `feat(spec-06-02): RequireAuth + RequireRole guards + index.ts`

---

## Task 6: Ship

> `/hk-ship` 절차를 따릅니다.

- [ ] 전체 테스트 재실행 → PASS
- [ ] **walkthrough.md 작성** (증거 로그)
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-06-02): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-06-02-auth-react`
- [ ] **PR 생성**: target `phase-06-auth-integration`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (브랜치 포함) |
| **예상 commit 수** | 4 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-21 |
