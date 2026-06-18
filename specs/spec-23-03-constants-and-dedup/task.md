# Task List: spec-23-03-constants-and-dedup

> One Task = One Commit. behavior-preserving — typecheck + 기존 테스트 그린으로 검증.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-03-constants-and-dedup` (완료)

---

## Task 1: C4a — EMAIL_TOKEN_TTL_MS 공유 상수
- [x] `apps/api/src/auth/token-ttl.constants.ts` 신설 (`EMAIL_TOKEN_TTL_MS = 24h`)
- [x] email-change/email-verify/org-invite 가 import (로컬 TOKEN_TTL_MS·인라인 제거)
- [x] `pnpm turbo run typecheck --filter=./apps/api` 그린 + `grep '24 * 60 * 60 * 1000' apps/api/src` 0
- [x] Commit: `refactor(spec-23-03): centralize email token TTL constant`

---

## Task 2: C4b — 페이지네이션 상수 + D5 Cursor 타입
- [x] `@repo/contracts/pagination.ts`: `PAGINATION_DEFAULT_LIMIT`(20)/`PAGINATION_MAX_LIMIT`(100) 상수
- [x] `@repo/contracts`: `CursorPaginationParams`/`CursorPaginationResult<T>` export
- [x] org-members·admin 서비스 List 타입을 공유 타입으로 재정의(필드 동일)
- [x] `pnpm turbo run typecheck --filter=@repo/contracts --filter=./apps/api` 그린
- [x] Commit: `refactor(spec-23-03): share pagination constants + cursor types`

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `@repo/contracts` + `apps/api` typecheck/lint + 관련 단위 테스트 그린

### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-23-03): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-23-03-constants-and-dedup`
- [x] PR 생성 (base main)
