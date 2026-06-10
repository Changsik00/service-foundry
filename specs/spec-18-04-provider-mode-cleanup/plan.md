# Implementation Plan: spec-18-04

## Branch Strategy

- 신규 브랜치: `spec-18-04-provider-mode-cleanup`
- 시작 지점: `phase-18-auth-authority-mode`
- 첫 task 가 브랜치 생성을 수행함

## 사용자 검토 필요

> [!IMPORTANT]
> - `provider_uid TEXT UNIQUE` 컬럼 추가 — nullable, 기존 native 유저(NULL) 영향 없음
> - `FirebaseProvisionPort` 인터페이스 변경 (반환값에 `internalUserId` 추가) — 패키지 이미 머지됨, apps/api 구현 시점에 맞게 업데이트
> - `AUTH_MODE=native` 기본값 — 기존 동작 불변

> [!WARNING]
> - `FIREBASE_SERVICE_ACCOUNT` env 미설정 시 firebase 모드 기동 실패 (의도된 동작)

## 핵심 전략

### 아키텍처

```
AUTH_MODE=native   → AppModule imports NestjsAuthModule.forRootAsync() + AuthModule
AUTH_MODE=firebase → AppModule imports NestjsFirebaseAuthModule.forRoot() + ProviderAuthModule
AUTH_MODE=supabase → AppModule imports NestjsSupabaseAuthModule.forRoot() + ProviderAuthModule

AuthModule         = AuthGuard + NativeVerifier + 전체 컨트롤러 (login, oauth, mfa, passkey)
ProviderAuthModule = AuthGuard + ProvisionService + FirebaseProvisionPort|SupabaseProvisionPort 바인딩만
```

### FirebaseVerifier sub 교체 흐름

```
Firebase ID token
  → FirebaseVerifier.verify(token)
      → verifyIdToken(token) → uid="firebase-uid-xyz"
      → orgId = decoded[ACTIVE_ORG_CLAIM] (또는 null)
      → if !orgId && provision:
           { orgId, internalUserId } = provision.provisionFromProvider("firebase-uid-xyz", email)
           sub = internalUserId   ← Firebase UID → internal UUID 교체
      → return { sub: internalUserId|uid, role, orgId }
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **Firebase sub** | `internalUserId` 반환 → `sub` 교체 | 하위 시스템이 UUID sub 기대 |
| **Supabase sub** | sub 그대로 (UUID) | Supabase UID = UUID, 직접 `users.id`로 upsert |
| **native 컨트롤러 비활성화** | `ProviderAuthModule`(컨트롤러 없음) 조건부 import | 컨트롤러 등록 skip이 런타임 분기보다 명확 |
| **migration** | 수동 SQL 작성 (drizzle-kit generate 없이) | DB 미실행 환경에서 generate 불가 |

### ADR 후보

- [ ] 없음

## Proposed Changes

### 1. `packages/nestjs/auth-firebase/src/firebase-provision-port.ts`

#### [MODIFY] FirebaseProvisionPort 반환 타입 업데이트
```typescript
export interface FirebaseProvisionPort {
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string; internalUserId: string }>;
}
```

### 2. `packages/nestjs/auth-firebase/src/firebase-verifier.ts`

#### [MODIFY] `internalUserId`를 `sub`로 사용
```typescript
const { orgId: newOrgId, orgRole, internalUserId } = await this.provision.provisionFromProvider(uid, email);
orgId = newOrgId;
return { sub: internalUserId, role, orgId };  // ← uid 대신 internalUserId
```

### 3. `apps/api/src/infra/schema/users.ts`

#### [MODIFY] `provider_uid` 컬럼 추가
```typescript
providerUid: text("provider_uid").unique(),
```

### 4. `apps/api/drizzle/0015_provider_uid.sql` (NEW)
```sql
ALTER TABLE "users" ADD COLUMN "provider_uid" text;
CREATE UNIQUE INDEX "users_provider_uid_unique" ON "users"("provider_uid");
```

### 5. `apps/api/src/settings.ts`

#### [MODIFY] AUTH_MODE + provider env 추가
```typescript
AUTH_MODE: z.enum(["native", "firebase", "supabase"]).default("native"),
FIREBASE_SERVICE_ACCOUNT: z.string().optional(),   // JSON string 또는 파일 경로
FIREBASE_PROJECT_ID: z.string().optional(),
SUPABASE_JWT_SECRET: z.string().optional(),
```

### 6. `apps/api/src/provision/provision.service.ts`

#### [MODIFY] `provisionFromProvider` 구현
```typescript
// Firebase 모드용: provider_uid로 upsert
async provisionFromProvider(
  uid: string,
  email: string,
): Promise<{ orgId: string; orgRole: string; internalUserId: string }> {
  return this.database.db.transaction(async (tx) => {
    // 1. provider_uid로 기존 유저 조회
    let user = await tx.select().from(users).where(eq(users.providerUid, uid)).limit(1).then(r => r[0]);
    
    // 2. 없으면 신규 생성
    if (!user) {
      const [created] = await tx.insert(users).values({
        email,
        providerUid: uid,
      }).returning();
      user = created!;
    }
    
    // 3. org 없으면 프로비저닝
    if (!user.orgId) {
      const { orgId, orgRole } = await this.provisionUser(user.id, email);
      return { orgId, orgRole, internalUserId: user.id };
    }
    
    return { orgId: user.orgId, orgRole: "owner", internalUserId: user.id };
  });
}
```

### 7. `apps/api/src/auth/provider-auth.module.ts` (NEW)

provider 모드 전용 모듈 — native 컨트롤러 없음, ProvisionService + port binding만.

### 8. `apps/api/src/app.module.ts`

#### [MODIFY] AUTH_MODE 조건부 import
```typescript
const authImports = settings.AUTH_MODE === "firebase"
  ? [NestjsFirebaseAuthModule.forRoot({ serviceAccount: settings.FIREBASE_SERVICE_ACCOUNT!, projectId: settings.FIREBASE_PROJECT_ID })]
  : settings.AUTH_MODE === "supabase"
  ? [NestjsSupabaseAuthModule.forRoot({ jwtSecret: settings.SUPABASE_JWT_SECRET! })]
  : [NestjsAuthModule.forRootAsync(...)]; // native

const nativeAuthImport = settings.AUTH_MODE === "native" ? [AuthModule] : [ProviderAuthModule];
```

## 검증 계획

```bash
pnpm --filter @apps/api test -- --reporter=verbose provision.service.test
pnpm --filter @apps/api typecheck
pnpm turbo run typecheck
pnpm depcruise apps packages --config .dependency-cruiser.cjs
```

## Rollback Plan

- `provider_uid` 컬럼: `ALTER TABLE users DROP COLUMN provider_uid` — 기존 데이터 영향 없음 (nullable)
- 코드 변경: 브랜치 삭제로 롤백

## Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
