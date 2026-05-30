# feat(spec-13-01): Cursor pagination 계약 보강

## 📋 Summary

### 배경 및 목적
`@repo/contracts` 는 offset 응답(`paginatedResponse`)만 있었다. 본 spec 은 요청 query 스키마 + cursor 기반 pagination(코덱 + envelope)을 보강한다 — 목록 API·typed client(13-03)의 토대.

### 주요 변경
- [x] `PaginationQuery`(offset) / `CursorQuery` 요청 스키마 (coerce + 기본값/상한)
- [x] `encodeCursor`/`decodeCursor` — opaque base64(URI-encoded JSON), 유니코드 안전, decode 실패 null
- [x] `cursorPaginatedResponse(item)` — `{ items, nextCursor }` envelope
- [x] 기존 offset `paginatedResponse` **비파괴 유지**

### Phase 컨텍스트
- **Phase**: `phase-13` (Service Foundations II · API & Data) — 첫 spec
- **역할**: 성공 기준 1(pagination 계약 + cursor 코덱) 충족.

## 🎯 Key Review Points
1. **재검증 스코프 조정**: offset 응답 이미 존재 → cursor + query 보강만 (중복 회피).
2. **shared 브라우저 안전**: Buffer(node) 대신 btoa/atob + encodeURIComponent (유니코드).
3. 비파괴 — 기존 export/테스트 유지.

## 🧪 Verification
```bash
pnpm --filter @repo/contracts test       # 14 passed
pnpm --filter @repo/contracts typecheck   # 0
```

## 📦 Files Changed
- `packages/shared/contracts/src/pagination.ts` (+query/codec/envelope)
- `packages/shared/contracts/src/pagination.test.ts` (+cursor 테스트)

## ✅ Definition of Done
- [x] cursor codec + query/envelope 단위 PASS (14)
- [x] 기존 offset 회귀 없음
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-13.md`
- 후속: spec-13-03 (typed client — cursor 계약 사용)
