# spec-13-01: Cursor pagination 계약 보강

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-13-01` |
| **Phase** | `phase-13` |
| **Branch** | `spec-13-01-pagination-contracts` |
| **타입** | Feature |
| **Integration Test Required** | no (단위로 충분 — 순수 계약/코덱) |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`@repo/contracts` 의 `pagination.ts` 는 **offset 응답**(`paginatedResponse`: items/page/perPage/total)만 제공한다. (1) 요청 파라미터 검증 스키마, (2) cursor 기반 pagination(cursor 인코딩/디코딩 + nextCursor envelope)이 없다.

### 문제점
- 목록 API 마다 query 파라미터 검증을 재작성.
- 대용량/무한 스크롤용 cursor pagination 표준 부재. 13-03(typed client)·목록 엔드포인트의 토대 미비.

### 해결 방안 (요약)
`@repo/contracts` pagination 에 **요청 query 스키마**(offset/cursor) + **cursor 코덱**(`encodeCursor`/`decodeCursor`, opaque base64) + **cursor 응답 envelope**(`cursorPaginatedResponse`: items/nextCursor)를 추가한다. 기존 offset 응답은 유지(비파괴).

## 🎯 요구사항

### Functional Requirements
1. `PaginationQuery` — offset query 스키마(`page`≥1 기본 1, `perPage` 1~100 기본 20, coerce).
2. `CursorQuery` — cursor query 스키마(`cursor` 옵셔널 문자열, `limit` 1~100 기본 20).
3. `encodeCursor(value)` / `decodeCursor<T>(s)` — opaque base64(JSON). decode 실패 시 `null`.
4. `cursorPaginatedResponse(itemSchema)` — `{ items: T[], nextCursor: string | null }` zod 스키마.
5. 기존 `paginatedResponse`(offset) 비파괴 유지.

### Non-Functional Requirements
1. 순수(런타임 의존 0 추가). cursor 는 opaque(클라이언트가 내부 파싱 안 함).
2. 단위 테스트로 코덱 round-trip + 스키마 경계 검증.

## 🚫 Out of Scope
- 실제 목록 엔드포인트 적용 → 후속.
- keyset/seek 쿼리 생성기(DB 레벨) → 후속.
- typed client(13-03), idempotency(13-02) 등.

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (기존 contracts 확장 — ADR-0011 layout 준수)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-13.md` (§성공 기준 1, §시나리오 1)
- 관련 ADR: ADR-0011 (contracts package layout)
- 후속: spec-13-03 (typed client — cursor 계약 사용)

## ✅ Definition of Done
- [ ] cursor 코덱 + query/envelope 스키마 단위 테스트 PASS
- [ ] 기존 offset `paginatedResponse` 회귀 없음
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-13-api-data`)
- [ ] 사용자 알림
