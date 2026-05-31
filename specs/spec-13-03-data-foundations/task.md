# Task List: spec-13-03

> One Task = One Commit. TDD 항목은 Red/Green 2 commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] 백로그 업데이트 (phase-13.md SPEC 표)
- [x] 사용자 Plan Accept

---

## Task 0: 브랜치
- [x] `git checkout -b spec-13-03-data-foundations` (from phase-13-api-data)

## Task 1: A — `@repo/backend-storage` (TDD)
- [x] scaffold 패키지 + tsconfig `types:["node"]`
- [x] `src/index.test.ts` (put/get · del · exists · url) → Fail (7)
- [x] Commit: `test(spec-13-03): add failing tests for storage port`
- [x] `src/index.ts` (Storage 포트 + createMemoryStorage) → Pass (7/7)
- [x] Commit: `feat(spec-13-03): add @repo/backend-storage (port + memory adapter)`

## Task 2: B — `createApiClient` (frontend/http-client, TDD)
- [x] 재검증: 기존 client 가 per-call `schema` 검증 보유 → 중복 typedFetch 대신 **선언적 엔드포인트 바인딩** 으로 재조정
- [x] `src/api-client.test.ts` (바인딩 · 검증 반환 · body/headers/path · 검증 실패) → Fail (4)
- [x] Commit: `test(spec-13-03): add failing tests for createApiClient`
- [x] `createApiClient` 구현 → Pass (13/13)
- [x] Commit: `feat(spec-13-03): add createApiClient (contract-validated client)`

## Task 3: C — `@repo/factory` (shared, TDD)
- [x] scaffold 패키지
- [x] `src/index.test.ts` (시퀀스 · overrides · buildList · reset) → Fail (5)
- [x] Commit: `test(spec-13-03): add failing tests for createFactory`
- [x] `src/index.ts` (createFactory) → Pass (5/5)
- [x] Commit: `feat(spec-13-03): add @repo/factory (test data factory)`

## Task 4: Ship
- [x] 전체 단위 PASS (storage 7 + http-client 13 + factory 5) + typecheck 0 (git-hook turbo)
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship Commit: `docs(spec-13-03): ship walkthrough and pr description`
- [x] Push + PR (base `phase-13-api-data`) + 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (A·B·C + 브랜치 + Ship) |
| 예상 commit | test 3 + feat 3 + ship 1 = 7 (+ 계획 docs 1) |
| 현재 단계 | Ship |
| 마지막 업데이트 | 2026-05-31 |
