# Task List: spec-13-03

> One Task = One Commit. TDD 항목은 Red/Green 2 commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] 백로그 업데이트 (phase-13.md SPEC 표)
- [ ] 사용자 Plan Accept

---

## Task 0: 브랜치
- [ ] `git checkout -b spec-13-03-data-foundations` (from phase-13-api-data)

## Task 1: A — `@repo/backend-storage` (TDD)
- [ ] scaffold 패키지 + tsconfig `types:["node"]`
- [ ] `src/index.test.ts` (put/get round-trip · del · exists · url) → Fail
- [ ] Commit: `test(spec-13-03): add failing tests for storage port`
- [ ] `src/index.ts` (Storage 포트 + createMemoryStorage) → Pass
- [ ] Commit: `feat(spec-13-03): add @repo/backend-storage (port + memory adapter)`

## Task 2: B — `typedFetch` (frontend/http-client, TDD)
- [ ] `src/index.test.ts` (fetch 모킹: 정상 parse · parse throw · init 전달) → Fail
- [ ] Commit: `test(spec-13-03): add failing tests for typedFetch`
- [ ] `typedFetch` 구현 + 재노출 → Pass
- [ ] Commit: `feat(spec-13-03): add typedFetch (contract-validated client)`

## Task 3: C — `@repo/factory` (shared, TDD)
- [ ] scaffold 패키지
- [ ] `src/index.test.ts` (시퀀스 · overrides · buildList · reset) → Fail
- [ ] Commit: `test(spec-13-03): add failing tests for createFactory`
- [ ] `src/index.ts` (createFactory) → Pass
- [ ] Commit: `feat(spec-13-03): add @repo/factory (test data factory)`

## Task 4: Ship
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Ship Commit: `docs(spec-13-03): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-13-api-data`) + 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (A·B·C + 브랜치 + Ship) |
| 예상 commit | test 3 + feat 3 + ship 1 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-05-31 |
