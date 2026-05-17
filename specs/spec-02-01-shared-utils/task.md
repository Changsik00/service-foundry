# Task List: spec-02-01

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`specs/spec-02-01-shared-utils/`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] phase-02.md SPEC 표 자동 갱신 (sdd spec new 시점)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 작업 브랜치 생성
- [x] `git checkout -b spec-02-01-shared-utils`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: `identity` → `sleep` 교체 (cleanup + 첫 함수)

> **결정 변경**: T2 단독 cleanup commit은 vitest "no tests in file" 룰로 실패. T2+T3 합쳐 `identity` 제거와 `sleep` 추가를 한 commit으로 처리.

### 2-1. TDD red
- [x] `index.test.ts`에서 `identity` describe 제거 + `describe("sleep")` 추가 (정상 + 0ms edge).
- [x] test → Fail 확인 (2 tests failed, `sleep is not defined`).

### 2-2. TDD green
- [x] `index.ts`에서 `identity` 제거 + `sleep` 구현 + 문서 주석.
- [x] test → Pass 확인 (2 tests passed, 24ms).
- [x] Commit: `feat(spec-02-01): replace identity placeholder with sleep utility`

---

## Task 3: `pick` + `omit` 구현

### 3-1. TDD red
- [x] `describe("pick")` 추가: 정상(키 부분집합) + edge(빈 keys / 존재 안 하는 키).
- [x] `describe("omit")` 추가: 정상(키 제외) + edge(빈 keys / 모든 키 제외).
- [x] test → Fail 확인 (6 failed | 2 passed).

### 3-2. TDD green
- [x] `pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K>` 구현 (hasOwnProperty 가드).
- [x] `omit<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K>` 구현 (spread + delete).
- [x] test → Pass 확인 (8/8).
- [x] Commit: `feat(spec-02-01): add pick and omit utilities to @repo/utils`

---

## Task 4: `Result<T, E>` + 6 helpers 구현

### 4-1. TDD red
- [ ] `describe("Result")` 추가:
  - `ok(42)` → `{ ok: true, value: 42 }`
  - `err(new Error("x"))` → `{ ok: false, error: Error("x") }`
  - `isOk` / `isErr` 타입 가드 동작
  - `map(ok(2), (x) => x + 1)` → `ok(3)`
  - `map(err(e), fn)` → `err(e)` (fn 호출 안 됨)
  - `flatMap(ok(2), (x) => ok(x + 1))` → `ok(3)`
  - `flatMap(err(e), fn)` → `err(e)` (fn 호출 안 됨)
- [ ] test → Fail 확인.

### 4-2. TDD green
- [ ] `Result<T, E = Error>` type + `ok` / `err` / `isOk` / `isErr` / `map` / `flatMap` 구현.
- [ ] test → Pass 확인.
- [ ] Commit: `feat(spec-02-01): add Result type and helpers to @repo/utils`

---

## Task 5: ADR-0008 작성 + depcruise 검증

- [ ] `docs/adr/0008-result-type.md` 작성:
  - 메타: status=채택됨, date=2026-05-17, type=convention
  - 배경: 에러 처리 표준화 필요성
  - 결정: discriminated union + 함수 helper
  - 대안 분석: class chaining / Either monad / `unwrap` 제공 / try-throw 일변도
  - 결과: phase-02/03/04 전체에서 본 패턴 사용
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` 실행 → violation 0건 확인.
- [ ] `wc -l packages/shared/utils/src/index.ts` → 100~200줄 범위 확인.
- [ ] Commit: `docs(spec-02-01): add ADR-0008 result-type convention`

---

## Task 6: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린 재확인.
- [ ] `bash .harness-kit/bin/sdd test passed` — lastTestPass 갱신.
- [ ] **walkthrough.md 최종 정리**: 결정 기록 + 4 함수군 디자인 노트 + depcruise 회귀 검증 + ADR-0008 링크.
- [ ] **pr_description.md 작성**.
- [ ] `bash .harness-kit/bin/sdd ship --check` 통과.
- [ ] `bash .harness-kit/bin/sdd ship` — Ship commit 자동 생성.
- [ ] **Push**: `git push -u origin spec-02-01-shared-utils`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치 + T2 cleanup+sleep + T3 pick+omit + T4 Result + T5 ADR + T6 ship) — *T2/T3 합침* |
| **예상 commit 수** | 5 (T1은 브랜치 생성만) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-17 |
