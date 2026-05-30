# spec-12-03: 캐싱 추상화 (`@repo/backend-cache`)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-12-03` |
| **Phase** | `phase-12` |
| **Branch** | `spec-12-03-caching` |
| **타입** | Feature |
| **Integration Test Required** | yes (redis set/get) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
캐싱 추상화가 없어 반복 조회(설정/조회 결과 등)를 매번 재계산/재조회한다. compose 에 redis 가 있으나 캐시로 쓰지 않는다.

### 문제점
- cache-aside(get-or-set) 패턴·TTL 을 표준 제공하는 곳이 없음.
- 테스트에서 redis 없이 캐시 의존 코드를 돌릴 수단 부재.

### 해결 방안 (요약)
`@repo/backend-cache`(core) 에 **`Cache` 포트**(get/set/getOrSet/del + TTL) + **in-memory 어댑터**(테스트/단일 인스턴스용, TTL 만료 포함) + **redis 어댑터**(ioredis)를 제공. 캐시 로직(cache-aside, TTL)은 in-memory 어댑터로 완전 단위 테스트, redis 어댑터는 set/get 통합 스모크로 검증.

## 🎯 요구사항

### Functional Requirements
1. `Cache` 포트: `get<T>(key)`, `set<T>(key, value, ttlSeconds?)`, `getOrSet<T>(key, ttlSeconds, loader)`, `del(key)`.
2. `createMemoryCache()` — Map 기반 + TTL 만료. `getOrSet` 은 미스 시 loader 1회 호출 후 캐시, 히트 시 loader 미호출.
3. `createRedisCache(connection)` — ioredis 기반. 값은 JSON 직렬화. TTL 은 redis EX.
4. 캐시 로직(cache-aside/TTL/del)은 in-memory 어댑터로 단위 테스트 (fake timer TTL 만료 포함).
5. redis 어댑터 set→get round-trip 통합 스모크.
6. 포트는 framework-agnostic (core). ioredis 는 backend 라이브러리(허용).

### Non-Functional Requirements
1. 값 직렬화 일관 (JSON). 만료/미스 시 `get` 은 `null`/`undefined` 규약 일관.
2. ioredis catalog 추가.

## 🚫 Out of Scope
- 분산 캐시 무효화/pub-sub, 캐시 스탬피드 방지(lock) — 기본 cache-aside 까지.
- apps/api 에 실제 캐시 적용 배선 → 후속.
- graceful shutdown(12-04).

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (12-01/02 패턴 연장 — 포트+어댑터)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-12.md` (§성공 기준 3)
- 직전 spec: spec-12-02 (queue-worker)
- 관련 ADR: ADR-0015 (core 경계)

## ✅ Definition of Done
- [ ] in-memory 어댑터 단위 테스트 PASS (getOrSet 미스/히트, TTL 만료, del)
- [ ] redis 어댑터 set→get 통합 스모크 PASS
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-12-runtime`)
- [ ] 사용자 알림
