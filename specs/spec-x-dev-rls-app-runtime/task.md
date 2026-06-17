# Task List: spec-x-dev-rls-app-runtime

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Task 0: 브랜치 생성
- [ ] `git checkout -b spec-x-dev-rls-app-runtime`

## Task 1: dev env (env.sample)
- [ ] `env.sample` `DATABASE_URL` → app_runtime + `DATABASE_MIGRATE_URL`(superuser) 추가 + 의도 주석
- [ ] Commit: `fix(spec-x-dev-rls-app-runtime): dev runtime uses app_runtime role (RLS)`

## Task 2: web e2e (e2e.yml)
- [ ] app_runtime role 프로비저닝 스텝 + DATABASE_MIGRATE_URL(migrate)/DATABASE_URL(runtime) 분리
- [ ] Commit: `fix(spec-x-dev-rls-app-runtime): web e2e runs under app_runtime role`

## Task 3: org.spec.ts 주석 갱신
- [ ] `apps/web/e2e/org.spec.ts:46` stale 주석 갱신 (RLS 적용) + 가능 시 격리 단언 보강
- [ ] Commit: `test(spec-x-dev-rls-app-runtime): update org spec RLS note`

## Task 4: Ship
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Commit: `docs(spec-x-dev-rls-app-runtime): ship walkthrough and pr description`
- [ ] `git push -u origin spec-x-dev-rls-app-runtime` + PR (base main)
- [ ] PR e2e CI 그린 확인 후 merge → `sdd specx done dev-rls-app-runtime`
