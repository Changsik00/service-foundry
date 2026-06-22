# Task List: spec-24-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> **주의**: 분할은 원자적이다 — 컨트롤러/모듈/테스트를 한 commit 에서 함께 옮겨야 테스트가 green 유지(account.controller.test 가 이동 메서드를 참조하므로).

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-24-03-account-controller-split` (base: `phase-24-refactor-hardening-2`)

---

## Task 2: EmailChangeController 추출 (분할)

- [x] `email-change.controller.ts` 신규: email/change-request·change-confirm + EmailChangeService (prefix 동일)
- [x] `account.controller.ts`: 이메일 라우트 + EmailChangeService 제거 → **188 LOC** (< 200)
- [x] `auth.module.ts` + `provider-auth.module.ts`: EmailChangeController 등록
- [x] `email-change.controller.test.ts` 신규 + `account.controller.test.ts` 이메일 케이스 제거
- [x] `route-inventory.test.ts`: EmailChangeController 추가 (EXPECTED 불변)
- [x] 실행 → 단위 9 PASS, typecheck PASS
- [x] Commit: `refactor(spec-24-03): extract EmailChangeController from account.controller (F2)`

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test` (로컬 5434 DB) → 회귀 0 (account/email-change e2e 포함)
- [ ] account.controller LOC < 200 확인

### 📝 산출물 작성
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-24-03): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-24-03-account-controller-split`
- [ ] PR 생성 (base: `phase-24-refactor-hardening-2`)
