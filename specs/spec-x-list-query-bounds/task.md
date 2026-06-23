# Task List: spec-x-list-query-bounds

> One Task = One Commit. 작은 하드닝 (A5).

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-x-list-query-bounds` (base: `main`)

## Task 2: feature-flag + org-list LIMIT (TDD)
### 2-1. 테스트 (Red)
- [ ] feature-flag.service / org-list.service 단위: `.limit(상수)` 호출 단언
- [ ] 실행 → Fail
- [ ] Commit: `test(spec-x-list-query-bounds): add failing tests for list limits`
### 2-2. 구현 (Green)
- [ ] `feature-flag.service.ts`: `.limit(FEATURE_FLAG_LIST_MAX)`
- [ ] `org-list.service.ts`: 결정적 정렬 + `.limit(ORG_LIST_MAX)`
- [ ] 실행 → Pass, typecheck
- [ ] Commit: `fix(spec-x-list-query-bounds): bound feature-flag/org-list queries with LIMIT (A5)`

## Task 3: Ship
### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-x-list-query-bounds): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-x-list-query-bounds`
- [ ] PR 생성 (base: `main`)
