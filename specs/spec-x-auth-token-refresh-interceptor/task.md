# Task List: spec-x-auth-token-refresh-interceptor

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: AuthProvider withAuthRetry TDD Red

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-x-auth-token-refresh-interceptor` (base: `main`)

### 1-2. 타입 stub 추가 (컴파일 가능한 최소 상태)

- [x] `packages/frontend/auth-react/src/context.ts`
  - `AuthContextValue`에 `withAuthRetry<T>(fn: () => Promise<T>): Promise<T>` 추가
- [x] `packages/frontend/auth-react/src/provider.tsx`
  - `onUnauthenticated?: () => void` prop 추가
  - `withAuthRetry` stub 구현 (`throw new Error("not implemented")`)
  - Context value에 `withAuthRetry` 포함

### 1-3. 테스트 케이스 작성 (TDD Red)

- [x] `packages/frontend/auth-react/src/provider.test.tsx` 신규 케이스 추가:
  - **케이스 1**: `withAuthRetry` — fn 성공 → 직접 반환, `sdk.refresh` 미호출
  - **케이스 2**: `withAuthRetry` — fn 401 → `sdk.refresh` 성공 → fn 재시도 반환
  - **케이스 3**: `withAuthRetry` — fn 401 → `sdk.refresh` 실패 → `user=null` + `onUnauthenticated()` + throw
  - **케이스 4**: `getCurrentUser` 401 → `sdk.refresh` → `getCurrentUser` 재호출 → user 설정
- [x] `pnpm --filter @repo/frontend-auth-react test` → 4개 케이스 FAIL 확인
- [ ] Commit: `test(spec-x-auth-token-refresh-interceptor): withAuthRetry + startup 복구 테스트 (Red)`

---

## Task 2: withAuthRetry 구현 (TDD Green)

### 2-1. `is401` 헬퍼 + `withAuthRetry` 구현

- [ ] `packages/frontend/auth-react/src/provider.tsx`:
  - `is401(e)` 헬퍼 (duck-typing, AppError 결합 없음)
  - `withAuthRetry` 실구현:
    - fn 성공 → 반환
    - 401 → `sdk.refresh()` → 성공: fn 재시도 1회
    - 401 → `sdk.refresh()` 실패 → `setUser(null)` + `onUnauthenticated?.()` + throw
    - 401 외 에러 → 즉시 throw
  - `useEffect`(startup) 수정: `getCurrentUser` catch 시 401이면 refresh → 재조회

### 2-2. 검증

- [ ] `pnpm --filter @repo/frontend-auth-react test` → 전체 PASS 확인
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-x-auth-token-refresh-interceptor): AuthProvider withAuthRetry + startup 401 복구`

---

## Task 3: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/frontend-auth-react test` → PASS
- [ ] `pnpm turbo run typecheck` → PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-x-auth-token-refresh-interceptor): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-x-auth-token-refresh-interceptor`
- [ ] **PR 생성**: `main` base branch 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 (Red + Green + Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-09 |
