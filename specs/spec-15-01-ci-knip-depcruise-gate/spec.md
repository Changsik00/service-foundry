# spec-15-01: CI knip + depcruise 게이트 배선

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-15-01` |
| **Phase** | `phase-15` |
| **Branch** | `spec-15-01-ci-knip-depcruise-gate` |
| **상태** | Planning |
| **타입** | Feature (CI 게이트) + Refactor (dead code 정리) |
| **Integration Test Required** | no (CI 워크플로 자체가 검증) |
| **작성일** | 2026-06-01 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`@repo/knip-config`, `@repo/depcruise-config` 에 preset 은 갖춰져 있으나, **root 에서 이를 소비하는 config·script·turbo task·CI step 이 전혀 없다.** `verify.yml` 은 `turbo run lint typecheck test build` 만 실행한다 (`docs/review/2026-06-01-wiring-audit.md` §C).

### 문제점
- **phase-14 성공기준5 미충족**: 기준 원문은 "frozen-lockfile + turbo typecheck/test/lint + **knip + depcruise**" 였는데 knip/depcruise 부분이 빠졌다. phase-ship 시 에이전트가 이를 놓치고 PASS 판정함 (검증 누락 — 본 spec 의 직접 동기).
- dead code / 경계 위반이 PR 을 그대로 통과 → 이후 phase-15 배선 작업(15-02~05)의 안전망 부재.
- 현재 knip 을 돌리면 unused files 74 / deps 13 / exports 9 등이 나오는데, **대부분 config 가 실제 워크스페이스와 안 맞아 생기는 오탐**(test 파일·catalog dep·entry 불일치)이고 일부만 진짜 dead.

### 해결 방안 (요약)
knip/depcruise config 를 실제 워크스페이스에 맞게 교정해 **오탐 0** 으로 만든 뒤(진짜 위반만 남김), root script + turbo task + `verify.yml` step 으로 배선해 PR 게이트로 만든다. 남은 진짜 dead(audit ⚪ 목록)는 정리하거나 명시적 ignore 한다.

## 🎯 요구사항

### Functional Requirements
1. `pnpm knip` 이 **오탐 없이** 통과(또는 진짜 위반만 보고) — config 교정으로 entry/project/ignore 정렬.
2. `pnpm depcruise` 가 ARCHITECTURE.md §3 경계 규칙(frontend↛backend, pure↛adapter 등) 검사, 위반 0 통과.
3. 두 명령을 turbo task(`knip`, `depcruise`) + root script 로 노출.
4. `verify.yml` 이 위 두 게이트를 실행, 위반 시 CI red.
5. 진짜 dead export/file(audit ⚪: RolesGuard·needsRehash·createApiClient·createTracingSdk·tsup-config·node-app.json 등)은 **정리(제거) 또는 의도적이면 knip ignore 에 사유와 함께 등록.**

### Non-Functional Requirements
1. CI 시간 증가 최소 — knip/depcruise 는 turbo 캐시 활용 또는 affected 범위.
2. 기존 lint/typecheck/test/build 게이트 동작 불변(회귀 없음).
3. 점진 도입 옵션 — 초기 위반이 많으면 일부를 warn 으로 두되, 본 spec 종료 시 핵심은 error.

## 🚫 Out of Scope
- 실제 미배선 기능 fix (CSRF/rate-limit/reqId) — spec-15-02~04.
- 생성기 tsconfig — spec-15-05.
- knip 이 잡는 의도적 미배선 기능(useMfaChallenge 등 보일러플레이트 UI) 제거 — ignore 처리만, 삭제 금지.

## 📑 ADR 후보
- [ ] ADR 가치 있는 결정 있음
- [x] 없음 (phase-14 ADR-0001/0019 범위 내)

## 🔗 관련 문서 (Related)
- 관련 리뷰: `docs/review/2026-06-01-wiring-audit.md` §C+⚪
- 관련 ADR: ADR-0001(lint/boundary 전략), ADR-0019(보안 linter No-Go — CI 재평가 트리거)
- 관련 explainer: `docs/explainers/platform/config-packages-presets.md`, `docs/explainers/platform/ci-verify-gate.md`

## ✅ Definition of Done
- [ ] knip config 교정 → 오탐 0 (진짜 위반만)
- [ ] depcruise root 배선 → 경계 검사 통과
- [ ] turbo task + root script + verify.yml step 추가
- [ ] 진짜 dead 정리 또는 ignore 등록(사유 명시)
- [ ] CI 에서 두 게이트 green (의도 위반 주입 시 red 확인)
- [ ] walkthrough/pr_description ship + 브랜치 push + PR (base: phase-15)
