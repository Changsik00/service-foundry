---
id: spec-14-07
status: Draft
phase: phase-14
title: Obsidian 친화 설계·운영 지식베이스 구축
created: 2026-05-31
---

# Tasks: spec-14-07

> Plan Accept 후 위에서부터 실행. 한 task = 한 commit. (docs-only — "테스트"는 경량 검증으로 대체)
> 오케스트레이션: 메인(Opus) 조율, [S]=Sonnet sub-agent 위임(동시 최대 3). 커밋은 메인이 task 단위 직렬.

## Pre-flight
- [ ] Plan Accept (사용자 승인)
- [ ] **task-01**: 브랜치 `spec-14-07-docs-knowledge-base` 생성(phase-14 팁) + spec/plan/task 커밋
  - 완료: `docs(spec-14-07): add spec/plan/task`, HEAD 이동 확인

## Tasks

- [ ] **task-02**: 문서 규약 + 메타 스켈레톤 [메인]
  - 산출: `docs/CONVENTIONS.md`(frontmatter/4층 태그/명명/wikilink + reference·explainer·README 스켈레톤), `docs/glossary.md` 골격, `docs/log.md` 시작
  - 완료: 커밋 `docs(spec-14-07): doc conventions + meta skeletons`

- [ ] **task-03**: 코드/spec/ADR 마이닝 → 구조화 다이제스트 [S ×3 병렬]
  - A: backend 22 패키지 + apps/api,worker (책임·export·의존·관련 spec/ADR)
  - B: frontend 7 + nestjs 6 + shared 6 + config 7 + web-next,web-vite
  - C: ADR 20 + docs/notes + pnpm catalog 의존성 → 도입 근거 + 핵심 메커니즘 후보
  - 완료: 다이제스트 수신·검수 (읽기 — 커밋 없음)

- [ ] **task-04**: `docs/reference/architecture.md` + 패키지 의존 mermaid 그래프 [메인]
  - 완료: 커밋 `docs(spec-14-07): architecture + dependency graph`

- [ ] **task-05**: `docs/reference/packages/*.md` — backend(22) [S]
  - 완료: 커밋 `docs(spec-14-07): reference notes for backend packages`

- [ ] **task-06**: `docs/reference/packages/*.md` — frontend(7)+nestjs(6)+shared(6)+config(7) [S]
  - 완료: 커밋 `docs(spec-14-07): reference notes for frontend/nestjs/shared/config packages`

- [ ] **task-07**: `docs/reference/apps/*.md`(4) + `docs/reference/stack.md` [S]
  - 완료: 커밋 `docs(spec-14-07): app references + stack rationale`

- [ ] **task-08**: `docs/explainers/auth/*` [S]
  - 범위(예): session-rotation, jwt-verify, oauth-flow, mfa-totp, passkey, password-reset, rate-limit, audit-events
  - 완료: 커밋 `docs(spec-14-07): auth mechanism explainers`

- [ ] **task-09**: `docs/explainers/backend/*` [S]
  - 범위(예): outbox, idempotency, queue-worker, cache, graceful-shutdown, observability, database, secrets
  - 완료: 커밋 `docs(spec-14-07): backend mechanism explainers`

- [ ] **task-10**: `docs/explainers/frontend/*` + `docs/explainers/platform/*` [S]
  - 범위(예): auth-react-hook, http-client, provider-sdk-prop-contract / monorepo-build, config-packages, ci-cd, release
  - 완료: 커밋 `docs(spec-14-07): frontend + platform explainers`

- [ ] **task-11**: 패키지 README 48 + 앱 README 4 [S ×2~3 병렬, 카테고리 분담]
  - 표면 README(목적+사용+심화 링크). api 기존 README 규약화 갱신.
  - 완료: 커밋 `docs(spec-14-07): per-package and per-app READMEs`

- [ ] **task-12**: `docs/index.md` 전수 카탈로그/MOC + `glossary.md` 채움 + `log.md` 항목 [메인]
  - 완료: 커밋 `docs(spec-14-07): index catalog + glossary`

- [ ] **task-13**: 최상위 `README.md` 현행화 [메인]
  - 완료: 커밋 `docs(spec-14-07): rewrite top-level README to current state`

- [ ] **task-14**: 링크·태그 일관성 패스 + 검증 스크립트 [메인]
  - frontmatter/wikilink/mermaid 검증(broken 0), 고립 노트 보강
  - 완료: 커밋 `docs(spec-14-07): cross-link pass + docs lint`

## Ship
- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] push + PR 생성 (base: `phase-14-quality-cicd`)

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 14 (+ ship) |
| 예상 commit 수 | ~14 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
