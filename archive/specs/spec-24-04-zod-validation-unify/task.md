# Task List: spec-24-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> **주의**: 순수 리팩토링 — 안전망은 spec-24-01 의 컨트롤러 단위 테스트 + e2e. 각 변경 후 해당 테스트 PASS 확인.

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-24-04-zod-validation-unify` (base: `phase-24-refactor-hardening-2`)

---

## Task 2: provider-org `parseOr400` → `zodPipe`

- [x] `provider-org.controller.ts`: `parseOr400`+ZodError/z import 제거, `zodPipe` + 3 콜사이트 치환
- [x] 실행 → provider-org 6 PASS, typecheck PASS
- [x] Commit: `refactor(spec-24-04): unify provider-org validation to zodPipe (B2)`

---

## Task 3: mfa raw `.parse()` → `zodPipe`

- [x] `mfa.controller.ts`: 3 콜사이트 `.parse()` → `zodPipe().transform()`
- [x] 실행 → mfa 5 PASS
- [x] Commit: `refactor(spec-24-04): unify mfa validation to zodPipe (B2)`

---

## Task 4: passkey try/catch+`.parse()` → `zodPipe`

- [x] `passkey.controller.ts`: 2 콜사이트 try/catch 제거 → `zodPipe`, BadRequestException/ZodError import 제거
- [x] 실행 → passkey 6 PASS, typecheck PASS
- [x] Commit: `refactor(spec-24-04): unify passkey validation to zodPipe (B2)`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test`(로컬 5434 DB) → 142/142, apps/api 340 tests, 회귀 0

### 📝 산출물 작성
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] Commit: `docs(spec-24-04): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-24-04-zod-validation-unify`
- [x] PR 생성 (base: `phase-24-refactor-hardening-2`)
