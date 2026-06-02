# Task List: spec-06-05

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 백로그 업데이트 (phase-06.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + 로그인 수직 슬라이스 통합 테스트 추가

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-06-05-e2e-login-vertical-slice`
- Commit: 없음 (브랜치 생성만)

### 1-2. 통합 테스트 작성 및 검증
- [x] `apps/api/src/auth/auth.e2e.test.ts` 에 `"로그인 수직 슬라이스"` describe 블록 추가
  - [x] `POST /auth/signup` → 201, accessToken, Set-Cookie refresh_token
  - [x] `GET /auth/me` (Bearer accessToken) → 200, sub + role 확인
  - [x] `POST /auth/signout` → 200
  - [x] `POST /auth/refresh` (revoked cookie) → 401 (세션 취소 검증)
  - [x] `POST /auth/signin` → 200, 새 cookie + accessToken
  - [x] `POST /auth/refresh` (valid cookie) → 200, 새 accessToken
  - [x] `GET /auth/me` (refresh 후 새 토큰) → 200
- [x] `pnpm --filter @apps/api test` → 모든 테스트 PASS (53/53)
- [x] Commit: `test(spec-06-05): add login vertical slice integration tests`

---

## Task 2: Ship

- [ ] 코드 품질 점검: `pnpm --filter @apps/api lint && pnpm --filter @apps/api typecheck`
- [ ] 전체 테스트: `pnpm --filter @apps/api test` → PASS
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-06-05): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-06-05-e2e-login-vertical-slice`
- [ ] **PR 생성**: `gh pr create --base phase-06-auth-integration`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 2 |
| **예상 commit 수** | 2 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
