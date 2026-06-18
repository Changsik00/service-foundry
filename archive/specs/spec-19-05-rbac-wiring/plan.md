# Plan: spec-19-05 RBAC 배선

## 📋 Branch Strategy

- 신규 브랜치: `spec-19-05-rbac-wiring`
- 시작 지점: `phase-19-account-authz`

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **orgRole 소스** | JWT 클레임 (`ORG_ROLE_CLAIM`) 신뢰 | token rotation 주기(15분) 내 일관성 보장. DB 실시간 조회는 오버헤드 + 모든 요청에 memberships 쿼리 추가 — 불필요. |
| **AuthenticatedUser 확장** | `orgRole: string \| null` 추가 | nullable → 기존 코드 영향 없음. `OrgRolesGuard` 배선 없는 라우트는 그대로. |
| **OrgRolesGuard 위치** | `packages/nestjs/auth` (기존 RolesGuard 옆) | framework-adapter 컨벤션(ADR-0015). 앱 코드 아님. |
| **authz 패키지** | `packages/backend/authz` 신규 | NestJS 의존 없는 순수 함수 — 프론트/다른 어댑터에서도 재사용 가능. |

### 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → `rbac-jwt-claim-vs-db-lookup` (tradeoff: JWT orgRole 클레임 신뢰 vs DB 실시간 조회)

## 📂 변경 파일

### [NEW] `packages/backend/authz/`

**목적**: org-role 기반 순수 함수 policy helper. 프레임워크 독립.

```
packages/backend/authz/
├── src/
│   ├── policy.ts        # canInviteMember, canManageOrg
│   ├── policy.test.ts
│   └── index.ts
├── package.json         # @repo/backend-authz
├── tsconfig.json
└── vitest.config.ts
```

```typescript
// policy.ts
import type { OrgRole } from "@repo/auth-contracts";

export function canInviteMember(orgRole: OrgRole | null): boolean {
  return orgRole === "owner" || orgRole === "admin";
}
export function canManageOrg(orgRole: OrgRole | null): boolean {
  return orgRole === "owner";
}
```

### [MODIFY] `packages/nestjs/auth/src/verifier.ts`

`VerifiedIdentity`에 `orgRole: string | null` 추가. `NativeVerifier.verify()`에서 `ORG_ROLE_CLAIM` 추출.

### [MODIFY] `packages/nestjs/auth/src/auth.guard.ts`

`AuthenticatedUser`에 `orgRole: string | null` 추가. `req.user` 세팅 시 포함.

### [MODIFY] `packages/nestjs/auth/src/auth.guard.test.ts`

orgRole이 있는 토큰 → `req.user.orgRole` 세팅, 없는 토큰 → null 확인 테스트 추가.

### [NEW] `packages/nestjs/auth/src/org-roles.guard.ts`

```typescript
export const ORG_ROLES_KEY = "nestjs_auth:org_roles";

@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<OrgRole[]>(ORG_ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const { user } = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user?.orgRole || !roles.includes(user.orgRole as OrgRole))
      throw new ForbiddenException("insufficient org role");
    return true;
  }
}
```

### [NEW] `packages/nestjs/auth/src/org-roles.guard.test.ts`

단위 테스트: 메타데이터 없음 → 통과 / role 일치 → 통과 / 불일치 → 403 / orgRole null → 403.

### [MODIFY] `packages/nestjs/auth/src/decorators.ts`

`@OrgRoles` 데코레이터 추가:
```typescript
export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);
```

### [MODIFY] `packages/nestjs/auth/src/index.ts`

`OrgRolesGuard`, `OrgRoles`, `ORG_ROLES_KEY` export 추가.

### [MODIFY] `apps/api/src/auth/auth.controller.ts`

`POST /auth/org/invite`에 추가:
```typescript
@UseGuards(AuthGuard, OrgRolesGuard)
@OrgRoles("admin", "owner")
```

### [MODIFY] `apps/api/src/auth/auth.module.ts`

`OrgRolesGuard` provider 추가.

### [MODIFY] `apps/api/src/auth/auth.controller.test.ts`

`AuthenticatedUser` mock에 `orgRole` 추가.

### [NEW] `apps/api/src/auth/rbac.e2e.test.ts`

e2e 시나리오:
1. member 토큰 → `POST /auth/org/invite` → **403**
2. admin 토큰 → `POST /auth/org/invite` → **200**  
3. owner 토큰 → `POST /auth/org/invite` → **200**

## 🧪 검증 계획

```bash
# 단위 테스트
pnpm --filter @repo/backend-authz exec vitest run
pnpm --filter @repo/nestjs-auth exec vitest run

# e2e
pnpm --filter @apps/api exec vitest run src/auth/rbac.e2e.test.ts

# 전체 typecheck
pnpm turbo run typecheck
```

## 🔁 Rollback Plan

- `OrgRolesGuard` 제거 시 라우트에서 `@UseGuards`, `@OrgRoles` 데코레이터만 제거하면 원복.
- `AuthenticatedUser.orgRole` 추가는 nullable — 기존 코드 영향 없음.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
