# Task List: spec-14-06

> One Task = One Commit. CI/CD 설정.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-14.md SPEC 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-14-06-ci-release-docker` (from phase-14-quality-cicd)

## Task 1: prod start + Dockerfile
- [ ] api/worker `start:prod` 스크립트
- [ ] `apps/api/Dockerfile` + `apps/worker/Dockerfile` + 루트 `.dockerignore`
- [ ] 로컬 `docker build` 둘 다 성공 확인
- [ ] Commit: `feat(spec-14-06): add prod start + Dockerfiles for api/worker`

## Task 2: release.yml
- [ ] `.github/workflows/release.yml` (changesets Version PR + ghcr docker push)
- [ ] YAML 유효성 + verify 게이트 무변경 확인
- [ ] Commit: `feat(spec-14-06): add release workflow (changesets + ghcr docker)`

## Task 3: Ship
- [ ] 전체 단위 PASS + typecheck 0 (verify)
- [ ] walkthrough / pr_description
- [ ] Ship Commit + Push + PR (base `phase-14-quality-cicd`) + 알림 + CI green

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (브랜치 + docker + release + Ship) |
| 예상 commit | feat 2 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
