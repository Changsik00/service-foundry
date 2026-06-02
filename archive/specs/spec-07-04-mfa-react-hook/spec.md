# spec-07-04: MFA + Passkey React Hook

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-07-04` |
| **Phase** | `phase-07` |
| **Branch** | `spec-07-04-mfa-react-hook` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- spec-07-02: MFA TOTP 백엔드(enroll/verify/disable) 완성.
- spec-07-03: Passkey 백엔드(register/authenticate) 완성.
- `@repo/auth-contracts`의 `AuthResult`에는 `mfa_required` 분기가 이미 존재하지만 `AuthSDK` 인터페이스에 MFA/Passkey 메서드가 없음.
- `@repo/frontend-auth-react`에는 `mfa_required` 결과를 처리하는 훅이 없음.

### 문제점

프론트엔드에서 `signIn` 후 `AuthResult.reason === "mfa_required"`를 받으면 TOTP 코드 검증이나 Passkey 인증으로 이어가는 공식 경로가 없다. Passkey 등록 흐름도 마찬가지.

### 해결 방안 (요약)

`AuthSDK` 인터페이스에 MFA/Passkey HTTP 메서드를 추가하고, `@repo/frontend-auth-react`에 `useMfaChallenge`와 `usePasskeyRegister` 훅을 구현한다. `@simplewebauthn/browser`의 WebAuthn ceremony는 훅 내에서 처리한다.

## 🎯 요구사항

### Functional Requirements

1. `@repo/auth-contracts` — `AuthSDK`에 메서드 5개 추가:
   - `verifyMfaTotp(mfaChallengeToken: string, code: string): Promise<AuthResult>`
   - `fetchPasskeyRegisterOptions(): Promise<{ challengeToken: string; options: object }>`
   - `verifyPasskeyRegister(challengeToken: string, credential: unknown): Promise<void>`
   - `fetchPasskeyAuthOptions(): Promise<{ challengeToken: string; options: object }>`
   - `verifyPasskeyAuth(challengeToken: string, credentialId: string, credential: unknown): Promise<AuthResult>`
2. `useMfaChallenge(challenge: MfaChallenge, sdk)` hook — `mfa_required` 분기 처리:
   - `submitTotp(code)` → `sdk.verifyMfaTotp` 호출 → `AuthResult` 반환
   - `authenticatePasskey()` → `sdk.fetchPasskeyAuthOptions` → `startAuthentication` (simplewebauthn) → `sdk.verifyPasskeyAuth` → `AuthResult` 반환
   - `isLoading`, `error` 상태
3. `usePasskeyRegister(sdk)` hook — Passkey 등록 전체 흐름:
   - `register()` → `fetchPasskeyRegisterOptions` → `startRegistration` (simplewebauthn) → `verifyPasskeyRegister`
   - `isLoading`, `error`, `isSuccess` 상태
4. 단위 테스트: sdk 메서드와 `@simplewebauthn/browser` 함수를 vi.mock으로 처리

### Non-Functional Requirements

1. `@repo/auth-contracts`는 브라우저 의존성 없음 (순수 타입/인터페이스)
2. `@repo/frontend-auth-react`는 HTTP 호출 없이 sdk 인터페이스만 호출
3. jsdom 환경 테스트 가능 (`startRegistration`/`startAuthentication` 자체를 vi.mock)

## 🚫 Out of Scope

- 구체적인 `AuthSDK` 구현체 (apps/web에서 구현)
- UI 컴포넌트 (입력 폼, 버튼 등)
- MFA backup code 훅
- `pnpm install` 이후 apps/web 통합 (별도 spec 또는 Phase 8)

## 📑 ADR 후보

- [x] 없음

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-07-04-mfa-react-hook` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
