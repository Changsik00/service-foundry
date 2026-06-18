# Implementation Plan: spec-18-03

## Branch Strategy

- 신규 브랜치: `spec-18-03-supabase-backend-verifier`
- 시작 지점: `phase-18-auth-authority-mode`
- 첫 task 가 브랜치 생성을 수행함

## 사용자 검토 필요

> [!IMPORTANT]
> - spec-18-02(Firebase)와 동일 구조 — breaking change 없음
> - `jose` catalog 이미 등록됨 (`^6.2.0`) — 신규 catalog 항목 불필요

## 핵심 전략

### 아키텍처 컨텍스트

```
Supabase JWT (HS256)
       │
       ▼
SupabaseVerifier.verify(token)
  ├─ jwtVerify(token, jwtSecretBytes)     ← jose
  ├─ payload.sub → sub
  ├─ payload.role ?? "user" → role
  ├─ payload[ACTIVE_ORG_CLAIM] ??
  │   payload.app_metadata?.[ACTIVE_ORG_CLAIM] → orgId
  └─ if !orgId && provision:
       provision.provisionFromProvider(sub, email)
       (DB에 org 생성 — Supabase에는 setCustomUserClaims 없음)
         │
         ▼
   VerifiedIdentity { sub, role, orgId }
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| JWT 검증 | `jose jwtVerify` HS256 | HTTP 불필요, @supabase/supabase-js 의존 없음 |
| custom claims | DB만 업데이트, 주입 없음 | Supabase에 `setCustomUserClaims` API 없음 |
| 테스트 JWT | `new SignJWT(...).sign(secret)` 직접 생성 | vi.mock('jose') 불필요 — 실제 검증 코드 실행 |
| PROVISION_PORT | `@Optional() SUPABASE_PROVISION_PORT` | spec-18-02 동일 패턴 |

### ADR 후보

- [ ] 없음 — spec-18-02 패턴 재사용

## Proposed Changes

### 신규 패키지: `packages/nestjs/auth-supabase/`

#### [NEW] `packages/nestjs/auth-supabase/package.json`
- `@repo/nestjs-auth-supabase`
- dependencies: `@nestjs/common`, `@nestjs/core`, `@repo/backend-auth-jwt`, `@repo/nestjs-auth`, `jose`, `reflect-metadata`
- devDependencies: `@biomejs/biome`, `@nestjs/testing`, `@repo/biome-config`, `@repo/typescript-config`, `@repo/vitest-config`, `@types/node`, `rxjs`, `typescript`, `vitest`

#### [NEW] `packages/nestjs/auth-supabase/tsconfig.json`
- `{ "extends": "@repo/typescript-config/nestjs" }`

#### [NEW] `packages/nestjs/auth-supabase/vitest.config.ts`
- `export { default } from "@repo/vitest-config/node";`

#### [NEW] `packages/nestjs/auth-supabase/src/supabase-provision-port.ts`
```typescript
export const SUPABASE_PROVISION_PORT = Symbol("SUPABASE_PROVISION_PORT");
export interface SupabaseProvisionPort {
  provisionFromProvider(sub: string, email: string): Promise<{ orgId: string; orgRole: string }>;
}
```

#### [NEW] `packages/nestjs/auth-supabase/src/supabase-verifier.ts`
```typescript
export const SUPABASE_JWT_OPTIONS = Symbol("SUPABASE_JWT_OPTIONS");

export interface SupabaseJwtOptions {
  jwtSecret: string;
}

@Injectable()
export class SupabaseVerifier implements AccessTokenVerifier {
  constructor(
    @Inject(SUPABASE_JWT_OPTIONS) private readonly opts: SupabaseJwtOptions,
    @Optional() @Inject(SUPABASE_PROVISION_PORT) private readonly provision: SupabaseProvisionPort | null,
  ) {}

  async verify(token: string): Promise<VerifiedIdentity> {
    let payload: JWTPayload;
    try {
      const secret = new TextEncoder().encode(this.opts.jwtSecret);
      ({ payload } = await jwtVerify(token, secret));
    } catch {
      throw new UnauthorizedException("invalid supabase token");
    }
    const sub = payload.sub ?? "";
    const email = (payload.email as string | undefined) ?? "";
    const role = (payload.role as string | undefined) ?? "user";
    const appMeta = payload.app_metadata as Record<string, unknown> | undefined;
    let orgId =
      (payload[ACTIVE_ORG_CLAIM] as string | undefined) ??
      (appMeta?.[ACTIVE_ORG_CLAIM] as string | undefined) ??
      null;

    if (!orgId && this.provision) {
      const { orgId: newOrgId } = await this.provision.provisionFromProvider(sub, email);
      orgId = newOrgId;
    }
    return { sub, role, orgId };
  }
}
```

#### [NEW] `packages/nestjs/auth-supabase/src/supabase-auth.module.ts`
```typescript
export interface SupabaseAuthOptions {
  jwtSecret: string;
}

@Module({})
export class NestjsSupabaseAuthModule {
  static forRoot(opts: SupabaseAuthOptions): DynamicModule {
    return {
      module: NestjsSupabaseAuthModule,
      providers: [
        { provide: SUPABASE_JWT_OPTIONS, useValue: opts },
        SupabaseVerifier,
        { provide: ACCESS_TOKEN_VERIFIER, useExisting: SupabaseVerifier },
      ],
      exports: [ACCESS_TOKEN_VERIFIER],
    };
  }
}
```

#### [NEW] `packages/nestjs/auth-supabase/src/supabase-verifier.test.ts`
5개 테스트 (실제 HS256 JWT 생성 — `SignJWT` 사용):
1. 유효 token + activeOrgId 클레임 → VerifiedIdentity 반환
2. 유효 token + app_metadata.activeOrgId → orgId 추출
3. 유효 token + orgId 없음 + provisionPort 없음 → orgId: null
4. 유효 token + orgId 없음 + provisionPort 있음 → provisionFromProvider 호출
5. 무효 token (잘못된 서명) → UnauthorizedException

#### [NEW] `packages/nestjs/auth-supabase/src/index.ts`
public API 전체 export

## 검증 계획

```bash
pnpm --filter @repo/nestjs-auth-supabase test
pnpm --filter @repo/nestjs-auth-supabase typecheck
pnpm --filter @repo/nestjs-auth-supabase lint
pnpm depcruise apps packages --config .dependency-cruiser.cjs
```

## Rollback Plan

- 신규 패키지 → 기존 코드 미변경, 롤백 = 브랜치 삭제

## Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
