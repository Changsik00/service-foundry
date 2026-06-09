# Walkthrough: spec-18-02 — Firebase 백엔드 verifier

## 개요

`@repo/nestjs-auth-firebase` 신규 패키지를 생성했다. `firebase-admin` SDK로 Firebase ID token을 검증하는 `FirebaseVerifier implements AccessTokenVerifier`를 구현하고, `NestjsFirebaseAuthModule.forRoot(opts)`로 NestJS 모듈을 제공한다.

apps/api 배선·DB 스키마 마이그레이션(Firebase UID ↔ internal UUID)은 spec-18-04에서 처리한다.

## 커밋 요약

| # | 커밋 해시 | 내용 |
|---|---|---|
| 1 | 7824c09 | `test(spec-18-02)`: FirebaseVerifier 단위 테스트 + 패키지 스캐폴딩 (Red) |
| 2 | 0c7c6df | `feat(spec-18-02)`: FirebaseVerifier 구현 (Green) |
| 3 | 2b5c2cf | `feat(spec-18-02)`: NestjsFirebaseAuthModule + public API |

## 패키지 구조

```
packages/nestjs/auth-firebase/
├── package.json                    (@repo/nestjs-auth-firebase)
├── tsconfig.json
└── src/
    ├── firebase-provision-port.ts  FIREBASE_PROVISION_PORT + FirebaseProvisionPort 인터페이스
    ├── firebase-verifier.ts        FirebaseVerifier + FIREBASE_ADMIN_APP 심볼
    ├── firebase-verifier.test.ts   단위 테스트 5개 (vi.mock)
    ├── firebase-auth.module.ts     NestjsFirebaseAuthModule.forRoot()
    └── index.ts                    public API
```

## 핵심 구현

### FirebaseVerifier.verify(token)

1. `getAuth(app).verifyIdToken(token)` — 실패 시 `UnauthorizedException`
2. `decoded.uid` → `sub`, `decoded.role ?? "user"` → `role`, `decoded[ACTIVE_ORG_CLAIM]` → `orgId`
3. `orgId === null` + `provision` 주입된 경우:
   - `provision.provisionFromProvider(uid, email)` → `{ orgId, orgRole }`
   - `getAuth(app).setCustomUserClaims(uid, { activeOrgId, org_role })`

### FirebaseProvisionPort (interface)

```typescript
interface FirebaseProvisionPort {
  provisionFromProvider(uid: string, email: string): Promise<{ orgId: string; orgRole: string }>;
}
```

apps/api에서 `ProvisionService`를 확장해 구현 예정 (spec-18-04).

### NestjsFirebaseAuthModule.forRoot(opts)

- `cert(serviceAccount)` → Firebase Admin App 초기화
- `ACCESS_TOKEN_VERIFIER → FirebaseVerifier` provide·export
- `FIREBASE_PROVISION_PORT` optional — 없으면 provisioning skip

## 검증 결과

| 게이트 | 결과 |
|---|---|
| `@repo/nestjs-auth-firebase test` | 5/5 PASS |
| biome lint | PASS |
| typecheck (turbo) | PASS |
| depcruise | 위반 없음 |

## 이후 단계

- **spec-18-03**: `packages/nestjs/auth-supabase` — SupabaseVerifier
- **spec-18-04**: apps/api 배선 + DB 마이그레이션 (Firebase UID → internal UUID, AUTH_MODE 조건부 로딩)
