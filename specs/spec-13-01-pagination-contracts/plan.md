# Implementation Plan: spec-13-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-13-01-pagination-contracts` (from `phase-13-api-data`)
- base 모드: PR target = `phase-13-api-data` (첫 spec — ship 시 base JIT)

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] 기존 offset `paginatedResponse` 비파괴 — cursor 계약 **추가**만.
> - [ ] cursor 는 opaque base64(JSON) — 클라이언트 비파싱.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| query 스키마 | `PaginationQuery`(offset) + `CursorQuery` | 목록 API 입력 검증 표준 |
| cursor 코덱 | base64(JSON), decode 실패 null | opaque + 견고 |
| envelope | `cursorPaginatedResponse(item)` → items/nextCursor | 무한스크롤 |
| 테스트 | round-trip + 스키마 경계 (단위) | 순수 계약 |

## 📂 Proposed Changes

### @repo/contracts
- [MODIFY] `src/pagination.ts` — `PaginationQuery`, `CursorQuery`, `encodeCursor`, `decodeCursor`, `cursorPaginatedResponse` 추가 (기존 `paginatedResponse` 유지)
- [MODIFY] `src/pagination.test.ts` — cursor 코덱/스키마 테스트 추가 (기존 offset 테스트 유지)

## 🧪 검증 계획

### 단위
```bash
pnpm --filter @repo/contracts test
```
encodeCursor→decodeCursor round-trip, decode 실패 null, PaginationQuery/CursorQuery 기본값·경계, cursorPaginatedResponse 구조 + 기존 offset 유지.

### 정적
```bash
pnpm --filter @repo/contracts typecheck
```

## 🔁 Rollback
- pagination.ts 추가 함수/스키마만. 제거로 롤백. 기존 offset 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
