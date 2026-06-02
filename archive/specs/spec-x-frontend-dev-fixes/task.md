# Task List: spec-x-frontend-dev-fixes

## Pre-flight

- [x] spec.md / plan.md / task.md 작성
- [ ] Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-x-frontend-dev-fixes` (시작: `main`)

---

## Task 2: Vite alias + apps/api dotenv (1 commit)

- [ ] `apps/web-vite/vite.config.ts` resolve.alias 추가
- [ ] `apps/api/package.json` dev/start script `--env-file-if-exists=.env`
- [ ] `pnpm typecheck` + `pnpm lint` PASS
- [ ] Commit: `fix(spec-x): vite @/ alias + apps/api dotenv 자동 로드`

본 commit 에 spec/plan/task 문서 + queue.md 갱신 동봉.

---

## Task 3: Ship

- [ ] walkthrough.md / pr_description.md 작성
- [ ] `sdd ship`
- [ ] push + PR (base = main)
- [ ] 사용자 알림 + `.env` 박을 명령 가이드

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task** | 3 |
| **예상 commit** | 2 (T2 fix + T3 ship) |
| **현재 단계** | Planning (Plan Accept 대기) |
