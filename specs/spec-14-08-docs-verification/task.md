# Task List: spec-14-08

> One Task = One Commit. docs-only — 게이트는 docs-lint + Opus 스포트체크.
> 서브에이전트(Sonnet) 검증·수정, 커밋은 메인(Opus)이 직렬. secrets 훅 warn 우회([[RCA-002...]]).

## Pre-flight
- [x] spec.md / plan.md / task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd spec new 자동)
- [ ] 사용자 Plan Accept

## Tasks

- [ ] **task-01**: 브랜치 `spec-14-08-docs-verification` 생성(phase-14 팁) + spec/plan/task 커밋
  - 완료: `docs(spec-14-08): add spec/plan/task`

- [ ] **task-02**: reference 검증·수정 — backend(22) + nestjs(6) [S]
  - 각 노트 "공개 API/export" 표 vs `packages/<cat>/<pkg>/src/index.ts` 실제 export 대조, 불일치 수정. 의존/경로/spec 인용 확인.
  - 산출: 수정된 노트 + 리포트 조각. 완료: `docs(spec-14-08): verify+fix backend/nestjs reference notes`

- [ ] **task-03**: reference 검증·수정 — frontend(7) + shared(6) + config(7) + apps(4) + architecture + stack [S]
  - 동일 방식. config 는 base.json/preset export, apps 는 조립 패키지 목록 대조.
  - 완료: `docs(spec-14-08): verify+fix frontend/shared/config/apps reference notes`

- [ ] **task-04**: explainer 검증·수정 — auth(12) + backend(11) [S]
  - "어떻게 동작하나" 서술·mermaid vs 실제 소스 동작 대조. 환각·과장 수정, 불확실은 "설계 수준" 명시. 인용 경로 실재 확인.
  - 완료: `docs(spec-14-08): verify+fix auth/backend explainers`

- [ ] **task-05**: explainer 검증·수정 — frontend(6) + platform(8) [S]
  - 동일 방식. platform 은 turbo/CI/docker/generators 실제 설정 파일 대조.
  - 완료: `docs(spec-14-08): verify+fix frontend/platform explainers`

- [ ] **task-06**: README 표본 검증 — 패키지 48 + 앱 4 [S]
  - import 경로·핵심 API·심화 링크 정확성 표본 대조(reference 와 교차).
  - 완료: `docs(spec-14-08): verify+fix package/app READMEs`

- [ ] **task-07**: Opus 스포트체크 + verification-report.md [메인]
  - 각 task 리포트의 "export 존재"·"경로 정확" 주장을 grep/test 로 표본 재검증. 허위 발견 시 해당 도메인 재작업.
  - `verification-report.md` 작성(노트별 상태/발견/수정 요약).
  - 완료: `docs(spec-14-08): spot-check + verification report`

- [ ] **task-08**: docs-lint 회귀 확인 [메인]
  - `bash tooling/scripts/docs-lint.sh` PASS. 깨진 링크/frontmatter/fence 0.
  - 완료: 필요한 수정만 `docs(spec-14-08): lint regression fixes` (없으면 task 스킵 [-])

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
