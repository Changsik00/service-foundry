# Implementation Plan: spec-13-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-13-02-idempotency` (from `phase-13-api-data`)
- base 모드: PR target = `phase-13-api-data`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 저장소 = `@repo/backend-cache` 포트 재사용(redis TTL / 테스트 in-memory) — 신규 저장소 없음.
> - [ ] HTTP 인터셉터는 후속 — 본 spec 은 core `withIdempotency` 헬퍼.

## 🎯 핵심 전략
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 헬퍼 | `withIdempotency(cache, key, ttl, fn)` | 캐시-기반 dedup, 순수 조합 |
| 저장소 | `Cache` 포트 주입 | 12-03 재사용, 테스트 in-memory |
| 예외 | fn throw 시 미저장 | 실패 재시도 허용 |
| 테스트 | in-memory cache 단위 | 결정론적 |

## 📂 Proposed Changes
### @repo/backend-idempotency (신규, 생성기 scaffold + tsconfig types:node)
- [NEW] `src/index.ts` — `withIdempotency` (+ `.test.ts`)
- package.json: `@repo/backend-cache` (workspace) dep

## 🧪 검증 계획
### 단위
```bash
pnpm --filter @repo/backend-idempotency test
```
첫 실행(fn 1회+저장), 재생(fn 미실행), 다른 키 독립, fn 예외 시 미저장.

## 🔁 Rollback
- 신규 패키지만. 제거로 롤백.

## 📦 Deliverables
- [ ] task.md / Plan Accept / ship
