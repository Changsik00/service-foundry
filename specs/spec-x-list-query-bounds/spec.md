# spec-x-list-query-bounds: 무제한 목록 쿼리에 상한 추가 (A5)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-list-query-bounds` |
| **Branch** | `spec-x-list-query-bounds` |
| **Base 브랜치** | `main` |
| **상태** | Planning |
| **타입** | Fix (하드닝) |
| **작성일** | 2026-06-23 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (phase-24 phase-FF A5 — 유일 실 잔여)

두 목록 쿼리가 `LIMIT` 없이 전 행을 로드:
- `FeatureFlagService.list()` — `select().from(featureFlags)` 무제한 (admin 전용).
- `OrgListService.listForProviderUid()` — 내 멤버십 전체, 무제한 (테넌트 스위처 데이터).

### 문제점

둘 다 자연히 작은 집합(플래그 수·1인 소속 org 수)이라 **현재 실위험은 낮음**. 그러나 상한이 없어 데이터가 비정상 증가하면 메모리/응답 저하. 방어적 cap 이 없다.

### 해결 방안

각 쿼리에 **합리적 상한 `LIMIT` 상수**를 추가(결정적 정렬 동반). 커서 페이지네이션은 과함(이 목록들은 org-members 같은 대형 사용자 목록이 아님) — 단순 cap 으로 충분. cap 초과는 이론적이므로 별도 nextCursor 노출 없이 상한만.

## 요구사항

1. `FeatureFlagService.list()` 에 `LIMIT`(상수, 예: 500) + 안정 정렬(이미 createdAt asc) 유지.
2. `OrgListService.listForProviderUid()` 에 `LIMIT`(상수, 예: 100) + 결정적 정렬 추가.
3. 상한 상수는 명명(매직넘버 금지).
4. 기존 동작(현실적 데이터에서 전 행 반환) 보존 — 단위/e2e 회귀 0.

## Out of Scope

- 커서 페이지네이션 도입 (org-members 는 이미 spec-20-03 에서 보유; 본 대상은 cap 만).
- API 응답 형태 변경(nextCursor 등).

## 핵심 전략

| 대상 | 변경 |
|:---:|:---|
| feature-flag.service | `.limit(FEATURE_FLAG_LIST_MAX)` |
| org-list.service | `.orderBy(asc(...))` + `.limit(ORG_LIST_MAX)` |

## Proposed Changes

#### [MODIFY] `apps/api/src/admin/feature-flag.service.ts`
`list()` 에 `.limit(FEATURE_FLAG_LIST_MAX)` 추가 (명명 상수).

#### [MODIFY] `apps/api/src/auth/org-list.service.ts`
`listForProviderUid()` 에 결정적 정렬 + `.limit(ORG_LIST_MAX)`.

#### [MODIFY] 관련 단위 테스트
limit 전달 검증 (mock db `.limit` 호출 단언).

## 검증 계획

```bash
npx vitest --root apps/api run feature-flag org-list
# 회귀(fresh 5434 DB): admin/org 목록 e2e
DATABASE_URL=... npx vitest --root apps/api run feature-flag org-members admin
npx turbo run lint typecheck test
```

## 롤백 계획

- `git revert`. limit 추가뿐, state/마이그레이션 없음.

## ADR 후보

- [x] 없음

## ✅ Definition of Done

- [ ] 두 서비스에 명명 상수 LIMIT + 정렬
- [ ] 단위 테스트 + e2e 회귀 0, lint/typecheck PASS
- [ ] walkthrough/pr_description ship + push
