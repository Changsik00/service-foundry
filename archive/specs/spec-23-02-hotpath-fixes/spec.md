# spec-23-02: 핫패스 correctness/scaling 수정

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-02` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-02-hotpath-fixes` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
phase-23 감사 A(핫패스). spec-23-01 이 account.stores·jwt.service 등에 회귀 안전망을 깔았으므로 이제 동작을 안전하게 최적화한다.

### 문제점 (실측 확인)
- **A1** `account.stores.ts isSoleOwnerOfAnyOrg` — owner org당 `otherOwners`+`otherMembers` 2쿼리 루프 = **N+1** (owner org N개 → 2N+1 쿼리). 계정 삭제 핫패스.
- **A2** `api-key.service.ts verifyKey:103` — 모든 API 호출마다 `UPDATE api_keys SET last_used_at=now()` 를 **await**(인증 핫패스 동기 쓰기).
- **A3** `jwt.service.ts getJwks` — 매 요청 `toJwks(keyStore)` 재계산(`exportJWK` async). `.well-known/jwks.json` 은 외부 검증자가 자주 폴링.
- **A4** `signin.service.ts` — `createSession` 과 `orgClaims`(독립 DB 조회)가 **순차 await**.

### 해결 방안
A1 단일 집계쿼리(+NOT EXISTS/EXISTS), A2 fire-and-forget(에러 로깅), A3 메모이즈(키 정적 — 현재 keystore 는 rotation 없음), A4 `Promise.all`. 모두 **동작 보존** — 23-01/기존 테스트로 가드.

## 요구사항

1. A1: sole-owner 판정을 단일 쿼리로 — 결과(boolean) 불변. 23-01 테스트 mock 을 새 쿼리형에 맞춰 갱신(기대값 동일).
2. A2: `last_used_at` 갱신을 비차단(fire-and-forget)으로, 실패는 삼키지 말고 로깅. verifyKey 반환·검증 동작 불변.
3. A3: `getJwks` 결과 메모이즈. 반복 호출 동일 결과(23-01 가드). rotation 도입 시 무효화 필요함을 주석화.
4. A4: signin 의 독립 작업(createSession·orgClaims) 병렬화. 토큰/세션 결과 불변.

## Out of Scope

- **A5(무제한 목록 limit)** — org-list/feature-flag 의 cap 값·페이지네이션은 product 결정 → 23-03 또는 후속.
- feature-flag 캐싱(getOrSet) — 캐시 배선 필요, 별도.
- B/C/D/F — 후속 spec.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] 핫패스 동작 변경(특히 A2 fire-and-forget·A3 메모이즈) — 회귀 가드(23-01) 위에서 진행.

## 핵심 전략

| 항목 | 전략 | 회귀 가드 |
|:---:|:---|:---|
| A1 | 단일 SQL (NOT EXISTS 다른 owner + EXISTS 다른 member) | `account.stores.test.ts`(4 case, mock 갱신) |
| A2 | `void pool.query(...).catch(log)` | `api-key.service.test.ts`(반환값 단언) |
| A3 | private 캐시 필드 + 최초 1회 계산 | `jwt.service.test.ts`(반복 동일 kid) |
| A4 | `Promise.all([createSession, orgClaims])` | `signin.service.test.ts` |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/account.stores.ts`
`isSoleOwnerOfAnyOrg` 루프 → 단일 집계쿼리(drizzle `exists`/`notExists` 또는 `sql`). + `account.stores.test.ts` mock 갱신(boolean 기대 동일).

#### [MODIFY] `apps/api/src/auth/api-key.service.ts`
`verifyKey` 의 `last_used_at` UPDATE 를 await 제거 + `.catch` 로깅.

#### [MODIFY] `apps/api/src/jwt/jwt.service.ts`
`getJwks` 결과 캐시(`private cachedJwks`). rotation 무효화 주석.

#### [MODIFY] `apps/api/src/auth/signin.service.ts`
`createSession` + `orgClaims` 병렬화 후 `signAccessToken`.

## 검증 계획

```bash
pnpm vitest run apps/api/src/auth/account.stores.test.ts apps/api/src/jwt/jwt.service.test.ts \
  apps/api/src/auth/api-key.service.test.ts apps/api/src/auth/signin.service.test.ts   # 그린 유지
pnpm turbo run typecheck --filter=./apps/api
# A1 쿼리 수 감소 육안 확인(루프 제거)
```

수동 검증:
1. 23-01 + 기존 단위 테스트 그린 = 동작 보존.
2. (CI e2e) 인증/계정삭제 풀사이클 회귀 없음.

## ADR 후보
- [x] 없음 — 동작 보존 최적화. (rotation 캐시 무효화는 주석 수준)

## ✅ Definition of Done

- [ ] A1~A4 적용 + 관련 단위 테스트 그린(동작 보존)
- [ ] `apps/api` typecheck/lint 그린
- [ ] walkthrough/pr_description ship + push
