# Task List: spec-12-03

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-12.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + cache 패키지 + in-memory 어댑터 (TDD)

### 1-1. 브랜치 + scaffold
- [x] `git checkout -b spec-12-03-caching`
- [x] `pnpm new package cache backend` + tsconfig `types:["node"]` + ioredis catalog/dep

### 1-2. 포트 + in-memory 테스트 (Red, throwing 스텁)
- [x] `src/port.ts`(Cache) + `src/memory.ts` 스텁 + `src/memory.test.ts`
- [x] Fail → Commit: `test(spec-12-03): scaffold backend-cache + failing memory cache tests`

### 1-3. in-memory 구현 (Green)
- [x] `src/memory.ts` (Map + 만료) + index export
- [x] Pass (5/5) → Commit: `feat(spec-12-03): implement in-memory cache (cache-aside + TTL)`

---

## Task 2: redis 어댑터 + 통합 스모크

### 2-1. redis 어댑터 + round-trip
- [x] `src/redis.ts` (`createRedisCache`, ioredis named import, JSON, EX TTL) + index export
- [x] `roundtrip.ts` + `smoke-cache.sh` — redis 기동 → set→get → 정리
- [x] `bash ...smoke-cache.sh` → PASS + typecheck (ioredis 기본 import 타입 이슈 → named import 해결)
- [x] Commit: `feat(spec-12-03): add redis cache adapter and round-trip smoke`

---

## Task 3: Ship
- [x] 단위 PASS (5) + 통합 smoke PASS
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-12-03): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 3 (작업 2 + Ship) |
| 예상 commit | test 1 + feat 2 + ship 1 |
| 현재 단계 | Planning |
