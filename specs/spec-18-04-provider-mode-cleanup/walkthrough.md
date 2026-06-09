# Walkthrough: spec-18-04 — Provider Mode Cleanup

## 변경 개요

Firebase / Supabase 외부 인증 프로바이더를 `AUTH_MODE` 환경 변수 하나로 전환할 수 있도록 `apps/api`를 배선했다.
native 모드(기본값)는 기존 동작과 완전히 동일하다.

---

## Task 1 — DB 스키마 + TDD Red

### `users.provider_uid TEXT UNIQUE`

Firebase UID는 UUID가 아닌 문자열이다. `users.id`(UUID PK)와 직접 매핑할 수 없으므로
별도 `provider_uid` 컬럼을 추가해 Firebase UID → 내부 UUID 교체 경로를 만들었다.

```sql
-- apps/api/drizzle/0015_provider_uid.sql
ALTER TABLE "users" ADD COLUMN "provider_uid" text;
CREATE UNIQUE INDEX "users_provider_uid_unique" ON "users"("provider_uid");
```

```typescript
// apps/api/src/infra/schema/users.ts
providerUid: text("provider_uid").unique(),
```

### FirebaseProvisionPort 인터페이스 변경

`provisionFromProvider` 반환 타입에 `internalUserId: string` 추가.
`FirebaseVerifier`가 Firebase UID 대신 내부 UUID를 `sub`로 사용하게 됐다.

```typescript
// packages/nestjs/auth-firebase/src/firebase-provision-port.ts
provisionFromProvider(uid, email): Promise<{
  orgId: string;
  orgRole: string;
  internalUserId: string; // NEW — Firebase UID → internal UUID 교체용
}>
```

---

## Task 2 — ProvisionService.provisionFromProvider 구현 (TDD Green)

`ProvisionService`에 `provisionFromProvider` 메서드를 추가했다.

```typescript
async provisionFromProvider(uid, email) → { orgId, orgRole, internalUserId }
```

동작:
1. `provider_uid = uid` 로 기존 유저 조회
2. 없으면 `{ email, providerUid: uid }` 로 신규 생성
3. `orgId` 없으면 personal org 프로비저닝 (provisionUser 내부 로직 인라인)
4. `internalUserId = users.id` (내부 UUID) 반환

`FirebaseVerifier.verify()` 는 이 반환값의 `internalUserId`를 `sub`로 교체한다.

---

## Task 3 — AUTH_MODE 조건부 배선 + ProviderAuthModule

### settings.ts

```typescript
AUTH_MODE: z.enum(["native", "firebase", "supabase"]).default("native"),
FIREBASE_SERVICE_ACCOUNT: z.string().optional(),   // cert 경로 또는 JSON
FIREBASE_PROJECT_ID: z.string().optional(),
SUPABASE_JWT_SECRET: z.string().optional(),        // HS256 서명 검증용
```

모드별 필수 env 가드(환경 무관):
- `AUTH_MODE=firebase` + `FIREBASE_SERVICE_ACCOUNT` 미설정 → 기동 거부
- `AUTH_MODE=supabase` + `SUPABASE_JWT_SECRET` 미설정 → 기동 거부

### ProviderAuthModule

`apps/api/src/auth/provider-auth.module.ts`

```
ProviderAuthModule.forMode("firebase", NestjsFirebaseAuthModule.forRoot(...))
  - global: true  ← FIREBASE_PROVISION_PORT 전역 등록
  - imports: [verifierModule]  ← ACCESS_TOKEN_VERIFIER 확보 → AuthGuard 주입 가능
  - providers: ProvisionService + portProvider + AuthGuard + RolesGuard
```

`global: true` 덕분에 중첩된 verifierModule(NestjsFirebaseAuthModule)의 `FirebaseVerifier`가
`@Optional() @Inject(FIREBASE_PROVISION_PORT)`로 `ProvisionService`를 받을 수 있다.

### AppModule 조건부 배선

```typescript
// AUTH_MODE=native (기본) → 기존 배선 그대로
NestjsAuthModule.forRootAsync(...) + AuthModule

// AUTH_MODE=firebase
ProviderAuthModule.forMode("firebase", NestjsFirebaseAuthModule.forRoot({ serviceAccount }))

// AUTH_MODE=supabase
ProviderAuthModule.forMode("supabase", NestjsSupabaseAuthModule.forRoot({ jwtSecret }))
```

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| `ProviderAuthModule` global | verifierModule(중첩)의 `@Optional()` 주입이 global 스코프에서 해소되어야 함 |
| `internalUserId` 반환 | Firebase UID는 UUID 아님 — 하위 시스템이 UUID sub를 기대하므로 교체 필수 |
| `provider_uid` 별도 컬럼 | `users.id`(UUID PK)를 건드리지 않고 provider → internal 매핑 추가 |
| native 완전 불변 | `AUTH_MODE` 기본값 `native`, 기존 배선 코드 유지 |
