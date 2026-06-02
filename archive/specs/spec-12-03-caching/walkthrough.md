# Walkthrough: spec-12-03

> 캐싱 추상화 — `@repo/backend-cache` (Cache 포트 + in-memory/redis 어댑터).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 캐시 로직 위치 | 어댑터마다 / 포트 | **포트 + 어댑터** | in-memory 로 로직 단위 테스트, redis 는 실어댑터 |
| 테스트 전략 | redis 통합만 / in-memory+redis | **in-memory(단위) + redis(스모크)** | TTL/cache-aside 를 redis 없이 결정론적 검증 |
| ioredis import | default / named | **named `{ Redis }`** | default import 가 NodeNext 에서 "no construct signatures" — named 로 해결 |
| getOrSet null 규약 | null=미스 | **null=미스(재로드)** | cache-aside 단순화 (문서화) |

### ADR 승격
- [x] 없음 (12-01/02 포트+어댑터 패턴 연장)

## 💬 사용자 협의
- phase-12 세 번째 런타임 기반. 12-04(graceful shutdown) 남음.

## 🧪 검증 결과

### 단위
- `@repo/backend-cache` ✅ 5 passed — set/get, 미스 null, getOrSet(미스 loader 1회/히트 미호출), del, **TTL 만료(fake timer)**

### 통합 (Integration Test Required = yes)
- **명령**: `bash packages/backend/cache/smoke-cache.sh`
- **결과**: ✅ redis 기동 → createRedisCache set→get round-trip 일치

## 🔍 발견 사항
- **ioredis default import 타입 이슈**: `import Redis from "ioredis"` 가 base tsconfig(verbatimModuleSyntax)에서 "no construct signatures" → **named import `{ Redis }`** 로 해결. (런타임은 esbuild 라 통과했으나 typecheck 차단 — 정적 검증의 가치.)
- backend tsconfig `types:["node"]` 보정(생성기 갭, 반복).

## 🚧 이월 항목
- apps/api 에 실제 캐시 적용 배선 → 후속.
- 캐시 스탬피드 방지(lock), 분산 무효화 → 후속.
- graceful shutdown(12-04).

## 🔗 관련
- 관련 phase: `backlog/phase-12.md` (§성공 기준 3)
- 직전 spec: spec-12-02 (queue-worker)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 최종 commit | ship 시 갱신 |
