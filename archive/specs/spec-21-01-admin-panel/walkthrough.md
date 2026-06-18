# Walkthrough: spec-21-01 수퍼어드민 패널

## 핵심 결정 사항

### 1. `users.role = "admin"` — 플랫폼 어드민 식별자 유지

`users.role` 의 `@deprecated` 주석은 **org-level 어드민(OrgRole: owner|admin|member)** 으로의 대체를 의미한다. 그러나 플랫폼 수퍼어드민(시스템 전체 관리자)과 org 어드민은 개념이 다르므로, `users.role = "admin"` 은 플랫폼 어드민 식별자로 계속 사용한다. 이를 코드 주석(`admin.controller.ts`)에 명시해 혼란을 방지했다.

### 2. `runWithSystemTenant()` 로 RLS 우회

어드민 API는 모든 조직/유저를 조회해야 한다. 기존 `TenantContextInterceptor` 가 요청마다 `app.current_org` 를 설정해 RLS를 적용하므로, `runWithSystemTenant()` 로 `app.current_org` 를 일시적으로 비워 전체 row를 조회한다. org-invite.service.ts 의 기존 패턴을 재사용했다.

### 3. `AdminModule` 신규 디렉토리

`apps/api/src/admin/` 에 `AdminService`, `AdminController`, `AdminModule` 을 격리했다. auth 모듈과 분리되어 단일 책임 원칙을 지킨다. `AppModule` imports 에 추가해 글로벌 `DATABASE`, `TENANT_ALS` 를 자동으로 주입받는다.

### 4. `@Controller` 레벨 가드 적용

`@UseGuards(AuthGuard, RolesGuard)` + `@Roles("admin")` 을 컨트롤러 클래스에 적용해 모든 admin 라우트에 일괄 적용했다. 라우트별 중복을 제거하고, 새 엔드포인트 추가 시 자동으로 보호된다.

### 5. e2e 테스트 — 실 `RolesGuard` 동작 검증

`AuthGuard` 는 mock 으로 대체하되(JWT 없이 테스트), `RolesGuard` 는 실 구현을 사용해 `role="user"` → 403, `role="admin"` → 200 을 검증했다. NestJS `Reflector` 를 테스팅 모듈에 provider 로 직접 추가해 의존성을 해결했다.

### 6. 프론트엔드 `AdminLayout` — 클라이언트 사이드 가드

`(console)/admin/layout.tsx` 는 `useSession().user.role !== "admin"` 이면 `/` 로 리다이렉트한다. 서버 컴포넌트가 아닌 클라이언트 컴포넌트(`"use client"`)로 작성한 이유: `useSession` 이 클라이언트 훅이기 때문이다. 이 패턴은 기존 `AuthGuard.tsx` 와 대칭을 이룬다.

## 변경 파일 요약

| 파일 | 변경 유형 | 핵심 내용 |
|---|---|---|
| `apps/api/src/admin/admin.service.ts` | NEW | `listOrgs`, `listUsers` — `runWithSystemTenant` 래핑, 커서 페이지네이션 |
| `apps/api/src/admin/admin.controller.ts` | NEW | `GET /admin/orgs`, `GET /admin/users` — `@Roles("admin")` |
| `apps/api/src/admin/admin.module.ts` | NEW | AdminService + AdminController 등록 |
| `apps/api/src/app.module.ts` | MODIFY | AdminModule import 추가 |
| `apps/api/src/admin/admin.service.test.ts` | NEW | 단위 테스트 10개 (listOrgs × 5, listUsers × 5) |
| `apps/api/src/admin/admin.e2e.test.ts` | NEW | 컨트롤러 e2e 7개 (admin 200, user 403, unauth 401) |
| `apps/web/src/features/admin/queries.ts` | NEW | `adminQueries.orgs`, `adminQueries.users` (zod 스키마) |
| `apps/web/src/features/admin/OrgTable.tsx` | NEW | 조직 목록 — 검색 debounce + 더 보기 |
| `apps/web/src/features/admin/UserTable.tsx` | NEW | 유저 목록 — 검색 debounce + 더 보기 |
| `apps/web/src/features/admin/OrgTable.test.tsx` | NEW | 컴포넌트 테스트 5개 |
| `apps/web/src/features/admin/UserTable.test.tsx` | NEW | 컴포넌트 테스트 5개 |
| `apps/web/src/app/(console)/admin/layout.tsx` | NEW | AdminLayout — `user.role !== "admin"` 리다이렉트 |
| `apps/web/src/app/(console)/admin/page.tsx` | NEW | `/admin` → `/admin/orgs` 리다이렉트 |
| `apps/web/src/app/(console)/admin/orgs/page.tsx` | NEW | OrgTable 렌더링 |
| `apps/web/src/app/(console)/admin/users/page.tsx` | NEW | UserTable 렌더링 |

## 주의 사항

- `GET /admin/orgs`, `GET /admin/users` 는 `TenantContextInterceptor` 가 적용된 요청 위에서 동작한다. `runWithSystemTenant()` 는 현재 트랜잭션 안에서 `app.current_org` 를 빈 문자열로 일시 설정해 RLS를 우회한다.
- 어드민 엔드포인트는 `users.role = "admin"` 설정이 필요하다. 현재 UI에서 설정 수단이 없으므로 DB 직접 조작 또는 별도 스크립트로 부여해야 한다.
- 프론트엔드 `/admin` 라우트는 CSR 가드이므로 서버 사이드 렌더링에서는 보호되지 않는다. API 자체가 `@Roles("admin")` 으로 보호되므로 실질적 데이터 유출은 없다.
