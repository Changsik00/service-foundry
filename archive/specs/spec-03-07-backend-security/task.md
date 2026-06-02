# Task List: spec-03-07 backend-security

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new backend-security`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 phase-03.md spec 표 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-03-07-backend-security` (시작: `phase-03-backend-foundation`)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: catalog 갱신 (helmet + @nestjs/throttler)

### 2-1. catalog 추가
- [x] `pnpm-workspace.yaml` catalog 에 `helmet` + `@nestjs/throttler` 추가
- [x] `pnpm install` 실행 → lockfile 갱신 (현 시점 어떤 패키지도 의존 안 함 — 변경 없음)
- [x] Commit: `chore(spec-03-07): catalog 에 helmet + @nestjs/throttler 추가` (`9848c9a`)

---

## Task 3: `@repo/nestjs-security` 패키지 scaffold

### 3-1. 패키지 메타 + 디렉토리
- [x] `packages/nestjs/security/package.json` 작성 (`@repo/nestjs-security`)
- [x] `packages/nestjs/security/tsconfig.json` (다른 어댑터와 동일)
- [x] `packages/nestjs/security/vitest.config.ts` (다른 어댑터와 동일)
- [x] `packages/nestjs/security/src/index.ts` stub (module docstring)
- [x] `pnpm install` 실행 → workspace 인식 (21 projects)
- [x] Commit: `feat(spec-03-07): @repo/nestjs-security 패키지 scaffold` (`4921bce`)

---

## Task 4: `applySecurity` helper + test (TDD)

### 4-1. test 작성 (Red)
- [x] `packages/nestjs/security/src/index.test.ts` — `applySecurity` describe 블록 (4 test)
- [x] stub function (SecurityOptions + throw) → typecheck 통과 + test 4/4 Red
- [x] Commit: `test(spec-03-07): applySecurity helper test (Red)` (`29c250f`)

### 4-2. 구현 (Green)
- [x] `packages/nestjs/security/src/index.ts` — `applySecurity` 본체 (helmet + cors 분기)
- [x] 테스트 실행 → 4/4 PASS
- [x] Commit: `feat(spec-03-07): applySecurity helper (helmet + cors wire-up)` (`a13616e`)

---

## Task 5: `BackendThrottlerModule` + test (TDD)

### 5-1. test 작성 (Red)
- [x] `index.test.ts` 에 `BackendThrottlerModule.forRoot` describe 블록 추가 (3 test)
- [x] stub `@Module({}) class { static forRoot throws }` → typecheck 통과
- [x] Commit: `test(spec-03-07): BackendThrottlerModule test (Red)` (`f48a070`)

### 5-2. 구현 (Green)
- [x] `index.ts` 에 `BackendThrottlerOptions` + `BackendThrottlerModule` 본체 (ThrottlerModule.forRoot wrap + APP_GUARD provider)
- [x] 테스트 실행 → 7/7 PASS (applySecurity 4 + throttler 3)
- [x] Commit: `feat(spec-03-07): BackendThrottlerModule (rate-limit via @nestjs/throttler)` (`fb5cefb`)

---

## Task 6: 통합 검증 (lint / typecheck / depcruise)

### 6-1. 전체 품질 점검
- [x] `pnpm lint` → 14 tasks PASS
- [x] `pnpm typecheck` → 14 tasks FULL TURBO
- [x] `pnpm test` → 153 test PASS (nestjs-security 7 신규)
- [x] `pnpm exec depcruise` → 0 violations (67 modules / 102 deps)
- [x] `sdd test passed` 호출 — `2026-05-19T09:59:01Z`
- [x] Commit: 없음 (검증만)

---

## Task 7: Ship

> 모든 작업 task 완료 후 `/hk-ship` 절차.

- [x] 코드 품질 점검 (lint / type check / test / depcruise) 최종 — Task 6 에서 완료
- [x] **walkthrough.md 작성** (결정 10 / 협의 4 / 진행 7 / 검증 / 발견 7 / 이월 5)
- [x] **pr_description.md 작성** (Summary + Key Review Points 10 + Verification + DoD)
- [x] **Ship Commit**: `docs(spec-03-07): ship walkthrough and pr description` (`54b6e65`, sdd ship 자동)
- [x] **Push**: `git push -u origin spec-03-07-backend-security`
- [x] **PR 생성**: [PR #17](https://github.com/Changsik00/service-foundry/pull/17) (base = `phase-03-backend-foundation`)
- [x] **사용자 알림**: 푸시 완료 + PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 |
| **실 commit 수** | 7 (T2 catalog + T3 scaffold + T4 Red/Green + T5 Red/Green + T7 ship) |
| **현재 단계** | Ship (PR 생성 직전) |
| **마지막 업데이트** | 2026-05-19 |
