# Task List: spec-15-05

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
- [x] `git checkout -b spec-15-05-generator-tsconfig` (phase base 에서)
- [x] Commit: `docs(spec-15-05): add spec/plan/task`

## Task 2: 템플릿 fix + 단위 테스트 (TDD)
- [x] Red: `turbo/generators/lib/templates.test.ts` — `tsconfig()` 카테고리별 출력(backend → types:[node], shared → lib, frontend → tsx, config → 미생성). backend 케이스 Fail 확인.
- [x] Green: `templates.ts` `tsconfig()` 에 backend → `{ types: ["node"] }` 분기 추가.
- [x] 검증: `pnpm exec vitest run turbo/generators/lib/templates.test.ts` PASS (5/5)
- [x] Commit: `fix(spec-15-05): generate backend tsconfig with types:["node"]` (c861e57)

## Task 3: 생성물 typecheck 수동 검증 (커밋 없음)
- [x] `turbo gen package --args backend tmp-gencheck` 생성 → tsconfig 에 `types:["node"]` 확인 → src 에 `console.log(process.pid)` 추가 → `pnpm --filter @repo/backend-tmp-gencheck typecheck` PASS(exit=0). 대조군(types 제거)은 console/process 미해결로 exit=2. 디렉토리 삭제(git clean) + lockfile 원복(git checkout).
- [x] 증거를 walkthrough 에 기록. (코드 변경 없음 → 커밋 불요)

## Task 4: Ship
- [x] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS (136/136)
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship commit: `docs(spec-15-05): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-15-security-wiring`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (ship 포함, task-3 검증전용) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-01 |
