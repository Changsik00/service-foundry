# spec-20-03: 멤버 목록 검색·필터·커서 페이지네이션

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-20-03` |
| **Phase** | `phase-20` |
| **Branch** | `spec-20-03-member-search-filter-pagination` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-06-13 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

`GET /auth/org/members`는 현재 org의 전체 멤버를 필터 없이 반환한다. `OrgMembersService.list()`는 `WHERE`·`LIMIT`·`ORDER BY` 없이 전체를 조회한다. 프론트엔드 `MemberTable`은 정적 테이블만 렌더링한다.

### 문제점

- 멤버가 많아질수록 전체 로딩이 느려지고 페이지가 무거워진다.
- 특정 멤버를 찾으려면 스크롤로 탐색해야 한다.
- 역할(owner/admin/member)별 조회 수단이 없다.

### 해결 방안

`GET /auth/org/members`에 `search`(이메일/이름 부분 일치)·`role`(필터)·`cursor`+`limit`(커서 페이지네이션) 쿼리 파라미터를 추가한다. 프론트엔드에는 검색 인풋·역할 필터 드롭다운·"더 보기" 버튼을 추가한다. 커서는 `packages/shared/contracts`의 `CursorQuery`·`encodeCursor`·`decodeCursor`를 재사용한다.

## 요구사항

1. `GET /auth/org/members?search=<str>&role=<role>&cursor=<opaque>&limit=<n>` 지원
2. `search`: `email` 또는 `displayName` ILIKE `%search%` — 대소문자 무관 부분 일치
3. `role`: `owner | admin | member` 값으로 exact match 필터. 미제공 시 전체
4. `cursor`+`limit`: 커서 기반 페이지네이션. 커서는 `users.id` 기준 opaque base64 인코딩
5. 기본 정렬: `memberships.createdAt ASC, users.id ASC` (결정론적 정렬 보장)
6. `nextCursor` 없으면 `null` 반환 (마지막 페이지)
7. `displayName`을 `OrgMember` 인터페이스에 추가하고 응답에 포함
8. 프론트엔드: 검색 인풋(debounce 300ms) + 역할 필터 셀렉트 + "더 보기" 버튼 (cursor 있을 때만 노출)
9. 기존 e2e(`org.spec.ts`) 회귀 없음

## Out of Scope

- 서버 사이드 정렬 옵션 (정렬 기준 파라미터)
- 무한 스크롤 자동 로딩 (수동 "더 보기" 버튼으로 한정)
- 멤버 삭제/역할 변경 (별도 spec)
- 전문검색(Full-Text Search) — ILIKE 부분 일치로 충분

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `displayName` 컬럼이 `users` 테이블에 존재하나 NULL 가능 — `displayName`이 NULL인 멤버는 검색에서 email로만 매칭됨 (의도된 동작인지 확인)

> [!WARNING]
> - [ ] 기존 `GET /auth/org/members` 응답 스키마에 `displayName` 필드 추가 → 프론트 타입 변경 수반 (비-breaking 확장)

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **페이지네이션 커서** | `users.id` (UUID) 기반 opaque cursor | 결정론적·삽입에 안전·UUID 정렬 안정 |
| **검색** | Drizzle `ilike` + `or` | ILIKE = DB 레벨 대소문자 무관 부분 일치. FTS 대비 간단하고 충분 |
| **RLS 격리** | `WHERE org_id` 명시 없음 유지 | `app.current_org` RLS가 스코프 — spec-17-08 인변식 유지 |
| **contracts 재사용** | `CursorQuery`, `encodeCursor`, `decodeCursor` from `@repo/contracts` | 이미 spec-13-01에서 정의·검증됨 |
| **프론트 상태** | `useQuery` key에 `{ search, role, cursor }` 포함 | 파라미터 변경 시 자동 리패치 |

## Proposed Changes

#### [MODIFY] `apps/api/src/auth/org-members.service.ts`
- `OrgMember` 인터페이스에 `displayName: string | null` 추가
- `list()` → `list(params: MemberListParams)` 로 시그니처 변경
- `MemberListParams`: `search?: string`, `role?: string`, `cursor?: string`, `limit: number`
- Drizzle 쿼리: `ilike`, `or`, `and`, `gt` 조건 조합, `orderBy`, `limit(limit + 1)` 방식으로 `nextCursor` 결정

#### [MODIFY] `apps/api/src/auth/provider-org.controller.ts`
- `members()` 핸들러에 `@Query()` 파라미터 추가 (`CursorQuery` + `search` + `role`)
- 응답 타입: `{ members: OrgMember[], nextCursor: string | null }`

#### [NEW] `apps/api/src/auth/org-members.service.test.ts`
- `search`, `role`, `cursor`, `limit` 각 파라미터 단위 테스트 (mock DB)

#### [MODIFY] `apps/api/src/auth/org-members.e2e.test.ts` (신규 또는 기존 org e2e 확장)
- `search` 파라미터로 일치·미일치 검증
- `role` 필터 owner/member 각각 검증
- cursor 페이지네이션: 2페이지에 걸쳐 전체 멤버 순회 검증

#### [MODIFY] `apps/web/src/features/orgs/queries.ts`
- `members()` 쿼리 키에 `{ search, role }` 포함
- `MembersSchema` 응답 타입 확장: `displayName`, `nextCursor`

#### [MODIFY] `apps/web/src/features/orgs/MemberTable.tsx`
- 검색 인풋 (debounce 300ms), 역할 셀렉트, "더 보기" 버튼 추가
- `useInfiniteQuery` 또는 수동 cursor 상태 관리

#### [MODIFY] `apps/web/src/features/orgs/MemberTable.test.tsx` (신규)
- 검색 인풋 변경 → API 파라미터 변경 검증
- "더 보기" 버튼 노출 조건 검증

## 검증 계획

```bash
# API 단위
pnpm --filter @apps/api test -- org-members.service

# API e2e
pnpm --filter @apps/api test -- org-members.e2e

# 프론트엔드 단위
pnpm --filter @apps/web test -- MemberTable

# 전체 e2e 회귀
pnpm --filter @apps/web test:e2e
```

수동 검증 시나리오:
1. `/members` 접속 → 검색 인풋에 이메일 일부 입력 → 목록 실시간 필터 확인
2. 역할 드롭다운에서 `owner` 선택 → owner만 표시 확인
3. 멤버 11명 이상인 org에서 limit=10 설정 → "더 보기" 버튼 노출 → 클릭 시 추가 로딩 확인

## ADR 후보

- [ ] 없음 (cursor 방식은 spec-13-01 ADR에서 이미 결정됨)

## ✅ Definition of Done

- [ ] 모든 테스트 PASS (`org-members.service.test`, `org-members.e2e`, `MemberTable.test`)
- [ ] 기존 e2e 18종 회귀 없음
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-20-03-member-search-filter-pagination` 브랜치 push 완료
