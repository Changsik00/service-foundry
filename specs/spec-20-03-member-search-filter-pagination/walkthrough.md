# Walkthrough: spec-20-03 멤버 목록 검색·필터·커서 페이지네이션

## 핵심 결정 사항

### 1. `@repo/contracts` 의존성 추가

`encodeCursor` / `decodeCursor`를 `@apps/api`에서 직접 사용하기 위해 `@apps/api/package.json`에 `@repo/contracts: workspace:*`를 추가했다. 이 패키지는 `@apps/web`에는 이미 간접 의존하고 있었다.

### 2. Drizzle `.where(conditions)` 항상 호출

필터 조건이 없을 때도 `and()` + `undefined` 인자로 `.where(conditions)`를 항상 호출한다. Drizzle의 `and(undefined)` = `undefined`이므로 실질적으로 WHERE 절이 추가되지 않는다. 이 방식으로 mock 체인이 일관되어 단위 테스트가 단순해진다.

### 3. `exactOptionalPropertyTypes` 대응

TypeScript `exactOptionalPropertyTypes: true` 환경에서 컨트롤러가 `{ search, role, cursor, limit }` 를 직접 전달하면 타입 에러가 발생한다. spread conditional 패턴 `{ ...(x !== undefined && { x }) }` 으로 해결했다.

### 4. `org-members.email.test.ts` mock 체인 업데이트

기존 테스트는 `innerJoin`을 `mockResolvedValue`(Promise 직반환)로 설정했다. 새 구현이 `.innerJoin().where().orderBy().limit()` 체인을 사용하므로, mock 체인을 일치시켜 업데이트했다.

### 5. 프론트엔드 누적 로딩 전략

`useInfiniteQuery` 대신 수동 `cursor` 상태 + `useQuery`를 사용했다. 이유: `orgQueries.members(params)` 함수가 이미 `queryOptions`를 반환하는 구조이고, `useInfiniteQuery`는 별도 `getNextPageParam` 설정이 필요해 queries.ts를 크게 변경해야 했다. 수동 방식으로도 동일한 UX를 달성할 수 있으므로 YAGNI 원칙에 따라 최소 변경을 선택했다.

### 6. `Select` 컴포넌트 미존재 → 네이티브 `<select>`

`@repo/frontend-ui`에 Select 컴포넌트가 없어 네이티브 `<select>` + Tailwind 스타일링으로 대체했다.

## 변경 파일 요약

| 파일 | 변경 유형 | 핵심 내용 |
|---|---|---|
| `apps/api/src/auth/org-members.service.ts` | MODIFY | `MemberListParams`, `MemberListResult` 타입 추가 + 검색/필터/커서 Drizzle 쿼리 |
| `apps/api/src/auth/provider-org.controller.ts` | MODIFY | `@Query` 파라미터 4개 + spread conditional 전달 |
| `apps/api/src/auth/auth.controller.ts` | MODIFY | 동일 (native 모드 동기화) |
| `apps/api/src/auth/org-members.service.test.ts` | NEW | 8개 단위 테스트 |
| `apps/api/src/auth/org-members.e2e.test.ts` | NEW | 5개 컨트롤러 통합 테스트 |
| `apps/api/src/auth/org-members.email.test.ts` | MODIFY | mock 체인 업데이트 |
| `apps/web/src/features/orgs/queries.ts` | MODIFY | `MembersSchema` + `MemberQueryParams` + URL qs 빌더 |
| `apps/web/src/features/orgs/MemberTable.tsx` | MODIFY | 검색 인풋, 역할 셀렉트, 더 보기 버튼, debounce, 누적 로딩 |
| `apps/web/src/features/orgs/MemberTable.test.tsx` | NEW | 6개 컴포넌트 테스트 |
| `apps/api/package.json` | MODIFY | `@repo/contracts` 의존성 추가 |

## 주의 사항

- `GET /auth/org/members` 응답에 `nextCursor` 필드가 추가되었다 (비-breaking 확장). 기존 클라이언트가 `nextCursor`를 무시하면 동작은 동일하다.
- `OrgMember` 인터페이스에 `displayName: string | null` 추가. 기존 코드가 `displayName`을 참조하지 않으면 영향 없음.
- `auth.controller.ts` (native 모드)도 동일하게 업데이트했으므로 tenant-isolation e2e 회귀 없음.
