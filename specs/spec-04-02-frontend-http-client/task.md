# Task List: spec-04-02 frontend-http-client

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new frontend-http-client`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (sdd 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1
- [ ] `git checkout -b spec-04-02-frontend-http-client` (시작: `phase-04-frontend-foundation`)
- [ ] Commit 없음

---

## Task 2: catalog 갱신 + 패키지 scaffold

### 2-1
- [ ] `pnpm-workspace.yaml` catalog 에 `ky: ^1.7.5` (또는 최신) 추가
- [ ] `packages/frontend/http-client/{package.json, tsconfig.json, vitest.config.ts}` 박음 (deps: `@repo/errors`, `ky`)
- [ ] `packages/frontend/http-client/src/index.ts` stub (module docstring + export {})
- [ ] `pnpm install` → 25 → 26 workspace projects
- [ ] Commit: `feat(spec-04-02): @repo/frontend-http-client 패키지 scaffold + catalog ky`

본 commit 에 spec-04-02 문서 (spec/plan/task) + backlog auto-update 포함.

---

## Task 3: `createHttpClient` factory + 단위 테스트 (TDD)

### 3-1. test 작성 (Red)
- [ ] `packages/frontend/http-client/src/index.test.ts` — 9 test (fetch mock):
  - GET 200 + schema parse → 결과 반환
  - GET 404 → AppError(BAD_REQUEST)
  - GET 500 → retry → AppError(UPSTREAM)
  - timeout (AbortError) → AppError(TIMEOUT)
  - network error → retry → AppError(NETWORK)
  - schema validation fail → AppError(VALIDATION)
  - POST default (retries 미박힘) → 1회만 시도
  - POST with retries opt → retry 동작
  - headers override → custom 헤더 전달
- [ ] stub `createHttpClient` (throw "not implemented") → typecheck PASS + test Red
- [ ] Commit: `test(spec-04-02): createHttpClient factory test (Red)`

### 3-2. 구현 (Green)
- [ ] `index.ts` 구현 — ky 옵션 매핑 + AppError 변환 layer:
  - `ky.create({ prefixUrl, timeout, retry, hooks, headers })`
  - `retry.limit`, `retry.methods` (idempotent only), `retry.statusCodes` (5xx + 408/429)
  - `hooks.beforeError`: HTTPError → BAD_REQUEST/UPSTREAM, TimeoutError → TIMEOUT, else → NETWORK
  - `request<T>(opts)`: ky chain 호출 → `.json()` → schema?.parse() (fail → VALIDATION)
  - get/post/put/delete/patch — `request` 위 wrap
  - headers merge: default + opts override
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-02): createHttpClient factory (ky + AppError 변환 + zod parse)`

---

## Task 4: 통합 검증

### 4-1
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .` → 0 violations
- [ ] `sdd test passed`
- [ ] Commit: 없음 (검증만)

---

## Task 5: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push: `git push -u origin spec-04-02-frontend-http-client`
- [ ] PR 생성: `gh pr create --base phase-04-frontend-foundation --head spec-04-02-frontend-http-client ...`
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 |
| **예상 commit 수** | 4 (T2 scaffold + T3 Red/Green + T5 ship; T1 브랜치 / T4 검증 commit 없음) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-20 |
