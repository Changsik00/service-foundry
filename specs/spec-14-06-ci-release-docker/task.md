# Task List: spec-14-06

> One Task = One Commit. CI/CD 설정.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-14-06-ci-release-docker`

## Task 1: prod start + Dockerfile
- [x] api/worker start:prod + Dockerfile 2개 + .dockerignore + prepare 관대화
- [x] 로컬 docker build 양쪽 성공 (api/worker, 1.61GB)
- [x] Commit (feat)

## Task 2: release.yml
- [x] release.yml (changesets Version PR + ghcr docker matrix)
- [x] YAML 유효(node yaml) + verify 무변경
- [x] Commit (feat)

## Task 3: Ship
- [x] walkthrough / pr_description
- [x] Ship Commit + Push + PR + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + docker + release + Ship) |
| 예상 commit | feat 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
