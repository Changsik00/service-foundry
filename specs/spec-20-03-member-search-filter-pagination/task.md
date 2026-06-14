# Task List: spec-20-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 브랜치 생성 + API 서비스 TDD

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-20-03-member-search-filter-pagination` (base: `phase-20-data-ux`)

### 1-2. 테스트 작성 (TDD Red)

대상 파일: `apps/api/src/auth/org-members.service.test.ts` (신규)

테스트 케이스:
- [ ] `search` 파라미터 없을 때 전체 멤버 반환
- [ ] `search="alice"` → email ILIKE `%alice%` 매칭 행만 반환
- [ ] `search="alice"` → displayName ILIKE `%alice%` 매칭도 포함 (OR 조건)
- [ ] `role="owner"` 필터 → owner만 반환
- [ ] `role="member"` 필터 → member만 반환
- [ ] `cursor` + `limit=2` → `nextCursor` 있음 (더 많을 때)
- [ ] 마지막 페이지 → `nextCursor: null`
- [ ] 기존 `org-members.email.test.ts` 회귀 없음 (`list()` → `list({})` 기본값 대응)
- [ ] 테스트 실행 → Fail 확인: `pnpm --filter @apps/api test -- org-members.service`
- [ ] Commit: `test(spec-20-03): add failing tests for OrgMembersService search/filter/cursor`

### 1-3. 구현 (TDD Green)

대상 파일: `apps/api/src/auth/org-members.service.ts`

구현 내용:
- [ ] `OrgMember` 인터페이스에 `displayName: string | null` 추가
- [ ] `MemberListParams` 타입 정의: `{ search?: string; role?: string; cursor?: string; limit?: number }`
- [ ] `list()` → `list(params: MemberListParams = {})` 시그니처 변경 (기본값으로 하위 호환)
- [ ] Drizzle 쿼리 변경:
  - `orderBy(asc(memberships.createdAt), asc(users.id))`
  - `search` 있으면: `ilike(users.email, '%search%') OR ilike(users.displayName, '%search%')`
  - `role` 있으면: `eq(memberships.role, role)`
  - `cursor` 있으면: `decodeCursor` → `gt(users.id, decoded.userId)`
  - `limit(params.limit ?? 20 + 1)` 패턴으로 `nextCursor` 결정
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-20-03): implement OrgMembersService search/filter/cursor pagination`

---

## Task 2: 컨트롤러 쿼리 파라미터 연결

### 2-1. 테스트 작성 (TDD Red)

대상 파일: `apps/api/src/auth/org-members.e2e.test.ts` (신규)

> 기존 `tenant-isolation.http.e2e.test.ts` 와 분리하여 신규 파일에 작성.

테스트 케이스:
- [ ] `GET /auth/org/members` (파라미터 없음) → 응답에 `members` + `nextCursor` 필드 포함
- [ ] `GET /auth/org/members?search=<email일부>` → 해당 멤버만 반환
- [ ] `GET /auth/org/members?role=owner` → owner만 반환
- [ ] `GET /auth/org/members?limit=1` → `nextCursor` 있음 (멤버 ≥ 2명인 경우)
- [ ] 테스트 실행 → Fail 확인: `pnpm --filter @apps/api test -- org-members.e2e`
- [ ] Commit: `test(spec-20-03): add failing e2e for GET /auth/org/members query params`

### 2-2. 구현 (TDD Green)

대상 파일: `apps/api/src/auth/provider-org.controller.ts`

구현 내용:
- [ ] `@Query()` 파라미터 추가: `search?: string`, `role?: string`, `cursor?: string`, `limit?: number`
- [ ] `CursorQuery` (from `@repo/contracts`) zod parse + `search`, `role` 추가
- [ ] `members()` 응답 타입: `{ members: OrgMember[]; nextCursor: string | null }`
- [ ] `this.orgMembers.list({ search, role, cursor, limit })` 호출로 변경
- [ ] 기존 `tenant-isolation.http.e2e.test.ts` 회귀 없음 확인 (응답에 `nextCursor` 추가는 비-breaking)
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-20-03): wire query params to GET /auth/org/members controller`

---

## Task 3: 프론트엔드 — queries + MemberTable

### 3-1. queries.ts 수정

대상 파일: `apps/web/src/features/orgs/queries.ts`

변경 내용:
- [ ] `MembersSchema` 수정: `members` 배열 항목에 `displayName: z.string().nullable()` 추가, `nextCursor: z.string().nullable()` 추가
- [ ] `members()` → `members(params: MemberQueryParams = {})` 로 변경
  - `MemberQueryParams`: `{ search?: string; role?: string; cursor?: string }`
  - `queryKey: ["orgs", "members", params]` 로 파라미터 포함
  - `queryFn`에서 `httpClient.get`의 쿼리 파라미터로 `params` 전달
- [ ] Commit: `feat(spec-20-03): extend orgQueries.members with search/role/cursor params`

### 3-2. MemberTable.tsx 수정

대상 파일: `apps/web/src/features/orgs/MemberTable.tsx`

변경 내용:
- [ ] `search` 상태 (debounce 300ms), `role` 상태, `cursor` 상태 추가
- [ ] `useQuery(orgQueries.members({ search: debouncedSearch, role, cursor }))` 로 변경
- [ ] 검색 인풋 (`<input type="text" placeholder="이메일로 검색">`) 추가
- [ ] 역할 셀렉트 (`<select>`: all/owner/admin/member) 추가
- [ ] 테이블 위 검색/필터 컨트롤 영역 배치
- [ ] "더 보기" 버튼: `nextCursor` 있을 때만 노출, 클릭 시 `cursor` 상태 갱신 → 추가 데이터 로드
- [ ] Commit: `feat(spec-20-03): add search/filter/load-more to MemberTable`

### 3-3. MemberTable 컴포넌트 테스트 (신규)

대상 파일: `apps/web/src/features/orgs/MemberTable.test.tsx` (신규)

테스트 케이스:
- [ ] 검색 인풋 입력 → `orgQueries.members` 호출 시 `search` 파라미터 포함 확인
- [ ] 역할 셀렉트 변경 → `role` 파라미터 변경 확인
- [ ] `nextCursor` 있을 때 "더 보기" 버튼 노출 확인
- [ ] `nextCursor: null` 일 때 "더 보기" 버튼 미노출 확인
- [ ] Commit: `test(spec-20-03): MemberTable search/filter/load-more tests`

---

## Task 4: Ship

### 🚦 Pre-Push Quality Gate

- [ ] **API 단위 테스트**: `pnpm --filter @apps/api test -- org-members` → PASS
- [ ] **API e2e**: `pnpm --filter @apps/api test -- org-members.e2e` → PASS
- [ ] **프론트엔드 단위**: `pnpm --filter @apps/web test -- MemberTable` → PASS
- [ ] **전체 e2e 회귀**: `pnpm --filter @apps/web test:e2e` → PASS (18종 포함)
- [ ] **TypeScript 타입 검사**: `pnpm turbo typecheck` → 오류 없음
- [ ] **Lint**: `pnpm turbo lint` → 오류 없음

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**: 구현 의도·결정·주의 사항
- [ ] **pr_description.md 작성**: 리뷰어 관점 설명
- [ ] Commit: `docs(spec-20-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-20-03-member-search-filter-pagination`
- [ ] PR 생성: `gh pr create --base phase-20-data-ux`
