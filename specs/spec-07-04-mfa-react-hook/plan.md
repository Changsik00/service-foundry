# Implementation Plan: spec-07-04

## 📋 Branch Strategy

- 신규 브랜치: `spec-07-04-mfa-react-hook`
- 시작 지점: `phase-07-auth-extension` (Phase Base Branch 모드)
- 첫 task 가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `AuthSDK` 인터페이스에 메서드 5개 추가 — 기존 구현체(apps/web 등)가 있다면 해당 구현체도 업데이트 필요 (현재 없으므로 breaking change 없음)

> [!WARNING]
> - [ ] `@simplewebauthn/browser` v13.1.1 신규 의존성 — `pnpm-workspace.yaml` catalog에 추가

## 🎯 핵심 전략

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **WebAuthn ceremony 위치** | `@repo/frontend-auth-react` 훅 내부 | 훅이 complete한 흐름 제공, apps/web은 추가 작업 불필요 |
| **HTTP 호출 방식** | `AuthSDK` 인터페이스 경유 | `@repo/frontend-auth-react`에 HTTP 클라이언트 직접 의존 없음 |
| **테스트** | `@simplewebauthn/browser` vi.mock | jsdom에서 `navigator.credentials` 없으므로 전체 함수를 mock |
| **auth-contracts 확장** | `AuthSDK` 메서드 추가 (5개) | SSOT — SDK 인터페이스가 유일한 계약 위치 |

### 📑 ADR 후보

- [x] 없음

## 📂 Proposed Changes

### [shared] `packages/shared/auth-contracts/src/index.ts`

#### [MODIFY] AuthSDK 인터페이스 확장

```typescript
export interface AuthSDK {
  // 기존 메서드 유지...
  verifyMfaTotp(mfaChallengeToken: string, code: string): Promise<AuthResult>;
  fetchPasskeyRegisterOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyRegister(challengeToken: string, credential: unknown): Promise<void>;
  fetchPasskeyAuthOptions(): Promise<{ challengeToken: string; options: object }>;
  verifyPasskeyAuth(challengeToken: string, credentialId: string, credential: unknown): Promise<AuthResult>;
}
```

### [frontend] `packages/frontend/auth-react`

#### [MODIFY] `package.json` — `@simplewebauthn/browser` 의존성 추가

#### [NEW] `src/mfa.ts` — `useMfaChallenge` hook

```typescript
// MfaChallenge(auth-contracts)를 받아 TOTP 제출 + Passkey 인증 처리
export function useMfaChallenge(
  challenge: MfaChallenge,
  sdk: Pick<AuthSDK, 'verifyMfaTotp' | 'fetchPasskeyAuthOptions' | 'verifyPasskeyAuth'>
): {
  isLoading: boolean;
  error: string | null;
  submitTotp: (code: string) => Promise<AuthResult>;
  authenticatePasskey: () => Promise<AuthResult>;
}
```

#### [NEW] `src/passkey.ts` — `usePasskeyRegister` hook

```typescript
// Passkey 등록 전체 흐름: options 요청 → startRegistration → verify
export function usePasskeyRegister(
  sdk: Pick<AuthSDK, 'fetchPasskeyRegisterOptions' | 'verifyPasskeyRegister'>
): {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  register: () => Promise<void>;
}
```

#### [MODIFY] `src/index.ts` — 신규 훅 export 추가

### [catalog] `pnpm-workspace.yaml`

#### [MODIFY] `@simplewebauthn/browser: "^13.1.1"` 추가

## 🧪 검증 계획

### 단위 테스트 (필수)

```bash
pnpm --filter frontend-auth-react test
pnpm --filter auth-contracts test
```

### 수동 검증 시나리오

1. `useMfaChallenge` — TOTP 성공 경로: `submitTotp("123456")` 호출 → `sdk.verifyMfaTotp` 1회 호출 + AuthResult 반환
2. `useMfaChallenge` — Passkey 경로: `authenticatePasskey()` → `fetchPasskeyAuthOptions` → `startAuthentication` → `verifyPasskeyAuth` 순서 확인
3. `usePasskeyRegister` — `register()` → `fetchPasskeyRegisterOptions` → `startRegistration` → `verifyPasskeyRegister` 순서 확인
4. 에러 경로: sdk 메서드가 throw → `error` 상태 세팅, `isLoading` 리셋

## 🔁 Rollback Plan

- `auth-contracts` 변경: 기존 구현체 없으므로 단순 revert
- `frontend-auth-react` 신규 파일: 삭제로 충분
- `pnpm-workspace.yaml` catalog 항목: 삭제

## 📦 Deliverables 체크

- [x] task.md 작성
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
