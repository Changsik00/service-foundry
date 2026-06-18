# Task List: spec-x-ci-cache

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Task 0: 브랜치 생성
- [ ] `git checkout -b spec-x-ci-cache`

## Task 1: verify.yml turbo 캐시
- [ ] `.github/workflows/verify.yml` 에 `.turbo` 캐시 스텝 (Install 다음, turbo run 앞)
- [ ] Commit: `chore(spec-x-ci-cache): add turbo cache to verify workflow`

## Task 2: e2e.yml playwright 캐시
- [ ] `.github/workflows/e2e.yml` 에 `~/.cache/ms-playwright` 캐시 스텝 (playwright install 앞)
- [ ] Commit: `chore(spec-x-ci-cache): cache playwright browsers in e2e workflow`

## Task 3: Ship
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Commit: `docs(spec-x-ci-cache): ship walkthrough and pr description`
- [ ] `git push -u origin spec-x-ci-cache` + PR 생성 (base main)
- [ ] (PR CI 통과 + 2회차 캐시 적중 확인 후) merge → `sdd specx done ci-cache`
