# Implementation Plan: spec-06-01 — NestJS 인증 어댑터

## 📋 Branch Strategy

- 신규 브랜치: `spec-06-01-auth-nestjs`
- 시작 지점: `phase-06-auth-integration`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **role 추출 방식**: `verifyAccessToken` 후 `decodeJwt(token)` 로 `role` custom claim 추출. `JwtClaims` 타입 확장 없음. 서명 검증은 `verifyAccessToken` 이 완료했으므로 `decodeJwt` 의 signature-bypass 는 안전.
> - [ ] **Guard 등록 방식**: `NestjsAuthModule.forRoot()` 가 `AuthGuard` / `RolesGuard` 를 provider 로 노출. 컨트롤러에서 `@UseGuards(AuthGuard, RolesGuard)` 로 개별 적용 (전역 APP_GUARD 등록 아님). 전역 적용은 spec-06-03 시점에 결정.

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
packages/nestjs/auth/
  src/
    auth.guard.ts          ← CanActivate, token 검증 + user 부착
    auth.guard.test.ts
    roles.guard.ts         ← CanActivate, @Roles 메타데이터 검사
    roles.guard.test.ts
    decorators.ts          ← @Roles(), @CurrentUser()
    module.ts              ← NestjsAuthModule.forRoot(opts)
    index.ts               ← 모든 public export
  package.json
  tsconfig.json
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **role 추출** | `verifyAccessToken` + `decodeJwt` 조합 | JwtClaims 에 role 없음; auth-jwt API 변경 없이 custom claim 접근 |
| **Guard 범위** | 개별 `@UseGuards` (전역 아님) | 전역 등록 시 public endpoint 모두 차단 — opt-in 방식이 안전 |
| **인증 정보 전달** | `request.user: AuthenticatedUser` | NestJS 관례; `@CurrentUser()` 데코레이터가 이를 추출 |
| **DI token** | `NESTJS_AUTH_OPTIONS` Symbol | forRoot() → provider 로 options 주입 |
| **테스트** | `createFakeKeyStore` + real JWT sign | mock 없이 실제 서명 검증 → 통합도 높음 |

### 📑 ADR 후보

- [x] `nestjs-auth-guard-role-extraction` (type: decision) — 본 spec 머지 시 `docs/decisions/ADR-0017-nestjs-auth-guard-role-extraction.md` 작성.

## 📂 Proposed Changes

### 신규 패키지: `packages/nestjs/auth/`

#### [NEW] `packages/nestjs/auth/package.json`
`@repo/nestjs-auth` — NestJS adapter. `@nestjs/common`, `@nestjs/core`, `@repo/backend-auth-jwt`, `@repo/auth-contracts` 의존.

#### [NEW] `packages/nestjs/auth/tsconfig.json`
`@repo/typescript-config/base` extend + `experimentalDecorators: true` + `emitDecoratorMetadata: true`.

#### [NEW] `packages/nestjs/auth/src/auth.guard.ts`
```ts
export const NESTJS_AUTH_OPTIONS = Symbol("NESTJS_AUTH_OPTIONS");
export interface NestjsAuthOptions { keyStore: KeyStore; issuer: string; audience: string; }
export type AuthenticatedUser = { sub: string; role: Role };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(NESTJS_AUTH_OPTIONS) private opts: NestjsAuthOptions) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException("missing token");
    const result = await verifyAccessToken(token, opts.keyStore, { issuer, audience });
    if (!result.ok) throw new UnauthorizedException(result.error.message);
    const decoded = decodeJwt(token);
    const roleResult = Role.safeParse(decoded.role);
    if (!roleResult.success) throw new UnauthorizedException("missing role claim");
    req.user = { sub: result.value.sub, role: roleResult.data } satisfies AuthenticatedUser;
    return true;
  }
}
```

#### [NEW] `packages/nestjs/auth/src/auth.guard.test.ts`
케이스:
- 유효 token + role → 통과, `req.user` 설정
- 만료 token → `UnauthorizedException`
- role 없는 token → `UnauthorizedException`

#### [NEW] `packages/nestjs/auth/src/roles.guard.ts`
```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [...]);
    if (!roles || roles.length === 0) return true;
    const user: AuthenticatedUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException("insufficient role");
    return true;
  }
}
```

#### [NEW] `packages/nestjs/auth/src/roles.guard.test.ts`
케이스:
- `@Roles` 없으면 통과
- `user.role` 일치 → 통과
- `user.role` 불일치 → `ForbiddenException`

#### [NEW] `packages/nestjs/auth/src/decorators.ts`
```ts
export const ROLES_KEY = "nestjs_auth:roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user
);
```

#### [NEW] `packages/nestjs/auth/src/module.ts`
```ts
@Module({})
export class NestjsAuthModule {
  static forRoot(opts: NestjsAuthOptions): DynamicModule {
    return {
      module: NestjsAuthModule,
      providers: [
        { provide: NESTJS_AUTH_OPTIONS, useValue: opts },
        AuthGuard,
        RolesGuard,
      ],
      exports: [AuthGuard, RolesGuard, NESTJS_AUTH_OPTIONS],
    };
  }
}
```

#### [NEW] `packages/nestjs/auth/src/index.ts`
모든 public export.

### apps/api 연동

#### [MODIFY] `apps/api/package.json`
`@repo/nestjs-auth: workspace:*` 추가.

#### [MODIFY] `apps/api/src/app.module.ts`
`NestjsAuthModule.forRoot({ keyStore, issuer, audience })` import 추가. `keyStore` 는 `apps/api/src/jwt/jwt.module.ts` 의 `KEY_STORE_TOKEN` provider 를 `exports` 에 추가하여 공유.

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @repo/nestjs-auth exec vitest run
```

### 타입 체크

```bash
pnpm typecheck
```

### 수동 검증

1. apps/api 에 `NestjsAuthModule` import 후 `pnpm typecheck` PASS.
2. `pnpm --filter @apps/api build` 성공 확인 (빌드 오류 없음).

## 🔁 Rollback Plan

- `packages/nestjs/auth/` 신규 패키지이므로 삭제로 완전 롤백.
- apps/api `package.json` / `app.module.ts` 변경 revert.

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
