# Implementation Plan: spec-08-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-08-01-auth-firebase`
- 시작 지점: `phase-08-provider-adapters` (Phase Base Branch 모드)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `auth-contracts`에 `CoreAuthSDK` 타입 추가 — 기존 코드에 breaking change 없음 (신규 export). 단, 이후 auth-supabase/auth-testing도 이 타입을 기준으로 구현됨.
> - [ ] 패키지 위치: `packages/frontend/auth-firebase/` (`@repo/frontend-auth-firebase`) — 아키텍처 노트의 `packages/auth-firebase/` 대비 ADR-0015 준수 방향. 이후 auth-supabase도 동일 카테고리 적용.

> [!WARNING]
> - [ ] `firebase` 패키지 신규 의존성 (`^11.x`) — `pnpm-workspace.yaml` catalog에 추가. `firebase-admin`은 이 spec에서 사용하지 않음.

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **CoreAuthSDK 위치** | `auth-contracts`에 신규 export | SSOT — Provider 패키지 계약의 단일 위치 |
| **패키지 카테고리** | `packages/frontend/auth-firebase/` | ADR-0015: `firebase/auth`는 브라우저/프론트 맥락 |
| **테스트 전략** | `vi.mock('firebase/auth', ...)` 전체 | `firebase/auth` 함수는 브라우저 글로벌에 의존 → jsdom에서 직접 실행 불가 |
| **FirebaseError 정규화** | `AuthResult` 리턴 vs `AppError` throw | signIn/signUp 실패는 `AuthResult` (UI 처리), 예기치 않은 에러는 `AppError` throw |
| **MFA/Passkey 메서드 미구현** | `CoreAuthSDK`만 구현 | Firebase SDK는 Custom Backend MFA/Passkey API 미지원 — stub 없이 타입으로 명시 |

### 📑 ADR 후보

- [x] `auth-provider-package-location` (type: convention) — Provider 패키지 위치 컨벤션 (`packages/frontend/` 채택)

## 📂 Proposed Changes

### [shared] `packages/shared/auth-contracts/src/index.ts`

#### [MODIFY] `CoreAuthSDK` 타입 추가

```typescript
export type CoreAuthSDK = Pick<
  AuthSDK,
  'signIn' | 'signOut' | 'getCurrentUser' | 'signUp' | 'refresh'
>;
```

### [new package] `packages/frontend/auth-firebase/`

#### [NEW] `package.json`

```json
{
  "name": "@repo/frontend-auth-firebase",
  "dependencies": {
    "@repo/auth-contracts": "workspace:*",
    "@repo/errors": "workspace:*",
    "firebase": "catalog:"
  }
}
```

#### [NEW] `src/normalize.ts` — FirebaseError → AuthResult / AppError 변환

```typescript
export function normalizeFirebaseError(err: unknown): never | AuthResult {
  // FirebaseError code → AuthResult reason or AppError throw
}
```

#### [NEW] `src/index.ts` — createFirebaseAuthSDK

```typescript
export interface FirebaseExtensions {
  getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult | null>;
}

export function createFirebaseAuthSDK(
  app: FirebaseApp,
): CoreAuthSDK & { firebase: FirebaseExtensions } { ... }
```

#### [NEW] `src/normalize.test.ts` — 에러 정규화 단위 테스트

#### [NEW] `src/index.test.ts` — Core Surface 단위 테스트 (vi.mock firebase/auth)

### [catalog] `pnpm-workspace.yaml`

#### [MODIFY] `firebase: "^11.0.0"` 추가

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter frontend-auth-firebase test
pnpm --filter auth-contracts test
```

### 수동 검증 시나리오

1. **signIn 성공 경로**: `sdk.signIn({ email, password })` → `firebase/auth`의 `signInWithEmailAndPassword` 1회 호출 + `AuthResult { success: true, user, session }` 반환
2. **signIn 실패 — user-not-found**: mock `signInWithEmailAndPassword` throw `FirebaseError('auth/user-not-found')` → `AuthResult { success: false, reason: "invalid_credentials" }` 반환
3. **signUp email 중복**: mock throw `FirebaseError('auth/email-already-in-use')` → `AppError({ code: "CONFLICT" })` throw
4. **getCurrentUser null 상태**: `auth.currentUser === null` → `null` 반환
5. **refresh 토큰 갱신**: mock `getIdToken(true)` 정상 응답 → `Session` 반환

## 🔁 Rollback Plan

- `auth-contracts` 변경: `CoreAuthSDK` 타입만 추가 — 삭제해도 기존 코드 무영향
- `packages/frontend/auth-firebase/`: 신규 디렉토리 삭제로 충분
- `pnpm-workspace.yaml` catalog: `firebase` 항목 삭제

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
