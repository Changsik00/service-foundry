# Walkthrough: spec-23-02-hotpath-fixes

> phase-23 두 번째 spec — 23-01 안전망 위에서 핫패스 4건 최적화(동작 보존).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| A1 단일화 방식 | 상관 서브쿼리 1쿼리 / 2쿼리+JS그룹핑 | **2쿼리+JS** | 상관 서브쿼리는 drizzle mock 이 깨짐. 2쿼리(ownerOrgs + 다른멤버 일괄)로 N+1 제거하면서 단위 테스트 유지 |
| A2 실패 처리 | 무시 / 로깅 | **`.catch`+Logger.warn** | fire-and-forget 이지만 실패를 삼키지 않음 |
| A3 캐시 무효화 | 구현 / 주석 | **주석** | 현재 keyStore 는 rotation 없음 → 정적. rotation 도입 시 무효화 필요를 코드 주석으로 남김 |

## 💬 사용자 협의
- spec-23-02 Plan Accept 승인. A5(무제한 limit)·feature-flag 캐싱은 cap 값/배선이 product 결정이라 분리.

## 🧪 검증 결과
- 영향 단위 테스트 20 케이스 그린: account.stores(4)·jwt.service(3)·api-key.service(7)·signin.service(6).
- `apps/api` typecheck 그린. 변경 4파일 Serena LSP 진단 0 (severity≥2).
- 동작 보존: 모든 테스트가 변경 전과 동일 기대값 유지(A1 은 mock 을 2쿼리형으로 갱신했으나 boolean 4 case 동일).

> biome 잔여 경고(api-key:66 noNonNullAssertion, signin:82 useOptionalChain)는 **기존**(미접촉 라인). lefthook biome 훅은 경고로는 커밋을 막지 않음(에러만).

## 🔍 발견 사항
- A1: `isSoleOwnerOfAnyOrg` 가 owner org N개 → 2N+1 쿼리였음. ownerOrgs 1쿼리 + `inArray` 로 다른 멤버 일괄 1쿼리 = **총 2쿼리**로 축소(결과 boolean 동일).
- A2: API key 검증 경로의 동기 `UPDATE last_used_at` 제거 → 인증 응답이 쓰기를 기다리지 않음.
- A3: `getJwks` 가 매 요청 `exportJWK` 재계산 → 최초 1회 캐시.
- A4: signin 의 `createSession`·`orgClaims` 직렬 → 병렬.

## 🚧 이월 항목
- A5(org-list/feature-flag limit)·feature-flag 캐싱 → 23-03 또는 후속.
- 다음: spec-23-03 (convention + dedup, B/C4/D).
