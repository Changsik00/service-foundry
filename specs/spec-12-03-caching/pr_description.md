# feat(spec-12-03): 캐싱 추상화 (`@repo/backend-cache`)

## 📋 Summary

### 배경 및 목적
cache-aside/TTL 을 표준 제공하는 곳이 없었다. 본 spec 은 `@repo/backend-cache`(Cache 포트 + in-memory/redis 어댑터)를 추가해 반복 조회 캐싱 기반을 마련한다.

### 주요 변경
- [x] **`Cache` 포트** — get/set/**getOrSet**(cache-aside)/del + TTL
- [x] **in-memory 어댑터** — Map + TTL 만료 (테스트/단일 인스턴스)
- [x] **redis 어댑터** — ioredis, JSON 직렬화, EX TTL
- [x] in-memory 단위(로직 전부) + redis round-trip 통합 스모크

### Phase 컨텍스트
- **Phase**: `phase-12` (Service Foundations I · Runtime)
- **역할**: 성공 기준 3(cache-aside + TTL, redis 통합) 충족.

## 🎯 Key Review Points
1. **테스트 분리**: 캐시 로직(cache-aside/TTL)은 in-memory 로 결정론적 단위 테스트(fake timer), redis 는 set→get 통합 스모크.
2. **ioredis named import**: default import 가 NodeNext typecheck 에서 "no construct signatures" → `{ Redis }` 로 해결.
3. **포트 경계**: 소비자는 `Cache` 포트만 의존 → in-memory↔redis 교체.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-cache test       # 5 passed
bash packages/backend/cache/smoke-cache.sh    # redis round-trip
```

## 📦 Files Changed
### 🆕 New
- `packages/backend/cache/src/{port,memory,redis,index}.ts` (+ memory.test)
- `packages/backend/cache/{roundtrip.ts,smoke-cache.sh}`
### 🛠 Modified
- `pnpm-workspace.yaml` (ioredis catalog)

**Total**: 12 files (+308)

## ✅ Definition of Done
- [x] in-memory 단위 PASS (5, TTL 만료 포함)
- [x] redis round-trip 통합 PASS
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-12.md`
- 후속: graceful shutdown(12-04), apps/api 캐시 적용
