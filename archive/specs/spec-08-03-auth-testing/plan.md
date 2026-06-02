# Implementation Plan: spec-08-03

## 📋 Branch Strategy

- 신규 브랜치: `spec-08-03-auth-testing`
- 시작 지점: `phase-08-provider-adapters` (Phase Base Branch 모드)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] Mock이 구현하는 인터페이스: `AuthSDK` (full, MFA/Passkey 스텁 포함) — `CoreAuthSDK`만으로는 `AuthProvider`에 주입 불가 (provider.ts가 `sdk: AuthSDK`를 선언)
> - [ ] `_state` / `_calls` / `_reset` — underscore prefix로 테스트 전용 API 구분

> [!WARNING]
> - [ ] 신규 의존성 없음 — `@repo/auth-contracts` + `@repo/errors`만 사용

## 🎯 핵심 전략

### MockAuthState & MockControls 설계

```typescript
// 테스트가 제어하는 상태
export interface MockAuthState {
  currentUser: User | null;
  signInResult: AuthResult;
  signUpResult: AuthResult;
  refreshResult: Session | null;
}

// 테스트가 검증하는 호출 기록
export interface MockAuthCalls {
  signIn: SignInInput[];
  signUp: SignUpInput[];
  signOutCount: number;
  getCurrentUserCount: number;
  refreshCount: number;
}

// 테스트 제어 핸들
export interface MockControls {
  _state: MockAuthState;
  _calls: MockAuthCalls;
  _reset(): void;
}

export type MockAuthSDK = AuthSDK & MockControls;
```

### 기본 동작

| 메서드 | 동작 |
|---|---|
| `signIn(input)` | `_calls.signIn` 기록 → `_state.signInResult` 반환. 성공 시 `_state.currentUser` 업데이트 |
| `signUp(input)` | `_calls.signUp` 기록 → `_state.signUpResult` 반환. 성공 시 `_state.currentUser` 업데이트 |
| `signOut()` | `_calls.signOutCount++`, `_state.currentUser = null` |
| `getCurrentUser()` | `_calls.getCurrentUserCount++` → `_state.currentUser` 반환 |
| `refresh()` | `_calls.refreshCount++` → `_state.refreshResult` 반환 |
| MFA/Passkey (5개) | `throw new Error("not implemented in mock")` |

### 기본 초기값

```typescript
const DEFAULT_STATE: MockAuthState = {
  currentUser: null,
  signInResult: { success: false, reason: "invalid_credentials" },
  signUpResult: { success: false, reason: "invalid_credentials" },
  refreshResult: null,
};
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **구현 인터페이스** | `AuthSDK` (full) | `AuthProvider`가 `sdk: AuthSDK` 요구 — CoreAuthSDK만으론 주입 불가 |
| **테스트 API 노출** | `_state` / `_calls` 직접 참조 | vitest fn() 없이도 충분 — 단순 객체 검증이 더 명확 |
| **MFA 스텁** | `throw Error` | `@repo/frontend-auth-firebase` 설계 원칙 일관성 — MFA 미구현이 명시적 |
| **signIn 성공 시 currentUser 업데이트** | 자동 업데이트 | AuthProvider의 실제 동작을 mock에서도 미러 — 훅 테스트의 상태 흐름 재현 |
| **패키지 위치** | `packages/frontend/auth-testing/` | AuthSDK는 프론트 계약. ADR-0015 준수 |

### 📑 ADR 후보

- [ ] 없음

## 📂 Proposed Changes

### [new package] `packages/frontend/auth-testing/`

#### [NEW] `package.json`

```json
{
  "name": "@repo/frontend-auth-testing",
  "dependencies": {
    "@repo/auth-contracts": "workspace:*"
  }
}
```

#### [NEW] `src/index.ts` — createMockAuthSDK 팩토리

```typescript
export type { MockAuthState, MockAuthCalls, MockControls, MockAuthSDK };
export { createMockAuthSDK, DEFAULT_STATE };
```

#### [NEW] `src/index.test.ts` — Mock 단위 테스트

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter frontend-auth-testing test
pnpm -r typecheck
```

### 수동 검증 시나리오

1. **signIn 성공 흐름**: `_state.signInResult = { success: true, user, session }` 설정 → `sdk.signIn(...)` → `_calls.signIn[0]` 기록 확인 + `_state.currentUser` 업데이트 확인
2. **signOut 후 currentUser null**: `signOut()` 호출 → `_state.currentUser === null`, `_calls.signOutCount === 1`
3. **_reset**: 여러 호출 후 `_reset()` → 모든 상태/호출 초기화

## 🔁 Rollback Plan

- 신규 패키지 디렉토리 삭제로 충분
- 기존 패키지 변경 없음

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
