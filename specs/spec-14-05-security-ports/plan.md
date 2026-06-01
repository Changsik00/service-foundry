# Implementation Plan: spec-14-05

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-05-security-ports`
- 시작 지점: `phase-14-quality-cicd`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 신규 포트 2개 (범용 rate-limit, secrets). auth-rate-limit 과 별개.
> [!WARNING]
> - [ ] redis/vault 어댑터는 범위 외(포트 + memory/env 만). 성공 기준 4 충족, 원격 어댑터 후속.

## 🎯 핵심 전략
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| rate-limit | fixed-window per key + `now` 주입 | 단순·결정성 테스트, redis 후속 |
| secrets | get/require 포트 + env/memory | env 결합 제거, require 실패=AppError(ADR-0020) |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

### Task 1 — `@repo/backend-rate-limit` (NEW, TDD)
#### [NEW] `packages/backend/rate-limit/src/index.ts`
```text
interface RateLimitResult { allowed: boolean; remaining: number; retryAfterMs: number }
interface RateLimiter { consume(key: string, cost?: number): Promise<RateLimitResult> }
createMemoryRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }): RateLimiter
  // per-key { count, windowStart }. now-windowStart >= windowMs → reset.
  // count+cost <= limit → allowed (count+=cost, remaining=limit-count, retryAfterMs=0)
  // else → allowed:false, retryAfterMs = windowStart+windowMs-now, remaining=0
```
#### [NEW] `src/index.test.ts`
- 한도 내 허용 + remaining 감소 · 초과 차단(retryAfterMs>0) · 윈도우 경과 후 리셋(now 주입) · cost>1 · 키별 독립.
> package.json(types:node) + tsconfig + vitest.config.

### Task 2 — `@repo/backend-secrets` (NEW, TDD)
#### [NEW] `packages/backend/secrets/src/index.ts`
```text
interface SecretsProvider { get(key): Promise<string|null>; require(key): Promise<string> }
createEnvSecrets(env: Record<string,string|undefined> = process.env): SecretsProvider
createMemorySecrets(map: Record<string,string>): SecretsProvider
  // get → 값 ?? null. require → 값 없으면 throw AppError({code:"INTERNAL", statusCode:500})
```
#### [NEW] `src/index.test.ts`
- env get 존재/부재(null) · memory get · require 존재 · require 부재 → AppError(INTERNAL) · 빈 문자열 처리.

## 🧪 검증 계획
```bash
pnpm --filter @repo/backend-rate-limit --filter @repo/backend-secrets test
pnpm turbo run typecheck
```
+ 본 PR `verify` CI green.

## 🔁 Rollback Plan
- 신규 패키지 2 디렉토리 삭제. 의존 0 → 영향 0.

## 📦 Deliverables 체크
- [ ] task.md / Plan Accept / 실행 / ship
