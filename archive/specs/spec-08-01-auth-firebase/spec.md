# spec-08-01: auth-firebase — Firebase AuthSDK 래퍼

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-08-01` |
| **Phase** | `phase-08` |
| **Branch** | `spec-08-01-auth-firebase` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- phase-05~07: Native JWT 기반 `AuthSDK` 구현 완료 (auth-session + auth-jwt + auth-passkey + auth-mfa).
- `@repo/auth-contracts`의 `AuthSDK`는 Core Surface 5개 메서드 + MFA/Passkey 전용 메서드 5개 = 총 10개.
- phase-08 목표: "Consistent Wrapped SDK" 컨벤션(ADR-0006 §Decision 2)을 Firebase로 실증 — `firebase/auth` 래퍼가 `@repo/frontend-auth-react`의 `AuthProvider`에 그대로 꽂히는 것을 증명.

### 문제점

1. `AuthSDK` 전체를 구현하려면 Custom Backend 전용 MFA/Passkey 메서드 5개도 구현해야 하는데, Firebase SDK에는 직접 매핑되는 API가 없음.
2. `FirebaseError`(예: `auth/user-not-found`)가 앱 코드에 그대로 노출되면 provider-specific 에러에 의존하게 됨 — ADR-0012 위반.
3. `@repo/auth-contracts`에 "Provider가 최소한 구현해야 하는 Core Surface" 타입이 없어 인터페이스 계약이 느슨함.

### 해결 방안 (요약)

`auth-contracts`에 `CoreAuthSDK`(5개 메서드 Pick) 타입을 추가하고, `packages/frontend/auth-firebase` 패키지를 생성해 `firebase/auth`를 `CoreAuthSDK`로 래핑한다. `FirebaseError`는 `@repo/errors` `AppError` 도메인 코드로 정규화한다.

## 🎯 요구사항

### Functional Requirements

1. **`auth-contracts` 확장** — 신규 export:
   ```ts
   export type CoreAuthSDK = Pick<AuthSDK, 'signIn' | 'signOut' | 'getCurrentUser' | 'signUp' | 'refresh'>;
   ```
2. **`createFirebaseAuthSDK(app: FirebaseApp)`** 팩토리 함수 — `CoreAuthSDK & { firebase: FirebaseExtensions }` 반환.
3. **Core Surface 구현**:
   - `signIn(input)` → `signInWithEmailAndPassword` → `AuthResult`
   - `signUp(input)` → `createUserWithEmailAndPassword` → `AuthResult`
   - `signOut()` → `signOut(firebaseAuth)` 위임
   - `getCurrentUser()` → `firebaseAuth.currentUser` → `User | null` 변환
   - `refresh()` → `currentUser.getIdToken(true)` → `Session | null` 변환
4. **`FirebaseExtensions`**:
   - `getIdTokenResult(forceRefresh?: boolean)` — 현재 유저의 ID token result (custom claims 포함) 반환
5. **`FirebaseError` 정규화** (`src/normalize.ts`):
   - `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential` → `{ success: false, reason: "invalid_credentials" }` 형태로 `AuthResult` 반환
   - `auth/email-already-in-use` → `AppError({ code: "CONFLICT" })` throw
   - `auth/too-many-requests` → `{ success: false, reason: "rate_limited" }`
   - `auth/user-disabled` → `{ success: false, reason: "account_locked" }`
   - 기타 → 원본 `FirebaseError` 그대로 re-throw

### Non-Functional Requirements

1. 패키지 위치: `packages/frontend/auth-firebase/` (`@repo/frontend-auth-firebase`) — ADR-0015 frontend 카테고리. firebase client SDK는 브라우저 + Node.js 환경 모두 지원하나, `AuthProvider` 소비 맥락이 프론트엔드.
2. `firebase/auth` 함수 직접 호출 (HTTP 없음).
3. `@repo/auth-contracts`의 기존 `AuthSDK` 변경 없음 — `CoreAuthSDK`는 신규 export만 추가.
4. 테스트: `vi.mock('firebase/auth', ...)` — jsdom 환경에서 실행 가능.

## 🚫 Out of Scope

- `firebase-admin` 서버 사이드 래퍼 (`setCustomClaims`, Admin 유저 관리)
- Firebase Phone Auth / Anonymous Auth / Social Provider (Google, GitHub)
- Firebase 자체 MFA (TOTP/SMS) 통합
- Firebase App Check
- NestJS 모듈 / Guard 래핑

## 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → `auth-provider-package-location` (type: convention) — Provider 패키지 위치(`packages/frontend/` vs 루트 `packages/`)가 이후 auth-supabase, auth-testing에도 적용되는 장기 컨벤션

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-08-01-auth-firebase` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
