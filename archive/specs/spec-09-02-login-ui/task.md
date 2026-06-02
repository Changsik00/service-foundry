# Task List: spec-09-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new login-ui`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-09.md SPEC 표 갱신)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + LoginForm 테스트 (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-09-02-login-ui` (from `phase-09-login-admin`)

### 1-2. LoginForm 테스트 작성 (TDD Red)
- [x] `apps/web-next/src/components/login-form.test.tsx` 작성
  - 렌더 테스트 (email, password, submit 버튼)
  - signIn({ email, password }) 호출 확인
  - signIn 실패 → 에러 메시지 표시
  - signIn 성공 → router.push('/') 호출
- [x] `pnpm --filter @apps/web-next test` → Fail 확인
- [x] Commit: `test(spec-09-02): LoginForm TDD Red`

---

## Task 2: LoginForm 구현 + /login 라우트 (TDD Green)

### 2-1. LoginForm + /login 페이지 구현
- [x] `apps/web-next/src/components/login-form.tsx` 작성
- [x] `apps/web-next/src/app/login/page.tsx` 작성
- [x] `pnpm --filter @apps/web-next test` → PASS
- [x] `pnpm -r typecheck` → PASS
- [x] Commit: `feat(spec-09-02): LoginForm 구현 + /login 라우트`

---

## Task 3: Ship

- [x] `pnpm --filter @apps/web-next dev` → localhost:2027/login 렌더 확인
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-09-02): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-09-02-login-ui`
- [ ] **PR 생성** (base: `phase-09-login-admin`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
