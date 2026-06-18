# Walkthrough: spec-18-05 — Firebase Custom Token 발행 엔드포인트

## 변경 개요

native 모드(`AUTH_MODE=native`)로 운영 중인 서버에서 Firebase 클라이언트 SDK 세션이
추가로 필요한 시나리오를 위한 **브리지 엔드포인트**를 추가했다.

`FIREBASE_SERVICE_ACCOUNT` 환경변수가 설정된 경우에만 Firebase Admin App을 초기화하며,
native Bearer 토큰으로 인증한 뒤 Firebase custom token을 발행한다.

---

## Task 1 — TDD Red: 테스트 스텁

### 테스트 케이스 (2개)

```typescript
// src/auth/firebase-token.controller.test.ts

// 케이스 1: FIREBASE_ADMIN_APP 있음 → createCustomToken 호출 + { customToken } 반환
// 케이스 2: FIREBASE_ADMIN_APP null → ServiceUnavailableException (503)
```

firebase-admin/auth 모킹:
```typescript
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ createCustomToken: mockCreateCustomToken }),
}));
```

컨트롤러는 `throw new Error("not implemented")` 스텁으로 생성 → 2 tests FAIL (Red 확인)

**의존성 추가**: `firebase-admin`을 `apps/api/package.json`에 직접 추가 (타입 해소 목적)

---

## Task 2 — Green + AuthModule 배선

### FirebaseTokenController 구현

```typescript
// apps/api/src/auth/firebase-token.controller.ts

// [브리지 패턴] 이 컨트롤러는 native Bearer 인증 서버에서 Firebase 클라이언트 SDK 세션이
// 추가로 필요할 때 — 예: Firebase Storage / Realtime DB 직접 접근 — 를 위한 브리지 엔드포인트다.
// AUTH_MODE=firebase처럼 Firebase가 이미 주 인증 수단인 환경에서는 이 endpoint 가 불필요하다.
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

### AuthModule 배선

```typescript
// apps/api/src/auth/auth.module.ts — 조건부 FIREBASE_ADMIN_APP provider

// [브리지 패턴] FIREBASE_SERVICE_ACCOUNT 설정 시에만 Firebase Admin 앱 초기화.
// "native-bridge" 앱 이름 — AUTH_MODE=firebase 모드의 unnamed app과 충돌 방지.
...(settings.FIREBASE_SERVICE_ACCOUNT
  ? [{ provide: FIREBASE_ADMIN_APP, useValue: initializeApp(
      { credential: cert(settings.FIREBASE_SERVICE_ACCOUNT), ... },
      "native-bridge"
    )}]
  : []),
```

컨트롤러를 `controllers` 배열에 추가:
```typescript
controllers: [AuthController, OAuthController, MfaController, PasskeyController, FirebaseTokenController],
```

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `firebase-token.controller.test.ts` (2 tests) | ✅ PASS |
| `pnpm turbo run typecheck` (48 packages) | ✅ PASS |
| `pnpm depcruise` (433 modules) | ✅ 위반 없음 |

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| `AuthModule`에 컨트롤러 추가 | native 모드 전용, `AuthModule`이 native path에서만 로드됨 |
| `@Optional()` 주입 → 503 | 앱 시작 시점에 firebase 초기화 실패를 피하면서 런타임에 graceful 응답 |
| `"native-bridge"` 앱 이름 | `AUTH_MODE=firebase`에서 동시 사용 시 Firebase 앱 이름 충돌 방지 |
| 브리지 패턴 주석 필수 | native Bearer가 기본 인증인데 왜 Firebase 엔드포인트가 있는지 혼란 방지 |
