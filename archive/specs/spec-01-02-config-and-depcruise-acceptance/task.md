# Task List: spec-01-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`specs/spec-01-02-config-and-depcruise-acceptance/`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] phase-01.md SPEC 표 자동 갱신 (sdd spec new 시점)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 작업 브랜치 생성
- [x] `git checkout -b spec-01-02-config-and-depcruise-acceptance`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: 6 config 패키지 전수 점검 + Acceptance 4 실측

- [x] **점검**: 6 config 패키지 본문 + `package.json` 전수 ADR 1:1 대조 → **변경 없음**. 결과 표 walkthrough.md에 기록.
- [x] 명백 불일치 없음 — sub-commit skip.
- [x] **Acceptance 4** — `pnpm test` → 1 task PASS, FULL TURBO cache hit (29ms).
- [x] preset round-trip 확인: `@repo/utils/vitest.config.ts` → `@repo/vitest-config/node` import → 실제 동작.
- [x] walkthrough.md `🧪 검증 결과`에 acceptance 4 로그 + 점검 표 누적.
- [x] Commit: `docs(spec-01-02): record config inspection + acceptance 4 evidence`

---

## Task 3: Acceptance 7 (depcruise violation 0건) 실측

- [x] **호출 방식 결정**: `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` (단순 형태로 동작).
- [x] **1차 시범 실행**: 0 errors + 1 warning (`no-orphans: depcruise-config/base.cjs` — 의도된 false positive).
- [x] **사용자 결정**: 옵션 A (1줄 fix) — `no-orphans.pathNot`에 `^packages/config/.+\\.(?:cjs|mjs|cts|mts|js|ts)$` 추가.
- [x] **2차 시범 실행**: ✔ no dependency violations found (10 modules, 6 dependencies cruised). 0 errors + 0 warnings.
- [x] walkthrough.md `🧪 검증 결과`에 acceptance 7 로그 + 호출 방식 결정 이유 + fix 결정 누적.
- [x] **Phase 1 Acceptance 전수 통과 선언** walkthrough에 박음.
- [x] Commit: `fix(spec-01-02): add config preset paths to no-orphans pathNot + record acceptance 7 evidence`

---

## Task 4: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [x] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린 재확인.
- [x] `bash .harness-kit/bin/sdd test passed` — lastTestPass=2026-05-17T13:44:25Z.
- [x] **walkthrough.md 최종 정리** (점검 표 + acceptance 4/7 + 발견 사항 + Phase 1 전수 통과 선언).
- [x] **pr_description.md 작성**.
- [x] `bash .harness-kit/bin/sdd ship --check` 통과.
- [x] **Ship Commit**: `docs(spec-01-02): ship walkthrough and pr description` (sdd ship 자동).
- [x] **Push**: `git push -u origin spec-01-02-config-and-depcruise-acceptance`.
- [x] **PR 생성**: `gh pr create`.
- [x] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (T1 브랜치 + T2 점검+A4 + T3 A7 + T4 ship) |
| **예상 commit 수** | 3 (T1은 brach 생성만) |
| **현재 단계** | Ship (push + PR 직전) |
| **마지막 업데이트** | 2026-05-17 |
