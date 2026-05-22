# feat(spec-07-04): MFA + Passkey React Hook

## 📋 Summary

### 배경 및 목적

spec-07-02(MFA TOTP), spec-07-03(Passkey) 백엔드 완성 이후 프론트엔드에서 `mfa_required` AuthResult 분기를 처리할 공식 경로가 없었습니다. 본 spec은 `@repo/frontend-auth-react`에 MFA/Passkey React hook 2개를 추가하고 `AuthSDK` 인터페이스를 확장하여 phase-07 프론트엔드 기반을 완성합니다.

### 주요 변경 사항

- [x] `@repo/auth-contracts` — `AuthSDK`에 MFA/Passkey 메서드 5개 추가
- [x] `useMfaChallenge` hook — TOTP 코드 제출 + Passkey 인증 (`@simplewebauthn/browser`)
- [x] `usePasskeyRegister` hook — Passkey 등록 전체 흐름
- [x] `@simplewebauthn/browser ^13.1.1` catalog 등록 + `@repo/frontend-auth-react` 의존성

### Phase 컨텍스트

- **Phase**: `phase-07`
- **본 SPEC 의 역할**: phase-07 마지막 spec — MFA/Passkey 백엔드와 프론트엔드 훅을 연결

## 🎯 Key Review Points

1. **`useMfaChallenge` Passkey 경로**: `fetchPasskeyAuthOptions` → `startAuthentication` → `verifyPasskeyAuth` 순서 확인. `credential.id`를 `credentialId`로 전달
2. **`usePasskeyRegister`**: `isSuccess` 플래그 — 성공 시 `true`, 에러 시 `false` 유지
3. **AuthSDK 확장 호환성**: 기존 구현체 없으므로 breaking change 없음. 기존 테스트 mock에 stub 추가됨

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter frontend-auth-react test
```

**결과 요약**:
- ✅ `useMfaChallenge` — 5 tests (TOTP 성공/에러/isLoading, Passkey 성공/에러)
- ✅ `usePasskeyRegister` — 4 tests (성공, 취소, verify 에러, isLoading)
- ✅ 기존 guards/provider 테스트 — 11 tests
- **전체**: 20 tests passed / 36 packages typecheck clean

## 📦 Files Changed

### 🆕 New Files

- `packages/frontend/auth-react/src/mfa.ts`: `useMfaChallenge` hook
- `packages/frontend/auth-react/src/mfa.test.ts`: 단위 테스트 5개
- `packages/frontend/auth-react/src/passkey.ts`: `usePasskeyRegister` hook
- `packages/frontend/auth-react/src/passkey.test.ts`: 단위 테스트 4개

### 🛠 Modified Files

- `packages/shared/auth-contracts/src/index.ts`: AuthSDK 메서드 5개 추가
- `packages/frontend/auth-react/src/index.ts`: 신규 훅 export
- `packages/frontend/auth-react/package.json`: `@simplewebauthn/browser` 의존성
- `packages/frontend/auth-react/src/guards.test.tsx`: makeSdk mock 업데이트
- `packages/frontend/auth-react/src/provider.test.tsx`: makeSdk mock 업데이트
- `pnpm-workspace.yaml`: catalog에 `@simplewebauthn/browser` 추가

**Total**: 10 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (20 tests)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과 (36 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-07.md`
- Walkthrough: `specs/spec-07-04-mfa-react-hook/walkthrough.md`
