# spec-23-03: 잔여 상수 중앙화 + 페이지네이션 타입 dedup

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-03` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-03-constants-and-dedup` |
| **상태** | Planning |
| **타입** | Refactor |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황
phase-23 §11.3 재검증: B(에러 컨벤션)는 B1 throw 대부분이 의도적 부트스트랩 fail-fast 였고 B2는 미테스트 컨트롤러를 건드려 위험 → **23-04 로 이동**. 본 spec 은 **behavior-preserving·저위험** 인 잔여 상수(C4) + 페이지네이션 타입 중복(D5) 만 처리.

### 문제점 (실측 확인)
- **C4a**: 24h 이메일 토큰 TTL 이 3곳 독립 정의 — `email-change.service.ts:13`·`email-verify.service.ts:11`(`TOKEN_TTL_MS`) + `org-invite.service.ts:59`(인라인).
- **C4b**: `packages/shared/contracts/src/pagination.ts` 의 페이지네이션 default(20)·max(100) 매직넘버 3곳.
- **D5**: 커서 페이지네이션 타입 중복 — `org-members.service.ts`(`MemberListParams`/`MemberListResult`) + `admin.service.ts`(`OrgListParams/Result`·`UserListParams/Result`) 가 `{ search?, cursor?, limit? }` + `{ items[], nextCursor }` 모양 반복.

### 해결 방안
공유 상수(`EMAIL_TOKEN_TTL_MS`)·페이지네이션 상수, 그리고 `@repo/contracts` 의 `CursorPaginationParams`/`CursorPaginationResult<T>` 로 통일. **동작 변경 없음** — typecheck + 기존 테스트로 가드.

## 요구사항

1. C4a: `EMAIL_TOKEN_TTL_MS` 공유 상수 신설 → 3곳이 참조 (값 24h 불변).
2. C4b: `PAGINATION_DEFAULT_LIMIT`(20)/`PAGINATION_MAX_LIMIT`(100) 상수화 (pagination.ts 내).
3. D5: `@repo/contracts` 에 `CursorPaginationParams`/`CursorPaginationResult<T>` export → org-members·admin 서비스 타입을 이로 재정의(필드 동일).

## Out of Scope

- **B (에러/검증 컨벤션)** → 23-04 (컨트롤러 안전망 선행 필요).
- **D2(verifier dedup)** — 미테스트 nestjs verifier, 위험 → 별도.
- **D3/D4/D6(adapter/forRoot/guard 팩토리)** — 별도 dedup spec 후보.
- **F(복잡도/분할)** → 23-05.

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] behavior-preserving 정리 — §11.3 재구성(B→23-04)에 따른 저위험 항목만.

## 핵심 전략

| 항목 | 위치 | 검증 |
|:---:|:---|:---|
| C4a EMAIL_TOKEN_TTL_MS | apps/api/src/auth 공유 모듈 | 값 동일 + typecheck |
| C4b 페이지네이션 상수 | `@repo/contracts/pagination.ts` | typecheck + 기존 테스트 |
| D5 Cursor 타입 | `@repo/contracts` export | typecheck (순수 타입) |

## Proposed Changes

#### [NEW] `apps/api/src/auth/token-ttl.constants.ts`
`export const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;`

#### [MODIFY] `email-change.service.ts` · `email-verify.service.ts` · `org-invite.service.ts`
로컬 `TOKEN_TTL_MS`/인라인 → `EMAIL_TOKEN_TTL_MS` import.

#### [MODIFY] `packages/shared/contracts/src/pagination.ts`
`PAGINATION_DEFAULT_LIMIT`/`PAGINATION_MAX_LIMIT` 상수 + zod 스키마가 참조.

#### [MODIFY] `packages/shared/contracts/src/index.ts` (+ pagination)
`CursorPaginationParams`/`CursorPaginationResult<T>` export.

#### [MODIFY] `apps/api/src/auth/org-members.service.ts` · `apps/api/src/admin/admin.service.ts`
List 타입을 공유 타입으로 재정의(필드 동일, alias).

## 검증 계획

```bash
pnpm turbo run typecheck --filter=@repo/contracts --filter=./apps/api   # 그린
pnpm vitest run packages/shared/contracts apps/api/src/auth/org-members apps/api/src/admin 2>/dev/null
grep -rn "24 \* 60 \* 60 \* 1000" apps/api/src | grep -v ".test.ts"      # → 0 (상수 치환)
```

수동 검증:
1. 기존 단위 테스트 + typecheck 그린 = 동작 보존.
2. 페이지네이션/이메일 토큰 동작 불변.

## ADR 후보
- [x] 없음 — 상수/타입 중앙화.

## ✅ Definition of Done
- [ ] C4a/C4b/D5 적용 + typecheck/기존 테스트 그린
- [ ] 24h 인라인 리터럴 grep 0
- [ ] walkthrough/pr_description ship + push
