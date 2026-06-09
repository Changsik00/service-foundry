# Implementation Plan: spec-18-05 — Firebase Custom Token 발행 엔드포인트

## 📋 Branch Strategy

- 신규 브랜치: `spec-18-05-firebase-custom-token`
- 시작 지점: `phase-18-auth-authority-mode` (base branch)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `FirebaseTokenController`를 `AuthModule`에 추가하는 방향 동의 여부
>   (native 모드에서 `AUTH_MODULE`이 사용되므로 적절한 위치)
> - [ ] `FIREBASE_SERVICE_ACCOUNT` 미설정 시 503 응답 방식 동의 여부
>   (대안: 엔드포인트 자체를 조건부 등록하여 404 반환)

## 🎯 핵심 전략

### 아키텍처

```
native 모드 (AUTH_MODE=native):
  AppModule
    ├── AuthModule  (NestjsAuthModule + AuthController + FirebaseTokenController)
    │     ├── NativeVerifier → ACCESS_TOKEN_VERIFIER
    │     ├── FIREBASE_ADMIN_APP (FIREBASE_SERVICE_ACCOUNT 있으면 초기화, 없으면 미등록)
    │     └── FirebaseTokenController
    │           POST /auth/firebase/token
    │           @UseGuards(AuthGuard)  ← native JWT 검증
    │           @Optional() FIREBASE_ADMIN_APP  ← 없으면 503
    └── ...

firebase 모드 (AUTH_MODE=firebase):
  ProviderAuthModule (이미 firebase 주 인증) → 이 endpoint 불필요
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **컨트롤러 위치** | `AuthModule` | native 모드 전용, `AUTH_MODE=native`에서 `AuthModule`이 로드됨 |
| **브리지 미설정 처리** | `@Optional()` 주입 → 503 | 컨트롤러 항상 등록, 런타임에 graceful 응답 |
| **FIREBASE_ADMIN_APP 초기화** | `AuthModule` provider 조건부 등록 | `auth.module.ts`에서 settings 참조 — app.module.ts 변경 불필요 |

### ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [NEW] `apps/api/src/auth/firebase-token.controller.ts`

```typescript
// [브리지 패턴] native Bearer 인증 서버에서 Firebase 클라이언트 SDK 세션이 추가로 필요할 때 사용.
// AUTH_MODE=firebase처럼 Firebase가 이미 주 인증인 환경에서는 이 엔드포인트가 불필요하다.
// FIREBASE_SERVICE_ACCOUNT 미설정 시 503 반환.
@Controller("auth")
export class FirebaseTokenController {
  constructor(
    @Optional() @Inject(FIREBASE_ADMIN_APP) private readonly app: App | null,
  ) {}

  @UseGuards(AuthGuard)
  @Post("firebase/token")
  async issue(@CurrentUser() user: AuthenticatedUser): Promise<{ customToken: string }> {
    if (!this.app) throw new ServiceUnavailableException("Firebase bridge not configured");
    const customToken = await getAuth(this.app).createCustomToken(user.sub, {
      active_org_id: user.orgId,
      org_role: user.role,
    });
    return { customToken };
  }
}
```

### [NEW] `apps/api/src/auth/firebase-token.controller.test.ts`

단위 테스트 3케이스:
1. `FIREBASE_ADMIN_APP` 있을 때 `createCustomToken` 호출 → `{ customToken }` 반환
2. `FIREBASE_ADMIN_APP` null → `ServiceUnavailableException` throw
3. (AuthGuard 보호 검증은 기존 e2e 커버 — 단위 테스트에서는 guard mock)

### [MODIFY] `apps/api/src/auth/auth.module.ts`

1. `FIREBASE_ADMIN_APP` provider 조건부 추가 (`settings.FIREBASE_SERVICE_ACCOUNT` 있을 때)
2. `FirebaseTokenController` 컨트롤러 배열에 추가
3. `firebase-admin` 관련 import: `cert`, `initializeApp`, `FIREBASE_ADMIN_APP`

```typescript
// auth.module.ts provider 조건부 등록 예시
...(settings.FIREBASE_SERVICE_ACCOUNT
  ? [{
      provide: FIREBASE_ADMIN_APP,
      useValue: (() => {
        const credential = cert(settings.FIREBASE_SERVICE_ACCOUNT!);
        const appOpts = settings.FIREBASE_PROJECT_ID
          ? { credential, projectId: settings.FIREBASE_PROJECT_ID }
          : { credential };
        return initializeApp(appOpts, "native-bridge");
      })(),
    }]
  : []),
```

> **주의**: `NestjsFirebaseAuthModule`도 `initializeApp`을 호출한다. Firebase 앱 이름 충돌 방지를 위해
> native-bridge 초기화에는 `"native-bridge"` 이름을 전달한다.

## 🧪 검증 계획

### 단위 테스트

```bash
pnpm --filter @apps/api test -- firebase-token
```

### 타입체크

```bash
pnpm turbo run typecheck
```

### 수동 검증 시나리오

1. `FIREBASE_SERVICE_ACCOUNT` 미설정 → `POST /auth/firebase/token` → 503 확인
2. `FIREBASE_SERVICE_ACCOUNT` 설정 + 유효한 native JWT → 200 `{ customToken }` 확인

## 🔁 Rollback Plan

- `FirebaseTokenController` 제거 + `AuthModule` 원상복구
- DB 변경 없음 — 완전 가역적

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
