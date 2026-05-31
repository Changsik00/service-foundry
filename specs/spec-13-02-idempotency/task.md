# Task List: spec-13-02

> One Task = One Commit.

## Pre-flight
- [x] spec/plan/task 작성
- [x] 백로그 갱신
- [x] Plan Accept

## Task 1: 브랜치 + withIdempotency (TDD)
### 1-1 브랜치 + scaffold
- [x] `git checkout -b spec-13-02-idempotency`
- [x] `pnpm new package idempotency backend` + tsconfig types:node + @repo/backend-cache dep
### 1-2 테스트 (Red, throwing 스텁)
- [x] `src/index.ts` 스텁 + `src/index.test.ts` (실행/재생/다른키/예외)
- [x] Fail → Commit: `test(spec-13-02): add failing tests for withIdempotency`
### 1-3 구현 (Green)
- [x] `src/index.ts`
- [x] Pass → Commit: `feat(spec-13-02): implement withIdempotency (cache-backed)`

## Task 2: Ship
- [x] 단위 PASS + typecheck
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-13-02): ship walkthrough and pr description`
- [x] Push + PR + 알림
