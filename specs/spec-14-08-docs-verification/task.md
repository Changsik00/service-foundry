# Task List: spec-14-08

> One Task = One Commit. docs-only — 게이트는 docs-lint + Opus 스포트체크.
> 서브에이전트(Sonnet) 검증·수정, 커밋은 메인(Opus)이 직렬. secrets 훅 warn 우회([[RCA-002...]]).

## Pre-flight
- [x] spec.md / plan.md / task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd spec new 자동)
- [x] 사용자 Plan Accept

## Tasks

- [x] **task-01**: 브랜치 생성 + spec/plan/task — 185b4d5
- [x] **task-02**: reference 검증·수정 backend(22)+nestjs(6) [S] — 381fc1f (9 수정)
- [x] **task-03**: reference 검증·수정 frontend/shared/config/apps+arch+stack [S] — b0ef84c (2 수정)
- [x] **task-04**: explainer 검증·수정 auth(12) [S] — 728dc1d (8 수정, CSRF 과장 포함)
- [x] **task-05**: explainer 검증·수정 backend(11) [S] — c1fad7d (2 수정)
- [x] **task-06**: README 표본 검증 48+4 [S] — 415ddd3 (6 수정)
- [x] **task-07**: Opus 스포트체크(11건 표본, 허위검증 0) + verification-report + Icebox 보안발견 — 9299a6b
- [-] **task-08**: docs-lint 회귀 — PASS (각 커밋서 확인, 별도 수정 불요 → 스킵)

## Ship
- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] push + PR (base: `phase-14-quality-cicd`)

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 8 (+ ship) |
| 예상 commit | ~8 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-06-01 |
