# Walkthrough: spec-25-01

> phase-25 첫 spec — route-inventory Wd 개선 (가드 순서 + DI 안전망). E3/E4 이관 선결.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 가드 순서 | 정렬 유지 / 선언 순서 | **선언 순서**(정렬 제거) | 순서 회귀 탐지(Wd). 현재 선언이 알파벳순이라 스냅샷 불변 |
| DI 검증 | 컨트롤러별 인스턴스화 / 모듈 compile | **AppModule `.compile()`** | 전 그래프 한 번에 resolve, 무-DB(pool lazy)·빠름(9ms) |
| brittle EXPECTED 동적화 | 포함 / 제외 | **제외(Out)** | Wd 핵심(순서+DI)만, 동적화는 과함 |

## 🧪 검증 결과

- route-inventory: guard `.sort()` 제거 → 선언 순서 검증. 기존 스냅샷 불변(현 선언=알파벳순), 이후 reorder 시 실패.
- DI smoke: `Test.createTestingModule({imports:[AppModule]}).compile()` → **무-DB 9ms PASS**. pg Pool lazy 확인 → DB 게이트 불필요.
- 전체 게이트(fresh 5434 DB): `turbo run lint typecheck test` **151/151**, 회귀 0.

## 🔍 발견 사항

- DI compile 이 무-DB 로 동작(pool lazy) → e2e(전체 부팅+DB)보다 훨씬 빠른 DI 회귀 가드 확보. phase-25 E3/E4(도메인 분리·패키지화)에서 "서비스 이동→DI 깨짐"을 즉시 잡는다.
- 가드는 모두 알파벳순으로 선언돼 있어 정렬 제거가 스냅샷을 안 바꿈(순서 정밀화만).

## 🚧 이월

- route-inventory EXPECTED 하드코딩 동적화(brittle 근본) — 필요 시 후속.
