# Task List: spec-14-01

> One Task = One Commit. (CI 설정 — TDD red/green 비해당.)

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-01-ci-verify-gate` (from phase-14-quality-cicd)

## Task 1: verify 워크플로
- [ ] `.github/workflows/verify.yml` 작성
- [ ] 로컬 동등 그린: `pnpm install --frozen-lockfile` + `pnpm turbo run lint typecheck test build`
- [ ] YAML 유효성 확인
- [ ] Commit: `feat(spec-14-01): add CI verify gate (frozen-lockfile + turbo lint/typecheck/test/build)`

## Task 2: Ship
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Ship Commit: `docs(spec-14-01): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-14-quality-cicd`)
- [ ] **본 PR 의 verify 워크플로 green 확인** (통합 검증)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (브랜치 + 워크플로 + Ship) |
| 예상 commit | feat 1 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
