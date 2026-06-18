# Walkthrough: spec-19-05 RBAC 배선

## 개요

`POST /auth/org/invite` 엔드포인트에 `OrgRolesGuard`를 배선하여 `owner`/`admin`만 초대를 보낼 수 있도록 HTTP 레이어에서 RBAC를 적용한다.

---

## Task 1: `@repo/backend-authz` — 순수 정책 함수

새 패키지 `packages/backend/authz`를 만들고, 프레임워크 의존 없이 사용할 수 있는 순수 함수 두 가지를 구현했다.

```typescript
// packages/backend/authz/src/policy.ts
export function canInviteMember(orgRole: OrgRole | null): boolean {
  return orgRole === "owner" || orgRole === "admin";
}
export function canManageOrg(orgRole: OrgRole | null): boolean {
  return orgRole === "owner";
}
```

- `@repo/auth-contracts`의 `OrgRole` 타입만 의존 — NestJS/Express 완전 무관
- `owner > admin > member` 위계를 코드로 명시

커밋: `test(spec-19-05)` → `feat(spec-19-05): @repo/backend-authz canInviteMember·canManageOrg`

---

## Task 2: `AuthenticatedUser.orgRole` + `OrgRolesGuard`

### JWT → `req.user` 파이프라인 확장

기존에 JWT에 `orgRole` 클레임이 이미 포함되어 있었으나(`ORG_ROLE_CLAIM`), `VerifiedIdentity` / `AuthenticatedUser`가 이를 추출하지 않고 있었다.

1. **`packages/nestjs/auth/src/verifier.ts`** — `VerifiedIdentity`에 `orgRole: string | null` 추가, `NativeVerifier.verify()`에서 `ORG_ROLE_CLAIM` 클레임 추출
2. **`packages/nestjs/auth/src/auth.guard.ts`** — `AuthenticatedUser.orgRole` 추가, `req.user`에 세팅
3. **`packages/nestjs/auth-firebase/src/firebase-verifier.ts`** · **`supabase-verifier.ts`** — `VerifiedIdentity` 형상 맞추기 (`orgRole: null` 반환)

### `OrgRolesGuard` 신규

```typescript
// packages/nestjs/auth/src/org-roles.guard.ts
@Injectable()
export class OrgRolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [...]);
    if (!roles || roles.length === 0) return true;          // 메타데이터 없으면 통과
    const orgRole = req.user?.orgRole ?? null;
    if (!orgRole || !roles.includes(orgRole as OrgRole))
      throw new ForbiddenException("insufficient org role");
    return true;
  }
}
```

`@OrgRoles("admin", "owner")` 데코레이터와 함께 `SetMetadata` 패턴 사용. 기존 `@Roles`/`RolesGuard`와 동일한 구조.

커밋: `test(spec-19-05)` → `feat(spec-19-05): OrgRolesGuard + @OrgRoles + AuthenticatedUser.orgRole`

---

## Task 3: 라우트 배선 + e2e

### e2e 시나리오 (실 PG, 실 HTTP)

`apps/api/src/auth/rbac.e2e.test.ts` — 실제 PostgreSQL 및 HTTP 스택을 통해 검증:

| 케이스 | 예상 결과 |
|---|---|
| owner 토큰으로 `POST /auth/org/invite` | 200 |
| member 토큰으로 동일 엔드포인트 | 403 |
| admin 토큰으로 동일 엔드포인트 | 200 |

member / admin 토큰 발급 흐름: 계정 생성 → DB 직접 `memberships` INSERT → `/auth/org/switch`로 `orgRole` 클레임 포함 토큰 발급.

### 가드 배선

```typescript
// apps/api/src/auth/auth.controller.ts
@Post("org/invite")
@UseGuards(AuthGuard, OrgRolesGuard)  // AuthGuard 먼저 → req.user 세팅 후 OrgRolesGuard 평가
@OrgRoles("admin", "owner")
@HttpCode(200)
async orgInvite(...) { ... }
```

`OrgRolesGuard`는 `auth.module.ts` providers에도 추가.

커밋: `test(spec-19-05): rbac e2e` → `feat(spec-19-05): POST /auth/org/invite OrgRolesGuard 배선 (admin+ only)`

---

## 설계 결정

**서비스 레이어 중복 검사 유지**: `OrgInviteService.invite()`에는 이미 DB 기반 역할 검사가 있다. `OrgRolesGuard`는 HTTP 레이어의 fail-fast 방어선으로 추가된 것이며 서비스 레이어 검사를 대체하지 않는다.

**`null` 처리**: `orgRole`이 null인 경우(컨텍스트 없는 토큰, Firebase/Supabase 어댑터 등) 항상 403. 명시적 허가가 없으면 차단하는 deny-by-default 원칙.
