# Walkthrough: spec-x-list-query-bounds

> phase-24 phase-FF A5(유일 실 잔여) — 무제한 목록 쿼리에 상한.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 보강 방식 | 커서 페이지네이션 / 단순 cap | **단순 cap (LIMIT 상수)** | 두 목록은 자연히 소수(플래그·1인 소속 org). 커서는 과함 |
| 상한 값 | — | flags 500 / org 100 | 운영상 충분 + 병리적 증가 차단 |

## 🧪 검증 결과

- 단위: feature-flag.service / org-list.service — `.limit(상수>0)` 호출 단언(TDD Red→Green). 체인 mock 갱신.
- 전체 게이트(fresh 5434 DB): `turbo run lint typecheck test` **151/151**, 회귀 0.

## 🔧 변경

- `feature-flag.service.ts`: `.limit(FEATURE_FLAG_LIST_MAX=500)` + 기존 createdAt asc 정렬 유지.
- `org-list.service.ts`: `.orderBy(asc(memberships.createdAt))` + `.limit(ORG_LIST_MAX=100)` (결정적 정렬 동반).

## 🚧 이월

- phase-24 회고 잔여(E3/E4·route-inventory Wd·auto 거버넌스·패키지 문서)는 queue Icebox 유지.
