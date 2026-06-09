# Implementation Plan: spec-18-02

## 📋 Branch Strategy

- 신규 브랜치: `spec-18-02-firebase-backend-verifier`
- 시작 지점: `phase-18-auth-authority-mode` (base branch)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `firebase-admin`을 pnpm catalog에 추가 (`pnpm-workspace.yaml`) — 패키지 전체에 공유
> - [ ] `packages/nestjs/auth-firebase/`는 `packages/nestjs/auth`에 의존 — depcruise 허용 경로 확인 필요 (동일 계층 내 의존, `nestjs → nestjs` 허용인지)

> [!WARNING]
> - [ ] `FirebaseVerifier.verify()` 내 `provisionFromProvider` 호출 실패 시 `UnauthorizedException` or fallback? — **현재 설계: 예외 버블링 (500 반환)**, 후속에서 개선 가능

## 🎯 핵심 전략

### 아키텍처 컨텍스트

```
[현재 - spec-18-01 이후]
ACCESS_TOKEN_VERIFIER → NativeVerifier (apps/api에서 manual 배선)

[spec-18-02 추가]
packages/nestjs/auth-firebase/
  NestjsFirebaseAuthModule.forRoot(opts)
    → FIREBASE_ADMIN_APP → firebase-admin App
    → ACCESS_TOKEN_VERIFIER → FirebaseVerifier
       ↳ @Inject(FIREBASE_PROVISION_PORT) — optional

apps/api에서 (spec-18-04에서 배선):
  NestjsFirebaseAuthModule.forRoot({ credential, projectId })
  + { provide: FIREBASE_PROVISION_PORT, useExisting: ProvisionService }
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **패키지 위치** | `packages/nestjs/auth-firebase/` | ADR-0015: nestjs/ 계층 |
| **firebase-admin import** | `import { getAuth } from 'firebase-admin/auth'` (subpath) | tree-shaking, 타입 안전 |
| **PROVISION_PORT 주입** | `@Optional() @Inject(FIREBASE_PROVISION_PORT)` | 패키지 독립 사용 가능 |
| **테스트 mock 전략** | `vi.mock('firebase-admin/auth')` + `vi.mock('firebase-admin/app')` | 실 Firebase 없이 단위 테스트 |
| **apps/api 통합** | spec-18-04로 위임 | users.id UUID 제약 + AUTH_MODE 조건부 로딩 연계 |

### 📑 ADR 후보

- [ ] 없음 (ADR-0023에 이미 결정됨)

## 📂 Proposed Changes

### [신규 패키지] `packages/nestjs/auth-firebase/`

#### [NEW] `packages/nestjs/auth-firebase/package.json`

```json
{
  "name": "@repo/nestjs-auth-firebase",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": { "types": "./src/index.ts", "default": "./src/index.ts" } },
  "scripts": { "lint": "biome check .", "typecheck": "tsc --noEmit", "test": "vitest run" },
  "dependencies": {
    "@nestjs/common": "catalog:",
    "@repo/nestjs-auth": "workspace:*",
    "@repo/backend-auth-jwt": "workspace:*",
    "firebase-admin": "catalog:"
  },
  "devDependencies": { ... }
}
```

#### [NEW] `packages/nestjs/auth-firebase/src/firebase-provision-port.ts`

```typescript
export const FIREBASE_PROVISION_PORT = Symbol("FIREBASE_PROVISION_PORT");

export interface FirebaseProvisionPort {
  provisionFromProvider(
    uid: string,
    email: string,
  ): Promise<{ orgId: string; orgRole: string }>;
}
```

#### [NEW] `packages/nestjs/auth-firebase/src/firebase-verifier.ts`

```typescript
@Injectable()
export class FirebaseVerifier implements AccessTokenVerifier {
  constructor(
    @Inject(FIREBASE_ADMIN_APP) private readonly app: App,
    @Optional() @Inject(FIREBASE_PROVISION_PORT)
    private readonly provision: FirebaseProvisionPort | null,
  ) {}

  async verify(token: string): Promise<VerifiedIdentity> {
    let decoded: DecodedIdToken;
    try {
      decoded = await getAuth(this.app).verifyIdToken(token);
    } catch {
      throw new UnauthorizedException("invalid firebase token");
    }
    const { uid, email = '' } = decoded;
    const role = (decoded['role'] as string | undefined) ?? 'user';
    let orgId = (decoded[ACTIVE_ORG_CLAIM] as string | undefined) ?? null;

    if (!orgId && this.provision) {
      const { orgId: newOrgId, orgRole } = await this.provision.provisionFromProvider(uid, email);
      orgId = newOrgId;
      await getAuth(this.app).setCustomUserClaims(uid, {
        [ACTIVE_ORG_CLAIM]: orgId,
        org_role: orgRole,
      });
    }
    return { sub: uid, role, orgId };
  }
}
```

#### [NEW] `packages/nestjs/auth-firebase/src/firebase-auth.module.ts`

```typescript
export interface FirebaseAuthOptions {
  credential: credential.Credential;
  projectId?: string;
}

export const FIREBASE_ADMIN_APP = Symbol("FIREBASE_ADMIN_APP");

@Module({})
export class NestjsFirebaseAuthModule {
  static forRoot(opts: FirebaseAuthOptions): DynamicModule {
    const app = initializeApp({ credential: opts.credential, projectId: opts.projectId });
    return {
      module: NestjsFirebaseAuthModule,
      providers: [
        { provide: FIREBASE_ADMIN_APP, useValue: app },
        FirebaseVerifier,
        { provide: ACCESS_TOKEN_VERIFIER, useExisting: FirebaseVerifier },
      ],
      exports: [ACCESS_TOKEN_VERIFIER, FIREBASE_ADMIN_APP],
    };
  }
}
```

#### [NEW] `packages/nestjs/auth-firebase/src/firebase-verifier.test.ts`

테스트 케이스 (vi.mock 사용):
1. 유효 token + `activeOrgId` claim → `VerifiedIdentity { sub: uid, role, orgId }`
2. 유효 token, `activeOrgId` 없음, provisionPort 없음 → `orgId: null`
3. 유효 token, `activeOrgId` 없음, provisionPort 있음 → `provisionFromProvider` 호출 + `setCustomUserClaims` 호출 + orgId 반환
4. 유효 token, `role` claim 없음 → `role: "user"` 기본값
5. 무효/만료 token (verifyIdToken throw) → `UnauthorizedException`

#### [NEW] `packages/nestjs/auth-firebase/src/index.ts`

public API export.

### [수정] `pnpm-workspace.yaml`

```yaml
catalog:
  firebase-admin: ^12.0.0   # 추가
```

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @repo/nestjs-auth-firebase test
```

### 타입체크

```bash
pnpm --filter @repo/nestjs-auth-firebase typecheck
```

### depcruise

```bash
pnpm depcruise apps packages --config .dependency-cruiser.cjs
```

## 🔁 Rollback Plan

- 신규 패키지만 추가 — `apps/api` 변경 없음 → 롤백은 패키지 디렉토리 삭제 + pnpm catalog 원복

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
