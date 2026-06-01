# Phase Ship: phase-14 — Quality Hardening + CI/CD

> Phase base branch(`phase-14-quality-cicd`) → main 최종 PR.

## 📋 Overview

보일러플레이트 품질 평점 상향(에러 A-→A, 보안 B+→A)과 그 품질을 **결정론적으로 강제하는 CI 게이트 + 릴리스 파이프라인**을 구축한다. #80 사고(로컬 훅·turbo 캐시로 typecheck/lockfile 누수 미차단)를 계기로 CI 전체를 phase-14 로 당겼다. 추가로 지식베이스(문서 시스템)를 구축하고 그 정확성까지 검증했다.

## 📦 Scope: 계획 vs 실제

| 구분 | 항목 | 비고 |
|:---:|---|---|
| ✅ 완료 | spec-14-01: CI verify 게이트 (PR 머지) | 나머지 spec 의 안전망, 먼저 박음 |
| ✅ 완료 | spec-14-02: 에러 규약 ADR-0020 + 리팩터 | |
| ✅ 완료 | spec-14-03: auth.guard verified-claims footgun 수정 | |
| ✅ 완료 | spec-14-04: 비-auth 경계 테스트 보강 | |
| ✅ 완료 | spec-14-05: 보안 포트 rate-limit + secrets (#88) | |
| ✅ 완료 | spec-14-06: 릴리스 워크플로 + GHCR docker (#89) | |
| ➕ 추가 | spec-14-07: Obsidian 지식베이스 (#91) | Phase 중 추가 (문서 트랙) |
| ➕ 추가 | spec-14-08: 문서 환각 전수 검증 (#92) | 14-07 정확성 보증 (27 수정) |
| ⏭ 이연 | 🔒 CSRF 배선 | 코드 결함 — Icebox → 별도 spec-x |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| 머지 | spec-14-01-ci-verify-gate | GitHub Actions: frozen-lockfile + turbo lint/typecheck/test/build |
| 머지 | spec-14-02-error-convention | ADR-0020 에러 처리 결정 트리 + 위반 리팩터 |
| 머지 | spec-14-03-auth-guard-verified-claims | role 을 검증된 `result.value` 에서만 읽음 |
| 머지 | spec-14-04-boundary-tests | http-client/logger/utils 경계·에러 경로 테스트 |
| #88 | spec-14-05-security-ports | `@repo/backend-rate-limit` + `@repo/backend-secrets` 포트 |
| #89 | spec-14-06-ci-release-docker | changesets release PR + GHCR docker (api/worker) |
| #91 | spec-14-07-docs-knowledge-base | docs/ Obsidian vault: reference 48 + explainer 37 + README 52 |
| #92 | spec-14-08-docs-verification | 문서 27 환각 수정 + Opus 스포트체크 + CSRF 결함 발견 |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | 에러 규약 통일 | ✅ PASS | `docs/adr/0020-error-handling-convention.md` |
| 2 | auth.guard verified-claims | ✅ PASS | `auth.guard.ts:55` `Role.safeParse(result.value.role)`, decodeJwt 사용 제거(주석만 잔존) |
| 3 | 비-auth 경계 테스트 | ✅ PASS | `backend/http-client`·`backend/logger`·`shared/utils` `index.test.ts` |
| 4 | 보안 포트 | ✅ PASS | `backend/rate-limit/src/index.ts`, `backend/secrets/src/index.ts` (+ 어댑터/테스트) |
| 5 | CI PR 검증 게이트 | ✅ PASS | `verify.yml`: `pnpm install --frozen-lockfile` + `turbo run lint typecheck test build` |
| 6 | 릴리스 자동화 | ✅ PASS | `release.yml`: `changesets/action@v1` + `docker/build-push-action@v6`, api/worker Dockerfile |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | CI 게이트가 결함 차단 | ✅ PASS | verify.yml 이 PR #88~92 전부에서 작동, 최신 `50f7fef` success. frozen-lockfile 로 #80류 차단 |
| 2 | 릴리스 PR 생성 | ✅ PASS | `release.yml` `on: push: branches:[main]` + changesets/action 정의 — main 머지 시 트리거 |

## 🏗 Architecture Decisions

- **CI 를 phase-15 → phase-14 로 당김**: #80 사고 근거. PR 게이트가 latent typecheck/lockfile 누수를 결정론적 차단 (사용자 결정 2026-05-31).
- **에러 처리 결정 트리(ADR-0020)**: 예상된 도메인 실패=Result, 3+상태=named union, I/O 실패=throw AppError, yes/no=boolean. plain throw/sentinel/silent void 금지.
- **지식베이스 3층 모델**: reference(무엇)/adr(왜)/explainer(어떻게) + 단일 index.md MOC + Obsidian 규약. LLM 대량 저술 → **소스 대조 검증(spec-14-08)으로 환각 27건 차단**.

## ⚠️ Known Issues / Technical Debt

- **🔒 CSRF 미배선**: `auth-rate-limit/src/csrf.ts` 구현됐으나 `apps/api` refresh endpoint 에 미배선. SameSite=Lax 단독 → 서브도메인 공격 시 CSRF 노출. 코드 미수정(phase-14 범위 외), Icebox 등록. **별도 spec-x-csrf-wiring 후보.**
- **로컬 e2e 23 실패**: `Auth E2E (real PG)` 는 PostgreSQL 필요 — 로컬 DB 미기동 시 실패(환경 문제, 회귀 아님). CI 는 postgres 서비스 컨테이너로 통과.

## 📝 Follow-up Work

- 🔒 CSRF 배선 fix → `backlog/queue.md` Icebox (별도 spec-x)
- check-secrets 훅 오탐 개선 → RCA-002 + Icebox
- harness-kit 0.13.9 업데이트 (로컬 영역)

## 📊 Stats

- **Files changed**: 248
- **Lines**: +11,297, -683
- **Specs**: 8개 완료 (계획 6 + 추가 2), 0 이연 (CSRF 는 코드 결함으로 별도)
- **문서**: docs md 120 (reference 54 + explainer 37 + meta + adr 20), 패키지/앱 README 52
