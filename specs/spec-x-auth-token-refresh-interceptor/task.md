# Task List: spec-x — http-client 401 자동 refresh 인터셉터

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: TDD Red

### 1-1. 브랜치 생성

- [x] `git checkout -b spec-x-auth-token-refresh-interceptor` (base: `main`)

### 1-2. http-client 테스트 케이스 추가

- [x] `packages/frontend/http-client/src/index.test.ts` — `onUnauthorized` describe 추가:
  - 케이스 1: 요청 성공 (2xx) → `onUnauthorized` 미호출, fetch 1회
  - 케이스 2: 401 → `onUnauthorized` 호출 → 재시도 성공 → 결과 반환, fetch 2회
  - 케이스 3: 401 → `onUnauthorized` 실패 → AppError(statusCode:401) throw, fetch 1회
  - 케이스 4: 401 → `onUnauthorized` 성공 → 재시도도 401 → AppError(401), fetch 2회, 루프 없음

### 1-3. auth-react 테스트 케이스 추가

- [x] `packages/frontend/auth-react/src/provider.test.tsx`:
  - 케이스: `getCurrentUser()` 401 → `sdk.refresh()` → 재조회 → user 설정

### 1-4. Red 확인

- [x] `pnpm --filter @repo/frontend-http-client test` → 3개 케이스 FAIL 확인 (케이스 1 선통과)
- [x] `pnpm --filter @repo/frontend-auth-react test` → 1개 케이스 FAIL 확인
- [ ] Commit: `test(spec-x-auth-token-refresh-interceptor): http-client onUnauthorized + startup 복구 테스트 (Red)`

---

## Task 2: TDD Green

### 2-1. http-client 구현

- [x] `packages/frontend/http-client/src/index.ts`:
  - `CreateHttpClientOptions`에 `onUnauthorized?: () => Promise<void>` 추가
  - `doRequest` / `request` 분리 — 401 catch 후 onUnauthorized → doRequest 재시도 (1회)
  - ky afterResponse hook 방식 대신 AppError catch 래퍼로 구현 (hook이 기존 테스트와 충돌)

### 2-2. auth-react 구현

- [x] `packages/frontend/auth-react/src/provider.tsx`:
  - `is401` 헬퍼 추가 (모듈 최상위)
  - startup `catch` 블록 — 401 시 refresh → 재조회

### 2-3. 검증

- [x] `pnpm --filter @repo/frontend-http-client test` → 17/17 PASS
- [x] `pnpm --filter @repo/frontend-auth-react test` → 21/21 PASS
- [x] `pnpm turbo run typecheck` → 48/48 PASS
- [ ] Commit: `feat(spec-x-auth-token-refresh-interceptor): http-client onUnauthorized interceptor + startup 401 복구`

---

## Task 3: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/frontend-http-client test` → PASS
- [ ] `pnpm --filter @repo/frontend-auth-react test` → PASS
- [ ] `pnpm turbo run typecheck` → PASS

### 📝 산출물

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-x-auth-token-refresh-interceptor): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-x-auth-token-refresh-interceptor`
- [ ] PR 생성 (base: `main`)
- [ ] 사용자 알림
