# Implementation Plan: spec-17-05

## 📋 Branch Strategy

- 신규 브랜치: `spec-17-05-active-org-token-claims-and-switch`
- 시작 지점: `phase-17`
- **PR 타겟**: `phase-17`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `@repo/nestjs-auth`의 `AuthenticatedUser` 타입에 `orgId: string | null` 추가 — 다른 앱이 이 패키지를 사용 중이라면 영향 없음 (additive, null 기본값).
> - [ ] `ProvisionService.provisionUser()` 리턴 타입이 `void → { orgId, orgRole }` 로 변경 — `SignupService` 및 기존 테스트 동시 수정.
> - [ ] `POST /auth/org/switch`는 refreshToken 재발급 없이 accessToken만 반환. 클라이언트가 새 토큰을 로컬스토리지/쿠키에 직접 저장해야 함.

> [!WARNING]
> - [ ] `withTenantContext` 헬퍼는 Drizzle `db.transaction()` 을 강제로 사용 — 호출 시 기존 트랜잭션과 중첩 불가 (Drizzle limitation). 단독 사용만.
> - [ ] RLS는 여전히 퍼미시브. `withTenantContext` 없이 쿼리해도 현재는 전체 접근 허용.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
packages/nestjs/auth/src/
  auth.guard.ts          ← MODIFY (AuthenticatedUser + orgId 추출)

apps/api/src/
  provision/
    provision.service.ts       ← MODIFY (리턴 void → { orgId, orgRole })
    provision.service.test.ts  ← MODIFY

  auth/
    signup.service.ts          ← MODIFY (provisionUser 결과 → token claims)
    signup.service.test.ts     ← MODIFY
    org-switch.service.ts      ← NEW
    org-switch.service.test.ts ← NEW
    auth.controller.ts         ← MODIFY (POST /auth/org/switch 라우트)
    auth.module.ts             ← MODIFY (OrgSwitchService 등록)

  infra/
    tenant.ts              ← NEW (TenantAls, TENANT_ALS, withTenantContext)
    tenant.interceptor.ts  ← NEW (TenantContextInterceptor)

  app.module.ts          ← MODIFY (APP_INTERCEPTOR 전역 등록)
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| `AuthenticatedUser.orgId` | `string \| null` | 미인증(opt. org) 상태도 null로 표현 — undefined 대신 null이 명시적 |
| org switch refreshToken | 미발급 | 단순화. 클라이언트는 accessToken만 교체. refreshToken은 기존 것 유지 |
| `withTenantContext` | `db.transaction()` + `set_config(..., true)` | SET LOCAL 효과 — 트랜잭션 종료 시 자동 해제, 추가 cleanup 불필요 |
| ALS 전역 인터셉터 | `APP_INTERCEPTOR` | 모든 요청에 자동 적용, 개별 등록 불필요 |

- [x] ADR 없음

## 📂 Proposed Changes

### [MODIFY] `packages/nestjs/auth/src/auth.guard.ts`

```typescript
export type AuthenticatedUser = {
  sub: string;
  role: Role;
  orgId: string | null;
};

// guard canActivate 내부:
const orgId = typeof result.value.orgId === "string" ? result.value.orgId : null;
req.user = { sub: result.value.sub, role: roleResult.data, orgId };
```

### [MODIFY] `apps/api/src/provision/provision.service.ts`

```typescript
export interface IProvisionService {
  provisionUser(userId: string, email: string): Promise<{ orgId: string; orgRole: string }>;
}

// 리턴: return { orgId: org!.id, orgRole: "owner" };
```

### [MODIFY] `apps/api/src/auth/signup.service.ts`

```typescript
const { orgId, orgRole } = await this.provisionService.provisionUser(user.id, email);
const accessToken = await signAccessToken(
  { sub: user.id, role: user.role, activeOrgId: orgId, orgRole },
  ...
);
```

### [NEW] `apps/api/src/auth/org-switch.service.ts`

```typescript
export const ORG_SWITCH_SERVICE = Symbol("ORG_SWITCH_SERVICE");

@Injectable()
export class OrgSwitchService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(JWT_SIGN_OPTIONS) private readonly jwtOpts: JwtSignOptions,
  ) {}

  async switch(userId: string, newOrgId: string): Promise<{ accessToken: string }> {
    const [membership] = await this.database.db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.orgId, newOrgId)));

    if (!membership) throw new ForbiddenException("membership not found");

    const accessToken = await signAccessToken(
      { sub: userId, activeOrgId: newOrgId, orgRole: membership.role },
      this.jwtService.getKeyStore(),
      { issuer: this.jwtOpts.issuer, audience: this.jwtOpts.audience },
    );
    return { accessToken };
  }
}
```

> Note: org switch 토큰에는 global `role` 클레임을 생략 — 멤버십 `orgRole`로 충분. 이후 결정에 따라 추가 가능.

### [MODIFY] `apps/api/src/auth/auth.controller.ts`

```typescript
@Post("org/switch")
@UseGuards(AuthGuard)
@HttpCode(200)
async orgSwitch(
  @Body() body: { orgId: string },
  @CurrentUser() user: AuthenticatedUser,
): Promise<{ accessToken: string }> {
  return this.orgSwitchService.switch(user.sub, body.orgId);
}
```

### [NEW] `apps/api/src/infra/tenant.ts`

```typescript
import { AsyncLocalStorage } from "node:async_hooks";

export const TENANT_ALS = Symbol("TENANT_ALS");

export interface TenantContext {
  orgId: string | null;
}

export type TenantAls = AsyncLocalStorage<TenantContext>;

// withTenantContext — Drizzle 트랜잭션 안에서 SET LOCAL app.current_org 실행
export async function withTenantContext<T>(
  db: NodePgDatabase,
  orgId: string | null,
  fn: (tx: NodePgDatabase) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    if (orgId) {
      await tx.execute(sql`SELECT set_config('app.current_org', ${orgId}, true)`);
    }
    return fn(tx);
  });
}
```

### [NEW] `apps/api/src/infra/tenant.interceptor.ts`

```typescript
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(@Inject(TENANT_ALS) private readonly als: TenantAls) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const orgId = req.user?.orgId ?? null;
    return new Observable((subscriber) => {
      this.als.run({ orgId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
```

### [MODIFY] `apps/api/src/app.module.ts`

```typescript
providers: [
  { provide: TENANT_ALS, useValue: new AsyncLocalStorage() },
  { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
]
```

## 🧪 검증 계획

```bash
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/provision/provision.service.test.ts
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/auth/signup.service.test.ts
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/auth/org-switch.service.test.ts
NODE_OPTIONS='--import tsx/esm' pnpm --filter=@apps/api exec vitest run src/infra/tenant.test.ts

pnpm turbo run typecheck --filter=@apps/api
pnpm turbo run typecheck --filter=@repo/nestjs-auth
```

## 🔁 Rollback Plan

- `AuthenticatedUser`에서 `orgId` 제거 (null → undefined로 롤백)
- `signAccessToken` 호출부에서 `activeOrgId`, `orgRole` 제거
- `OrgSwitchService` / route 제거
- `TenantContextInterceptor` + `TENANT_ALS` provider 제거

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
