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
- [x] `describe("Result")` 추가 (8 tests: ok / err / isOk / isErr / map ok / map err / flatMap ok / flatMap err+no-call).
- [x] test → Fail 확인 (8 failed | 8 passed).

### 4-2. TDD green
- [x] `Result<T, E = Error>` discriminated union + `ok` / `err` / `isOk` / `isErr` / `map` / `flatMap` 구현.
- [x] test → Pass 확인 (16/16).
- [x] typecheck → PASS.
- [x] Commit: `feat(spec-02-01): add Result type and helpers to @repo/utils`

---

## Task 5: ADR-0008 작성 + depcruise 검증

- [x] `docs/adr/0008-result-type.md` 작성 (frontmatter + Context + Decision + Consequences + Alternatives + Status + Related).
- [x] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → ✔ no dependency violations found (10 modules, 6 dependencies, 0 errors).
- [x] `wc -l packages/shared/utils/src/index.ts` → 67줄 (예상 100~200 하한 미만이나 minimal 4 함수군이라 자연).
- [x] Commit: `docs(spec-02-01): add ADR-0008 result-type convention`

---

## Task 6: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [x] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린.
- [x] `sdd test passed` — lastTestPass=2026-05-17T14:13:11Z.
- [x] **walkthrough.md 작성** (결정 기록 + TDD 흐름 + 발견 사항 — lefthook quirk + DOM lib 패턴).
- [x] **pr_description.md 작성**.
- [x] `sdd ship --check` 통과.
- [x] **Ship Commit**: `docs(spec-02-01): ship walkthrough and pr description` (sdd ship 자동).
- [x] **Push**: `git push -u origin spec-02-01-shared-utils`.
- [x] **PR 생성**: `gh pr create`.
- [x] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (T1 브랜치 + T2 cleanup+sleep + T3 pick+omit + T4 Result + T5 ADR + T6 ship) — *T2/T3 합침* |
| **예상 commit 수** | 5 (T1은 브랜치 생성만) |
| **현재 단계** | Ship (push + PR 직전) |
| **마지막 업데이트** | 2026-05-17 |
