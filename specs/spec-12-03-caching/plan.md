# Implementation Plan: spec-12-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-12-03-caching` (from `phase-12-runtime`)
- base 모드: PR target = `phase-12-runtime`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 캐시 로직은 in-memory 어댑터로 단위 테스트, redis 어댑터는 통합 스모크.
> - [ ] ioredis catalog 추가. backend tsconfig `types:["node"]` 보정(생성기 갭).

> [!WARNING]
> - [ ] redis 스모크는 docker redis 기동 → 포트 override + 종료 시 cache.close 필수(누수).

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 포트 | `Cache`(get/set/getOrSet/del) | cache-aside 표준 |
| in-memory | Map + 만료 timestamp | 단위 테스트(로직 전부) |
| redis | ioredis + JSON + EX TTL | 실 캐시 |
| 테스트 | 단위(in-memory, fake timer) + 통합(redis set/get) | 로직/실어댑터 분리 검증 |

## 📂 Proposed Changes

### @repo/backend-cache (신규, 생성기 scaffold + tsconfig types:node)
- [NEW] `src/port.ts` — `Cache` 인터페이스
- [NEW] `src/memory.ts` — `createMemoryCache()` (+ `.test.ts`: getOrSet 미스/히트, TTL, del)
- [NEW] `src/redis.ts` — `createRedisCache(connection)` (ioredis)
- [NEW] `src/index.ts` — export
- package.json: `ioredis` (catalog)

### 통합 테스트
- [NEW] `packages/backend/cache/roundtrip.ts` + `smoke-cache.sh` — redis 기동 → set→get(+TTL) → 정리

### 루트
- [MODIFY] pnpm-workspace.yaml — `ioredis` catalog

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/backend-cache test
```
in-memory: getOrSet loader 1회/히트 미호출, TTL 만료(fake timer), del.

### 통합 (Integration Test Required = yes)
```bash
bash packages/backend/cache/smoke-cache.sh
```
redis 기동 → createRedisCache set→get round-trip → 정리.

## 🔁 Rollback
- 신규 패키지 + ioredis dep. 제거로 롤백. 기존 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
