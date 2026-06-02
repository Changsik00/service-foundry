# Walkthrough: spec-13-01

> Cursor pagination 계약 보강 (`@repo/contracts`).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 범위 | 신규 / 기존 보강 | **보강** | offset `paginatedResponse` 이미 존재 → cursor + query 추가만 |
| cursor 인코딩 | Buffer / btoa | **btoa(encodeURIComponent(JSON))** | shared(브라우저 안전) — Buffer(node) 회피, 유니코드 안전 |
| decode 실패 | throw / null | **null** | opaque cursor, 잘못된 입력에 견고 |

### ADR 승격
- [x] 없음 (ADR-0011 contracts layout 준수)

## 💬 사용자 협의
- phase-13 첫 spec. 재검증서 기존 offset 응답 발견 → cursor 보강으로 스코프 조정.

## 🧪 검증 결과

### 단위
- `@repo/contracts` ✅ 14 passed — 기존 offset(3) + PaginationQuery/CursorQuery 경계 + cursor codec round-trip(유니코드)/decode-null + cursorPaginatedResponse 구조
- typecheck ✅ (shared, DOM lib 로 btoa/atob 타입)

## 🔍 발견 사항
- **재검증 가치**: phase 메모는 "pagination 계약 신규"였으나 offset 응답이 이미 있어, 실제 갭(cursor + query 스키마)만 보강 — 중복 작업 회피.
- shared 패키지의 base64 는 Buffer(node) 대신 btoa/atob(공통) + encodeURIComponent 로 유니코드 안전.

## 🚧 이월 항목
- 실제 목록 엔드포인트에 cursor 적용 → 후속.
- keyset/seek DB 쿼리 생성 → 후속.
- typed client(13-03)이 cursor 계약 사용.

## 🔗 관련
- 관련 phase: `backlog/phase-13.md` (§성공 기준 1, §시나리오 1)
- 관련 ADR: ADR-0011 (contracts layout)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 최종 commit | ship 시 갱신 |
