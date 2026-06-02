# Task List: spec-x-governance-reset-package-layout

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> **spec-x — phase-bound 아님**: PR base = `main` (phase branch 우회).
> 본 spec은 *문서/룰만* — 코드 변경 0, TDD 사이클 없음.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout main && git pull --ff-only`
- [ ] `git checkout -b spec-x-governance-reset-package-layout`
- [ ] Commit: 없음

---

## Task 2: ADR-0015 신규 작성

- [ ] `docs/adr/0015-framework-adapter-naming-and-layout.md` 작성:
  - 상태 / 날짜 / 스코프
  - 배경 (ADR-0003 + platform-agnostic 발견 경위)
  - 결정 (카테고리 / 명명 / 의존 방향 표)
  - 검토한 대안 (A suffix / B1 / B2 / B3) — 5 round-trip 논의 요약
  - 결과 (장점/단점)
  - 재검토 기준
  - 관련 문서 (ADR-0003 / memory `feedback_platform_agnostic_packages`)
- [ ] Commit: `docs(spec-x): add ADR-0015 framework adapter naming and layout`

---

## Task 3: ADR-0003 갱신 + cross-link

- [ ] `docs/adr/0003-package-layout-and-naming.md` 수정:
  - §2 카테고리 트리에 framework adapter 카테고리 추가 (`nestjs/` `react/` 등)
  - §4 직후 §4-bis "Framework adapter naming" 신규 절
  - §6 (카테고리 배치 규칙) 갱신 — *framework adapter는 framework 카테고리 사용* 룰
  - 관련 문서에 ADR-0015 cross-link
- [ ] Commit: `docs(spec-x): update ADR-0003 with framework adapter category`

---

## Task 4: ARCHITECTURE.md 갱신

- [ ] `ARCHITECTURE.md` 수정:
  - §3 (디렉토리 트리) 새 카테고리 반영
  - §3.2 depcruise 룰 도식 갱신 (`<framework>/* → <tier>/*` 단방향)
  - *기존 backend-logger-nestjs는 임시 위반 (후속 spec에서 정정)* 각주
- [ ] Commit: `docs(spec-x): update ARCHITECTURE.md with framework adapter rules`

---

## Task 5: depcruise config 갱신

- [ ] `packages/config/depcruise-config/base.cjs` 수정:
  - `forbidden` 룰 추가: `no-pure-on-framework` (backend/* → nestjs/*, frontend/* → react/* 금지)
  - `forbidden` 룰 추가: `no-cross-framework-tier` (nestjs/* → frontend/*, react/* → backend/* 금지)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` 실행:
  - 기대: 기존 코드는 위반 0 (현재 backend-logger-nestjs는 backend/ 카테고리 안에 있어 본 룰 적용 안 됨)
  - 후속 spec에서 `nestjs/` 카테고리로 이동 시 본 룰이 즉시 검증
- [ ] Commit: `feat(spec-x): add framework adapter depcruise rules`

---

## Task 6: memory 2개 갱신

- [ ] `/Users/dennis/.claude/projects/-Users-dennis-Project-ck-service-foundry/memory/project_boilerplate_package_layout.md`:
  - 카테고리 5개 → 7+ (`nestjs/` `react/` 등 framework adapter 카테고리 추가)
  - 명명 룰 (framework-first prefix) 추가
- [ ] `/Users/dennis/.claude/projects/-Users-dennis-Project-ck-service-foundry/memory/feedback_platform_agnostic_packages.md`:
  - naming 룰 추가 (`<framework>-<name>` prefix, suffix 금지)
  - ADR-0015 cross-link
- [ ] `MEMORY.md` index 갱신 (necessary 시)
- [ ] Commit: `docs(spec-x): update memory — package layout + naming rules`

---

## Task 7: Ship (필수)

- [ ] **walkthrough.md 작성** (결정 + 5 round-trip 논의 요약 + 임시 위반 인정).
- [ ] **pr_description.md 작성** (10 Key Review Points + 후속 spec 가이드).
- [ ] `bash .harness-kit/bin/sdd test passed` (테스트 없음이라 manual).
- [ ] `sdd ship --check` 통과.
- [ ] **Ship Commit**: sdd ship 자동.
- [ ] **Push**: `git push -u origin spec-x-governance-reset-package-layout`.
- [ ] **PR 생성**: `gh pr create --base main` (spec-x → main 직접).
- [ ] **사용자 알림**.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (T1 브랜치 + T2 ADR-0015 / T3 ADR-0003 / T4 ARCHITECTURE / T5 depcruise / T6 memory + T7 ship) |
| **예상 commit 수** | 6 (T1 commit 없음) |
| **예상 test 수** | 0 (문서/룰만) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
