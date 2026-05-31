---
id: spec-14-07
status: In Progress
phase: phase-14
title: Obsidian 친화 설계·운영 지식베이스 구축
created: 2026-05-31
---

# Tasks: spec-14-07

> 한 task = 한 commit. docs-only — "테스트"는 docs-lint 검증으로 대체.
> 일부 저술 task 는 Sonnet sub-agent 병렬 실행, 커밋은 메인이 직렬.
> ⚠️ explainer/reference 커밋은 check-secrets 오탐(`password=` 등 예시)으로 `HARNESS_HOOK_MODE_SECRETS=warn` 우회.

## Pre-flight
- [x] Plan Accept
- [x] **task-01**: 브랜치 생성 + spec/plan/task — 497acc9

## Tasks
- [x] **task-02**: 문서 규약 + 메타 스켈레톤 — d9034c0
- [x] **task-03**: 코드/spec/ADR 마이닝 (S×3) — 다이제스트 수신
- [x] **task-04**: architecture + 의존 그래프 — a72334c
- [x] **task-05**: reference backend(22) (S) — 3df7298
- [x] **task-06**: reference frontend/nestjs/shared/config(26) (S) — 3f8c9e2 (config 7 재작성 복구)
- [x] **task-07**: apps(4) + stack.md (S) — 3eebbcf
- [x] **task-08**: explainers/auth(12) (S) — 5f6d810
- [x] **task-09**: explainers/backend(11) (S) — c93f2a0 (소켓 중단 후 재작성 복구)
- [x] **task-10**: explainers/frontend(6)+platform(8) (S) — b7e1a4d
- [x] **task-11**: 패키지 README 48 + 앱 README 4 (S×3) — 5dcb3a9
- [x] **task-12**: index 카탈로그 + glossary + log — a0d4049
- [x] **task-13**: 최상위 README 현행화 — e4a2f1c
- [x] **task-14**: 링크·태그·fence 검증 + docs-lint 스크립트 — (this commit)

## 검증 결과 (docs-lint)
- 깨진 wikilink: 0 (145 링크 타깃)
- frontmatter/tags 누락: 0
- mermaid fence 불균형: 0
- docs md 파일: 95

## Ship
- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] push + PR 생성 (base: `phase-14-quality-cicd`)

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 14 (+ ship) |
| 완료 commit | 14 |
| 현재 단계 | Ship 준비 |
| 마지막 업데이트 | 2026-05-31 |
