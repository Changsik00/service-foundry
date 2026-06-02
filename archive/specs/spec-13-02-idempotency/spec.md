# spec-13-02: 멱등성 헬퍼 (`@repo/backend-idempotency`)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-13-02` |
| **Phase** | `phase-13` |
| **Branch** | `spec-13-02-idempotency` |
| **타입** | Feature |
| **Integration Test Required** | no (in-memory cache 단위로 충분) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
동일 요청(네트워크 재시도/더블클릭)이 부수효과를 두 번 일으킬 수 있다. 멱등성 보장 수단이 없다.

### 문제점
- 결제·생성 등 mutating 요청의 중복 처리 위험.

### 해결 방안 (요약)
`@repo/backend-idempotency`(core) 에 **`withIdempotency(cache, key, ttlSeconds, fn)`** 헬퍼를 제공 — Idempotency-Key 별로 **첫 실행 결과를 캐시에 저장하고, 재요청 시 핸들러를 다시 실행하지 않고 저장된 결과를 재생**한다. 저장소는 `@repo/backend-cache`(12-03) 포트 재사용(redis TTL / 테스트 in-memory).

## 🎯 요구사항

### Functional Requirements
1. `withIdempotency<T>(cache, key, ttlSeconds, fn): Promise<T>` — 캐시 히트 시 저장값 반환(fn 미실행), 미스 시 fn 실행 후 결과 캐시 + 반환.
2. 서로 다른 key 는 독립 실행.
3. 저장소는 `Cache` 포트(@repo/backend-cache) 주입 — redis/in-memory 교체.
4. core (framework-agnostic, ADR-0015).

### Non-Functional Requirements
1. 단위 테스트: 첫 실행/재생/다른 키 — in-memory cache.
2. fn 예외 시 캐시에 저장하지 않음(실패는 재시도 가능).

## 🚫 Out of Scope
- HTTP 인터셉터(Idempotency-Key 헤더 → 응답 직렬화/재생) → 후속(nestjs 어댑터/apps).
- 진행 중 동시 요청 락(in-flight 충돌) → 후속.
- typed client(13-03), object storage(13-04) 등.

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (cache 포트 위 조합)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-13.md` (§성공 기준 2)
- 의존: spec-12-03 (@repo/backend-cache)
- 관련 ADR: ADR-0015

## ✅ Definition of Done
- [ ] `withIdempotency` 단위 테스트 PASS (실행/재생/다른키/예외 미저장)
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-13-api-data`)
- [ ] 사용자 알림
