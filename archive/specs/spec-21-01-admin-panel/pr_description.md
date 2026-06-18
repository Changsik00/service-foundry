# feat(spec-21-01): 수퍼어드민 패널 — 조직·유저 조회 API + 어드민 UI

## 변경 요약

- `GET /admin/orgs`, `GET /admin/users` — `@Roles("admin")` 보호, RLS 우회 전체 목록 조회
- `apps/api/src/admin/` 신규 모듈 — AdminService(runWithSystemTenant), AdminController, AdminModule
- 프론트엔드 `/admin` 라우트 그룹 — AdminLayout(role 체크), 조직/유저 목록 테이블

## API 변경

```
GET /admin/orgs
  ?search=<string>   // name ILIKE %s% OR slug ILIKE %s%
  ?cursor=<opaque>   // base64 cursor
  ?limit=<number>    // 기본 20

응답:
{
  "orgs": [{ id, name, slug, isPersonal, ownerId, createdAt }],
  "nextCursor": "..." | null
}

GET /admin/users
  ?search=<string>   // email ILIKE %s% OR displayName ILIKE %s%
  ?cursor=<opaque>
  ?limit=<number>

응답:
{
  "users": [{ id, email, displayName, role, orgId, createdAt }],
  "nextCursor": "..." | null
}
```

인증: `Bearer` 토큰 필수. `users.role = "admin"` 아닌 경우 → 403 Forbidden.

## 테스트 범위

- `admin.service.test.ts`: listOrgs/listUsers — search/cursor/limit/nextCursor 단위 테스트 (10개)
- `admin.e2e.test.ts`: role=admin→200, role=user→403, 미인증→401 (7개)
- `OrgTable.test.tsx`: 목록 렌더링, 더 보기, search 파라미터 (5개)
- `UserTable.test.tsx`: 동일 패턴 (5개)

## 리뷰 포인트

1. **`users.role = "admin"` 유지**: `@deprecated` 주석은 org 어드민 대체를 의미하나, 플랫폼 수퍼어드민과는 개념이 다르다. 이 필드는 플랫폼 어드민 식별자로 유지한다 (코드 주석 명시).

2. **`runWithSystemTenant` 재사용**: org-invite.service.ts 의 기존 패턴 — 요청 트랜잭션 안에서 `app.current_org` 를 빈 문자열로 일시 설정해 RLS 우회. 트랜잭션 없으면 그대로 실행.

3. **컨트롤러 레벨 가드**: `@Roles("admin")` + `@UseGuards(AuthGuard, RolesGuard)` 를 클래스에 적용해 모든 admin 라우트 일괄 보호.

4. **프론트엔드 CSR 가드**: `(console)/admin/layout.tsx` — `user.role !== "admin"` 이면 `/` 리다이렉트. 실질 데이터 보호는 API 가드에서 담당.
