# phase-13: Service Foundations II · API & Data

> "API & 데이터 ergonomics"(Tier 2). pagination 계약 · idempotency · typed client · object storage · outbox · seeding/migration.
> 보일러플레이트 품질·완성도 트랙 2번째 phase.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-13` |
| **상태** | In Progress |
| **시작일** | 2026-05-31 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | `phase-13-api-data` |

## 🎯 배경 및 목표

### 현재 상황
phase-12 까지 런타임 기반(알림/큐/캐시/shutdown)은 갖췄으나, API·데이터 계층의 반복 패턴이 표준화돼 있지 않다: 목록 응답 형식(pagination), 멱등성, 프론트용 typed client, 파일 저장, 신뢰성 이벤트 발행(outbox), 시드/마이그레이션 정리.

### 목표 (Goal)
거의 모든 API 서비스가 결국 쓰는 데이터/계약 패턴을 core 패키지 + 미들웨어 + 도구로 제공.

### 성공 기준 (Success Criteria) — 정량 우선
1. pagination/cursor 표준 계약(`@repo/contracts` 확장) — 인코딩/디코딩 + 응답 형식, 단위 테스트.
2. idempotency-key 미들웨어 — 동일 키 재요청 시 저장 응답 반환(중복 처리 방지), 테스트.
3. typed client codegen — `@repo/contracts` 로부터 프론트용 타입 클라이언트 생성, round-trip.
4. object storage 포트(S3/R2 호환) + in-memory 어댑터(테스트) — put/get/del.
5. outbox 패턴 — 트랜잭션과 함께 이벤트 적재 + 발행, 신뢰성.
6. DB seeding + 테스트 팩토리 + 마이그레이션 통합 러너.

## 🧩 작업 단위 (SPECs)

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-13-01` | pagination-contracts | P? | Active | `specs/spec-13-01-pagination-contracts/` |
<!-- sdd:specs:end -->

### spec-13-01 — pagination-contracts
- **요점**: cursor/offset pagination 표준 계약(`@repo/contracts`) — 요청 파라미터 + 응답 envelope(items/nextCursor/total) + cursor 인코딩.
- **연관 모듈**: `packages/shared/contracts/`

### spec-13-02 — idempotency
- **요점**: Idempotency-Key 미들웨어 — 키별 응답 저장/재생, 진행 중 충돌 처리.
- **연관 모듈**: `packages/backend/idempotency/` (+ 저장소: cache/db)

### spec-13-03 — typed-client-codegen
- **요점**: `@repo/contracts` → 프론트용 타입 클라이언트 생성(또는 타입 추출). frontend-http-client 결합.
- **연관 모듈**: `tooling/scripts/` 또는 `packages/frontend/http-client`

### spec-13-04 — object-storage
- **요점**: object storage 포트(put/get/del/url) + in-memory 어댑터 + S3/R2 어댑터(인터페이스).
- **연관 모듈**: `packages/backend/storage/`

### spec-13-05 — outbox
- **요점**: transactional outbox — 도메인 이벤트를 같은 트랜잭션에 적재 + 발행기(relay). audit/events 연동.
- **연관 모듈**: `packages/backend/outbox/` + drizzle

### spec-13-06 — seeding-migration
- **요점**: DB seeding + 테스트 팩토리 + 마이그레이션 통합 러너(현재 패키지별 drizzle.config 분산).
- **연관 모듈**: `tooling/scripts/db/` + drizzle

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| idempotency 저장소 | cache(redis) / db | spec-13-02 진입 시 | TTL vs 영속 |
| typed client | codegen / 타입 추출 | spec-13-03 진입 시 | 빌드 복잡도 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: pagination round-trip
- **Given**: spec-13-01 머지.
- **When**: cursor 인코딩→디코딩 + 응답 envelope 검증.
- **Then**: 0 error.
- **연관 SPEC**: spec-13-01

### 시나리오 2: idempotency 재요청
- **Given**: spec-13-02 머지.
- **When**: 동일 Idempotency-Key 로 2회 요청.
- **Then**: 2번째는 저장된 응답 재생(핸들러 1회 실행).
- **연관 SPEC**: spec-13-02

## 🔗 의존성
- **선행 phase**: phase-12 (cache/queue), phase-05~ (contracts/auth).
- **연관 ADR**: ADR-0003, ADR-0011 (contracts layout), ADR-0015.

## 📝 위험 요소 및 완화
| 위험 | 영향 | 완화책 |
|---|---|---|
| typed client codegen 빌드 복잡 | 유지비 | 타입 추출(경량) 우선 검토 |
| outbox relay 신뢰성 | 이벤트 유실 | 트랜잭션 적재 + at-least-once relay |

## 🏁 Phase Done 조건
- [ ] 모든 SPEC 이 `phase-13-api-data` → main merge
- [ ] 통합 시나리오 PASS
- [ ] 성공 기준 측정 결과 기록
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값 -->
