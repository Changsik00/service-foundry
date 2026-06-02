# Walkthrough: spec-13-02

> 멱등성 헬퍼 — `@repo/backend-idempotency` (`withIdempotency`, cache-backed).

## 📌 결정 기록
| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 저장소 | 자체 / Cache 포트 | **`@repo/backend-cache` 재사용** | 멱등 키는 단명 → TTL 캐시. 12-03 조합 |
| HTTP 적용 | 인터셉터 포함 / core만 | **core `withIdempotency` 만** | 헤더→직렬화 인터셉터는 후속 |
| fn 예외 | 저장 / 미저장 | **미저장** | 실패 재시도 허용 |

### ADR 승격
- [x] 없음

## 🧪 검증 결과
### 단위
- `@repo/backend-idempotency` ✅ 4 passed — 첫 실행(fn 1회), 재생(fn 미실행), 다른 키 독립, fn 예외 시 미저장 + 재시도

## 🔍 발견 사항
- 멱등성 dedup ≡ cache-aside(get-or-set keyed by idempotency-key) → 12-03 cache 포트 위에 얇게 조합. 향후 HTTP 인터셉터/in-flight 락의 확장점.

## 🚧 이월 항목
- HTTP 인터셉터(Idempotency-Key 헤더 → 응답 재생) → 후속.
- 진행 중 동시요청 락 → 후속.

## 🔗 관련
- 관련 phase: `backlog/phase-13.md` (§성공 기준 2)
- 의존: spec-12-03 (@repo/backend-cache)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
