# Task List: spec-x-secure-reset-token-logging

> One Task = One Commit.

## Pre-flight
- [x] spec-x 디렉토리 생성 (specx new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + 회귀 테스트 (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-x-secure-reset-token-logging` (from `main`)

### 1-2. 회귀 테스트 (Red)
- [x] `apps/api/src/auth/secure-token-logging.test.ts` — generateRefreshToken sentinel mock + console.info spy + NODE_ENV 토글
- [x] 실행 → Fail (non-dev 2건 실패: 현재 항상 로깅)
- [x] Commit: `test(spec-x-secure-reset-token-logging): assert tokens not logged outside dev`

---

## Task 2: dev 가드 적용 (TDD Green)

### 2-1. 두 서비스 로깅 가드
- [x] `password-reset.service.ts` — dev 가드, non-dev 는 `requested userId=...` (토큰 제외)
- [x] `email-verify.service.ts` — 동일
- [x] 테스트 → Pass (3/3) + 회귀 없음(9/9) + typecheck
- [x] Commit: `fix(spec-x-secure-reset-token-logging): gate reset/verify token logging to dev only`

---

## Task 3: Ship
- [x] 단위 테스트 관련 PASS (3/3 + 회귀 9/9)
- [x] walkthrough.md / pr_description.md
- [x] Ship Commit: `docs(spec-x-secure-reset-token-logging): ship walkthrough and pr description`
- [ ] Push + PR (base main)
- [ ] `sdd specx done secure-reset-token-logging` (머지 후)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (작업 2 + Ship) |
| 예상 commit | test 1 + fix 1 + ship 1 |
| 현재 단계 | Planning |
