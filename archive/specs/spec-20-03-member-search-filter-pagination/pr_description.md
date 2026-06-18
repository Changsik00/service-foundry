# feat(spec-20-03): 멤버 목록 검색·필터·커서 페이지네이션

## 변경 요약

- `GET /auth/org/members`에 `search`·`role`·`cursor`·`limit` 쿼리 파라미터 추가
- `OrgMember`에 `displayName` 필드 추가, 응답에 `nextCursor` 포함
- 프론트엔드 `MemberTable`에 검색 인풋(debounce 300ms), 역할 필터 셀렉트, "더 보기" 버튼 추가

## API 변경

```
GET /auth/org/members
  ?search=<string>   // email ILIKE %s% OR displayName ILIKE %s%
  ?role=<owner|admin|member>
  ?cursor=<opaque>   // base64 인코딩 cursor
  ?limit=<number>    // 기본 20

응답:
{
  "members": [...],   // OrgMember[] (displayName 필드 추가됨)
  "nextCursor": "..." | null
}
```

## 테스트 범위

- `org-members.service.test.ts`: search/role/cursor/limit 각 파라미터 단위 테스트 (8개)
- `org-members.e2e.test.ts`: 컨트롤러 통합 테스트 — NestJS 모듈 + 모킹 (5개)
- `MemberTable.test.tsx`: 검색 인풋, 역할 필터, 더 보기 버튼 행동 테스트 (6개)

## 리뷰 포인트

1. **`@repo/contracts` 추가**: `@apps/api`에 `encodeCursor`/`decodeCursor` 사용을 위해 의존성 추가. 기존에 `@apps/web`은 이미 사용 중.

2. **`exactOptionalPropertyTypes` 대응**: 컨트롤러에서 `{ ...(x !== undefined && { x }) }` spread 패턴 사용. `?` optional 프로퍼티에 undefined 명시 불가.

3. **native + provider 양쪽 동기화**: `auth.controller.ts`와 `provider-org.controller.ts` 모두 동일하게 업데이트. tenant-isolation e2e 회귀 없음.

4. **비-breaking 확장**: 기존 `{ members: [] }` 응답에 `nextCursor: null` 필드만 추가. 이 필드를 무시하는 기존 클라이언트에게는 영향 없음.
