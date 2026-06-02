# Task List: spec-16-02

> One Task = One Commit. 매 commit 직후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋
- [x] `git checkout -b spec-16-02-auth-bootstrap-security-sot` (phase base 에서)
- [x] Commit: `docs(spec-16-02): add spec/plan/task`

## Task 2: applySecurity → configureApp 흡수 + e2e (TDD)
- [x] Red: "보안 헤더(helmet)" describe — `x-content-type-options: nosniff`. 흡수 전 헤더 부재로 Fail 확인.
- [x] Green: `configureApp(app, {corsOrigin})` 에 applySecurity 추가; main.ts 인라인 제거 + corsOrigin 주입.
- [x] 검증: `pnpm --filter @apps/api test` 105/105 PASS + 대조(제거 시 helmet e2e FAIL) 확인 후 원복.
- [x] Commit: `fix(spec-16-02): absorb applySecurity into configureApp SoT` (ae9e4fe)

## Task 3: Ship
- [x] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS (136/136)
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship commit: `docs(spec-16-02): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-16-security-hardening`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (ship 포함) |
| **예상 commit 수** | 2 (fix + ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-02 |
