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
- [ ] `pnpm-workspace.yaml` catalog 에 `helmet` + `@nestjs/throttler` 추가
- [ ] `pnpm install` 실행 → lockfile 갱신
- [ ] Commit: `chore(spec-03-07): catalog 에 helmet + @nestjs/throttler 추가`

---

## Task 3: `@repo/nestjs-security` 패키지 scaffold

### 3-1. 패키지 메타 + 디렉토리
- [ ] `packages/nestjs/security/package.json` 작성 (`@repo/nestjs-security`)
- [ ] `packages/nestjs/security/tsconfig.json` (다른 어댑터와 동일)
- [ ] `packages/nestjs/security/biome.json` (다른 어댑터와 동일)
- [ ] `packages/nestjs/security/vitest.config.ts` (다른 어댑터와 동일)
- [ ] `pnpm install` 실행 → workspace 인식
- [ ] Commit: `feat(spec-03-07): @repo/nestjs-security 패키지 scaffold`

---

## Task 4: `applySecurity` helper + test (TDD)

### 4-1. test 작성 (Red)
- [ ] `packages/nestjs/security/src/index.test.ts` — `applySecurity` describe 블록
  - default opts → `app.use(helmet(...))` + `app.enableCors()` 호출
  - `opts.helmet === false` → helmet skip
  - `opts.cors === false` → enableCors skip
  - opts 전달 forward 확인
- [ ] 테스트 실행 → Fail (index.ts 없음)
- [ ] Commit: `test(spec-03-07): applySecurity helper test (Red)`

### 4-2. 구현 (Green)
- [ ] `packages/nestjs/security/src/index.ts` — `SecurityOptions` + `applySecurity` 구현
- [ ] 테스트 실행 → Pass
- [ ] Commit: `feat(spec-03-07): applySecurity helper (helmet + cors wire-up)`

---

## Task 5: `BackendThrottlerModule` + test (TDD)

### 5-1. test 작성 (Red)
- [ ] `index.test.ts` 에 `BackendThrottlerModule.forRoot` describe 블록 추가
  - DynamicModule 구조 (module / imports / providers / exports / global)
  - APP_GUARD provider 존재 + useClass === ThrottlerGuard
  - default ttl/limit 검증 (간접)
- [ ] 테스트 실행 → Fail
- [ ] Commit: `test(spec-03-07): BackendThrottlerModule test (Red)`

### 5-2. 구현 (Green)
- [ ] `index.ts` 에 `BackendThrottlerOptions` + `BackendThrottlerModule` 추가
- [ ] 테스트 실행 → Pass
- [ ] Commit: `feat(spec-03-07): BackendThrottlerModule (rate-limit via @nestjs/throttler)`

---

## Task 6: 통합 검증 (lint / typecheck / depcruise)

### 6-1. 전체 품질 점검
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations
- [ ] Commit: 없음 (검증만) — 필요시 미세 정정 시 한 commit (`fix(spec-03-07): ...`)

---

## Task 7: Ship

> 모든 작업 task 완료 후 `/hk-ship` 절차.

- [ ] 코드 품질 점검 (lint / type check / test / depcruise) 최종
- [ ] **walkthrough.md 작성** (결정/협의/진행/검증/발견/이월)
- [ ] **pr_description.md 작성** (Summary + Key Review Points + Verification + DoD)
- [ ] **Ship Commit**: `docs(spec-03-07): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-03-07-backend-security`
- [ ] **PR 생성**: `gh pr create --base phase-03-backend-foundation --head spec-03-07-backend-security ...`
- [ ] **사용자 알림**: 푸시 완료 + PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 |
| **예상 commit 수** | 7 (catalog + scaffold + helper test/impl + module test/impl + ship; 검증 task 는 commit 없음, 필요시 +1) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-19 |
