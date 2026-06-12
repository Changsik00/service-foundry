# spec-19-05: RBAC 배선 — POST /auth/org/invite admin+ only

## 변경 요약

- **신규 패키지 `@repo/backend-authz`**: 프레임워크 무관 순수 정책 함수 (`canInviteMember`, `canManageOrg`)
- **`@repo/nestjs-auth` 확장**: `OrgRolesGuard`, `@OrgRoles` 데코레이터, `AuthenticatedUser.orgRole` 필드
- **라우트 배선**: `POST /auth/org/invite` — `@UseGuards(AuthGuard, OrgRolesGuard)` + `@OrgRoles("admin", "owner")`
- **e2e 검증**: owner/admin → 200, member → 403 (실 PG + 실 HTTP)

## 변경 파일

### 신규

| 파일 | 설명 |
|---|---|
| `packages/backend/authz/src/policy.ts` | `canInviteMember`, `canManageOrg` 순수 함수 |
| `packages/backend/authz/src/policy.test.ts` | 8개 단위 테스트 |
| `packages/backend/authz/src/index.ts` | 패키지 진입점 |
| `packages/backend/authz/package.json` | `@repo/backend-authz` |
| `packages/nestjs/auth/src/org-roles.guard.ts` | `OrgRolesGuard` + `ORG_ROLES_KEY` |
| `packages/nestjs/auth/src/org-roles.guard.test.ts` | 7개 단위 테스트 |
| `apps/api/src/auth/rbac.e2e.test.ts` | e2e RBAC 3 시나리오 |

### 수정

| 파일 | 변경 내용 |
|---|---|
| `packages/nestjs/auth/src/verifier.ts` | `VerifiedIdentity.orgRole` + `NativeVerifier` 추출 |
| `packages/nestjs/auth/src/auth.guard.ts` | `AuthenticatedUser.orgRole` + `req.user` 세팅 |
| `packages/nestjs/auth/src/decorators.ts` | `@OrgRoles` 데코레이터 추가 |
| `packages/nestjs/auth/src/index.ts` | `OrgRoles`, `OrgRolesGuard`, `ORG_ROLES_KEY` export |
| `packages/nestjs/auth-firebase/src/firebase-verifier.ts` | `orgRole: null` 반환 |
| `packages/nestjs/auth-supabase/src/supabase-verifier.ts` | `orgRole: null` 반환 |
| `apps/api/src/auth/auth.controller.ts` | `OrgRolesGuard` + `@OrgRoles` 배선 |
| `apps/api/src/auth/auth.module.ts` | `OrgRolesGuard` provider 등록 |
| 기존 테스트 다수 | `AuthenticatedUser` mock에 `orgRole: null` 추가 |

## 테스트

```
@repo/backend-authz  :  8 tests passed
@repo/nestjs-auth    : 26 tests passed (+ 7 OrgRolesGuard + 2 orgRole 추출)
@apps/api            : 194 tests passed (+ 3 e2e RBAC)
typecheck            : PASS (전체 workspace)
```

## 동작 원리

1. 사용자 로그인/org-switch 시 `orgRole` 클레임이 JWT에 포함됨 (기존)
2. `AuthGuard`가 토큰 검증 후 `req.user.orgRole` 세팅 (이번 변경)
3. `OrgRolesGuard`가 `@OrgRoles` 메타데이터와 `req.user.orgRole` 비교 (이번 변경)
4. member 또는 orgRole 없는 토큰 → 즉시 `ForbiddenException` (deny-by-default)
