fix(spec-x-list-query-bounds): bound feature-flag/org-list queries with LIMIT

## 📋 Summary

### 배경 및 목적
phase-24 phase-FF A5(유일 실 잔여). 두 목록 쿼리가 `LIMIT` 없이 전 행 로드:
- `FeatureFlagService.list()` (admin)
- `OrgListService.listForProviderUid()` (테넌트 스위처)

자연히 소수 집합이라 실위험은 낮으나, 방어적 상한이 없어 비정상 증가 시 메모리/응답 저하. 단순 cap 추가.

### 주요 변경 사항
- [x] `feature-flag.service`: `.limit(FEATURE_FLAG_LIST_MAX=500)` (명명 상수)
- [x] `org-list.service`: 결정적 정렬(`asc(memberships.createdAt)`) + `.limit(ORG_LIST_MAX=100)`

### 타입
- **Fix (하드닝)** · spec-x → main

## 🎯 Key Review Points
1. 커서 페이지네이션 대신 **단순 cap** — 두 목록은 대형 사용자 목록(org-members)과 달리 소수.
2. 명명 상수(매직넘버 금지), org-list 에 결정적 정렬 동반.

## 🧪 Verification
```bash
turbo run lint typecheck test   # fresh 5434 DB → 151/151
```
**결과**: ✅ 151/151. feature-flag/org-list 단위 `.limit` 단언 + 회귀 0.

## 📦 Files Changed
- `apps/api/src/admin/feature-flag.service.ts`
- `apps/api/src/auth/org-list.service.ts`
- `apps/api/src/admin/feature-flag.service.test.ts` · `apps/api/src/auth/org-list.service.test.ts`

## ✅ Definition of Done
- [x] 두 서비스 명명 상수 LIMIT + 정렬
- [x] 단위 + 전체 회귀 0, lint/typecheck PASS

## 🔗 관련
- phase-24 회고 §A5
