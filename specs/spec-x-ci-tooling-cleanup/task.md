# Task List: spec-x-ci-tooling-cleanup

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Task 0: 브랜치 생성
- [ ] `git checkout -b spec-x-ci-tooling-cleanup`

## Task 1: knip entry 패턴 정리
- [ ] `base.json` 와일드카드에서 roundtrip.ts·emit-span.ts 제거 + cache/queue/observability per-package entry
- [ ] `pnpm turbo run knip` → 힌트 0 + unused 회귀 없음 확인
- [ ] Commit: `chore(spec-x-ci-tooling-cleanup): refine knip backend entry patterns`

## Task 2: tooling 테스트 CI 편입
- [ ] `verify.yml` 에 `npx vitest run tooling` 스텝 추가
- [ ] `npx vitest run tooling` 로컬 통과 확인
- [ ] Commit: `chore(spec-x-ci-tooling-cleanup): run tooling tests in verify CI`

## Task 3: Ship
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Commit: `docs(spec-x-ci-tooling-cleanup): ship walkthrough and pr description`
- [ ] push + PR (base main) → verify CI 그린 확인 후 merge → `sdd specx done ci-tooling-cleanup`
