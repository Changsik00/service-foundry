# Task List: spec-09-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new auth-adr`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-09.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + ADR-0017 작성

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-09-01-auth-adr` (from `phase-09-login-admin`)

### 1-2. docs/decisions 디렉토리 + ADR-0017 작성
- [ ] `mkdir -p docs/decisions`
- [ ] `docs/decisions/ADR-0017-auth-provider-sdk-prop-contract.md` 작성
- [ ] ADR 템플릿 준수 확인 (frontmatter: `type: convention`, `status: accepted`)
- [ ] Commit: `docs(spec-09-01): ADR-0017 auth-provider-sdk-prop-contract`

---

## Task 2: ADR-0018 작성

### 2-1. ADR-0018 작성
- [ ] `docs/decisions/ADR-0018-auth-provider-package-location.md` 작성
- [ ] ADR 템플릿 준수 확인 (frontmatter: `type: decision`, `status: accepted`)
- [ ] Commit: `docs(spec-09-01): ADR-0018 auth-provider-package-location`

---

## Task 3: Ship

- [ ] `pnpm -r typecheck` → PASS (문서 변경, 타입 영향 없음)
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-09-01): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-09-01-auth-adr`
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
