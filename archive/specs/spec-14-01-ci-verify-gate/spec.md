# spec-14-01: CI PR 검증 게이트

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-01` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-01-ci-verify-gate` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes (워크플로 자신이 본 PR 에서 실행) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
PR 검증 자동화가 없다. 로컬 lefthook(biome+turbo typecheck)과 turbo 캐시에만 의존한다.

### 문제점
- **#80 실증**: `git commit | tail` 로 종료코드가 가려지고 turbo 캐시가 stale typecheck 를 통과시켜 storage stub 이 머지됐고, lockfile importer 누락(#83)도 함께 샜다. 로컬 훅만으로는 결정론적 차단 불가.

### 해결 방안 (요약)
GitHub Actions PR 워크플로로 **clean 환경에서 `--frozen-lockfile` + turbo lint/typecheck/test/build** 를 강제한다. 캐시·로컬 규율과 무관하게 PR 단위로 결함을 red 처리한다.

## 🎯 요구사항

### Functional Requirements
1. `.github/workflows/verify.yml` — 트리거: `pull_request`(전체) + `push`(main).
2. 잡: checkout → pnpm(11.1.2) + node 24 setup(+pnpm 캐시) → `pnpm install --frozen-lockfile` → `pnpm turbo run lint typecheck test build`.
3. `concurrency` 로 같은 ref 의 이전 실행 취소(cancel-in-progress).
4. lockfile 불일치 / typecheck 실패 / test 실패 시 잡 red.

### Non-Functional Requirements
1. node/pnpm 버전은 repo 의 `packageManager`·engines 와 일치.
2. 단일 잡, ubuntu-latest. (matrix·remote cache 는 후속.)

## 🚫 Out of Scope (후속)
- **knip / depcruise 게이트** — 현재 루트 배선(스크립트/설정) 없음. config 패키지(`@repo/knip-config`/`depcruise-config`)는 있으나 실행 진입점 부재 → 별도 후속(배선 + 게이트 추가). 성공 기준 5 의 knip/depcruise 부분은 후속.
- changesets / docker publish → spec-14-06.
- turbo remote cache, matrix(OS/node) → 후속.

## 📑 ADR 후보
- [ ] 없음 (표준 Actions 구성)

## 🔗 관련 문서 (Related)
- 관련: [[feedback_no_pipe_git_commit]] (#80 근본 원인), phase-14.md 성공 기준 5
- 관련 ADR: ADR-0019 (보안 linter No-Go — CI 에서 재평가)

## ✅ Definition of Done
- [ ] `verify.yml` YAML 유효 + 트리거/잡/스텝 정의
- [ ] 로컬 동등 명령 그린: `pnpm install --frozen-lockfile` + `pnpm turbo run lint typecheck test build`
- [ ] **본 PR 에서 verify 워크플로 실행 → green** (통합 검증)
- [ ] walkthrough / pr_description ship + push + 알림
