# spec-21-01: 수퍼어드민 패널 — 조직·유저 조회 API + 어드민 UI

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-21-01` |
| **Phase** | `phase-21` |
| **Branch** | `spec-21-01-admin-panel` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-06-14 |
| **소유자** | changsik |

## 배경 및 문제 정의

### 현재 상황

phase-20 완료로 멤버 목록 검색·필터·페이지네이션이 구현됐다. 그러나 플랫폼 운영자가 전체 조직·유저를 관리할 수단이 없다. `users.role = "admin"` 필드(전역 슈퍼어드민 식별자)는 스키마에 존재하지만 이를 이용하는 보호 엔드포인트나 UI가 없다.

### 문제점

- 운영자가 전체 조직·유저 목록을 DB 직접 쿼리 없이 볼 수 없다.
- `RolesGuard` + `@Roles("admin")`은 이미 구현되어 있으나 사용처가 없다.
- 어드민 전용 라우트(`/admin`)가 프론트엔드에 없어 운영 UI가 불가능하다.

### 해결 방안

`AdminModule`을 신규 생성해 `GET /admin/orgs`, `GET /admin/users` 엔드포인트를 제공한다. 각 엔드포인트는 `@Roles("admin")` 가드로 보호하고, `runWithSystemTenant()`로 RLS를 우회해 전체 데이터를 조회한다. 프론트엔드에는 `/admin` 라우트 그룹을 추가해 어드민 전용 조직·유저 목록 화면을 제공한다.

## 요구사항

1. `GET /admin/orgs` — 전체 조직 목록, `search`·`cursor`·`limit` 쿼리 파라미터 지원
2. `GET /admin/users` — 전체 유저 목록, `search`·`cursor`·`limit` 쿼리 파라미터 지원
3. 두 엔드포인트 모두 `@Roles("admin")` + `RolesGuard` 보호 (`users.role = "admin"` 체크)
4. `runWithSystemTenant()`로 RLS 우회 — org 컨텍스트 무관하게 전체 row 반환
5. 커서 기반 페이지네이션 (`encodeCursor` / `decodeCursor` from `@repo/contracts`)
6. 프론트엔드 `/admin` 라우트 그룹: `AdminGuard`(role 체크) + 조직·유저 목록 테이블
7. 조직/유저 목록 각각 검색 인풋 + "더 보기" 버튼 (spec-20-03 MemberTable 패턴 동일)

## Out of Scope

- 조직별 멤버 drill-down (`GET /admin/orgs/:orgId/members`) — 후속 spec 가능
- 어드민이 직접 조직/유저를 편집/삭제하는 기능
- `users.role` 관리 UI (어드민 권한 부여)
- Stripe 빌링 (Icebox)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `users.role` 의 `@deprecated` 주석은 org 어드민(OrgRole)으로의 대체를 의미하나, 플랫폼 수퍼어드민과는 다른 개념이다. 본 spec 에서는 `users.role = "admin"` 을 플랫폼 어드민 식별자로 계속 사용하되, 제거 대상이 아님을 코드 주석으로 명시한다.

> [!WARNING]
> - [ ] 어드민 엔드포인트는 `TenantContextInterceptor` 가 적용된 요청 흐름 위에서 동작한다. `runWithSystemTenant()` 는 현재 트랜잭션의 `app.current_org` 를 일시적으로 비워 RLS를 우회한다. 트랜잭션이 없는 경우(ALS store 없음) 그대로 실행된다 — 이 경우 기본 RLS 정책에 따라 필터링될 수 있으므로 e2e 테스트로 검증 필수.

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **AdminModule** | `apps/api/src/admin/` 신규 디렉토리 + `AppModule` 등록 | auth 모듈과 분리, 단일 책임 |
| **RLS 우회** | `runWithSystemTenant(als, fn)` | 기존 패턴 재사용 (org-invite.service 참조) |
| **가드** | `@UseGuards(AuthGuard, RolesGuard)` + `@Roles("admin")` 컨트롤러 레벨 | 라우트별 중복 제거 |
| **커서 페이지네이션** | `encodeCursor` / `decodeCursor` + `limit+1` 패턴 | spec-20-03 OrgMembersService 동일 패턴 |
| **프론트 가드** | `AdminGuard` 컴포넌트 — `user.role !== "admin"` 이면 `/` 리다이렉트 | AuthGuard 패턴과 대칭 |
| **프론트 레이아웃** | `(console)/admin/layout.tsx` — `AdminGuard` 래핑 | 콘솔 레이아웃 + 어드민 체크 중첩 |

## Proposed Changes

#### [NEW] `apps/api/src/admin/admin.service.ts`

전체 org·user 조회 로직. `DATABASE`(tenant-aware proxy) + `TENANT_ALS` 주입, `runWithSystemTenant()`로 RLS 우회.

```typescript
// AdminOrg, AdminUser 인터페이스 + OrgListParams, OrgListResult, UserListParams, UserListResult
// listOrgs(params): 조직 목록 (search ilike name/slug, cursor, limit)
// listUsers(params): 유저 목록 (search ilike email/displayName, cursor, limit)
```

#### [NEW] `apps/api/src/admin/admin.controller.ts`

```typescript
@Controller("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
export class AdminController {
  @Get("orgs")  // GET /admin/orgs?search=&cursor=&limit=
  @Get("users") // GET /admin/users?search=&cursor=&limit=
}
```

#### [NEW] `apps/api/src/admin/admin.module.ts`

`AdminService` + `AdminController` 등록. `DATABASE`, `TENANT_ALS` 주입 (Global 이므로 imports 불필요).

#### [MODIFY] `apps/api/src/app.module.ts`

`AdminModule` import 추가.

#### [NEW] `apps/api/src/admin/admin.service.test.ts`

단위 테스트 (Drizzle mock 체인):
- `listOrgs()`: 기본 목록, search, cursor, limit+1 nextCursor
- `listUsers()`: 기본 목록, search, cursor, limit+1 nextCursor
- `runWithSystemTenant` mock 검증

#### [NEW] `apps/api/src/admin/admin.e2e.test.ts`

컨트롤러 통합 테스트 (NestJS Testing 모듈, AdminService mock):
- `role="admin"` 유저 → 200 + 목록 반환
- `role="user"` 유저 → 403 Forbidden
- 미인증 → 401

#### [NEW] `apps/web/src/features/admin/queries.ts`

```typescript
// AdminOrgSchema, AdminUserSchema (zod)
// adminQueries.orgs(params), adminQueries.users(params)
```

#### [NEW] `apps/web/src/features/admin/OrgTable.tsx`

조직 목록 테이블 — 검색 인풋 + 더 보기 버튼 (spec-20-03 MemberTable 동일 패턴).

#### [NEW] `apps/web/src/features/admin/UserTable.tsx`

유저 목록 테이블 — 검색 인풋 + 더 보기 버튼.

#### [NEW] `apps/web/src/features/admin/OrgTable.test.tsx`
#### [NEW] `apps/web/src/features/admin/UserTable.test.tsx`

#### [NEW] `apps/web/src/app/(console)/admin/layout.tsx`

`AdminGuard` 래핑 — `user.role !== "admin"` 이면 `/` 로 리다이렉트.

#### [NEW] `apps/web/src/app/(console)/admin/page.tsx`

`/admin/orgs`로 리다이렉트.

#### [NEW] `apps/web/src/app/(console)/admin/orgs/page.tsx`

`OrgTable` 렌더링.

#### [NEW] `apps/web/src/app/(console)/admin/users/page.tsx`

`UserTable` 렌더링.

## 검증 계획

```bash
pnpm --filter @apps/api test -- --testPathPattern="admin"
pnpm --filter @apps/web test -- --testPathPattern="admin"
pnpm turbo typecheck
```

수동 검증 시나리오:
1. `users.role = "admin"` 유저로 `GET /admin/orgs` 호출 — 기대: 전체 조직 목록 반환
2. 일반 유저(`role="user"`)로 동일 요청 — 기대: 403 Forbidden
3. 프론트엔드 `/admin/orgs` 접근 (어드민) — 기대: 조직 테이블 렌더링
4. 프론트엔드 `/admin/orgs` 접근 (일반 유저) — 기대: `/` 리다이렉트

## ADR 후보

- [ ] ADR 가치 있는 결정 있음 → 후보: `superadmin-role-users-role` (type: decision — `users.role="admin"` 을 플랫폼 어드민으로 계속 사용하는 결정, deprecated 주석 무효화)

## ✅ Definition of Done

- [ ] `GET /admin/orgs`, `GET /admin/users` e2e PASS (인가 포함)
- [ ] `role="user"` → 403 확인
- [ ] 프론트엔드 admin 레이아웃 + 목록 페이지 동작
- [ ] 모든 테스트 PASS (`pnpm turbo test`)
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-21-01-admin-panel` 브랜치 push 완료
