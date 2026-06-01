# feat(spec-14-05): 보안 포트 (rate-limit + secrets)

## 📋 Summary
### 배경
범용 rate limiter 부재(auth 전용만 존재) + secret 이 process.env 에 하드 결합. 보안 baseline B+ 정체.
### 주요 변경
- [x] **`@repo/backend-rate-limit`**: `RateLimiter` 포트 `consume(key, cost?)` + `createMemoryRateLimiter`(fixed-window, now 주입).
- [x] **`@repo/backend-secrets`**: `SecretsProvider` `get`/`require`(없으면 AppError INTERNAL) + `createEnvSecrets`/`createMemorySecrets`.

### Phase 컨텍스트
- phase-14 성공 기준 4. redis/vault 어댑터는 후속.

## 🎯 Key Review Points
1. auth-rate-limit(로그인 전용)과 **별개** 범용 throttle.
2. secrets 로 process.env 결합 제거 — 교체·테스트 주입 가능.
3. require 실패 = AppError(INTERNAL) (ADR-0020 준수). 새 dep 0.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-rate-limit test   # 5
pnpm --filter @repo/backend-secrets test       # 4
```
+ 본 PR `verify` CI green.

## ✅ Definition of Done
- [x] 두 포트 단위 PASS(9) + typecheck 0
- [ ] 본 PR CI green (관측)

## 🔗 관련
- 후속: redis/vault 어댑터, NestJS 배선. 다음: spec-14-06(changesets+docker) → phase-14 마감.
