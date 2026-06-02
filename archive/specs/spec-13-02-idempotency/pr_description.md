# feat(spec-13-02): 멱등성 헬퍼 (@repo/backend-idempotency)

## 📋 Summary
### 배경
동일 요청(재시도/더블클릭) 중복 처리 방지 수단 부재.
### 주요 변경
- [x] `@repo/backend-idempotency` `withIdempotency(cache, key, ttl, fn)` — 캐시 히트 시 재생, 미스 시 실행+저장
- [x] 저장소 = `@repo/backend-cache` 포트 재사용(redis TTL / 테스트 in-memory)
- [x] fn 예외 시 미저장(재시도 가능)
### Phase 컨텍스트
- phase-13, 성공 기준 2(멱등 키 재요청 시 저장 응답 반환).

## 🎯 Key Review Points
1. 멱등 dedup = cache-aside 조합 → 12-03 재사용.
2. core(framework-agnostic) — HTTP 인터셉터는 후속.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-idempotency test   # 4 passed
```

## 📦 Files Changed
- `packages/backend/idempotency/src/{index,index.test}.ts` (+package/tsconfig)

## ✅ Definition of Done
- [x] 단위 PASS (4) + typecheck
- [x] walkthrough / pr_description ship

## 🔗 관련
- 후속: HTTP 인터셉터, spec-13-03 typed client
