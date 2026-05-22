# Walkthrough: spec-07-04

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| WebAuthn ceremony 위치 | 훅 내부 vs SDK 구현체 | 훅 내부 (`@simplewebauthn/browser`) | 훅이 완전한 흐름 제공 → apps/web 추가 코드 불필요 |
| AuthSDK 확장 vs 별도 인터페이스 | AuthSDK 확장 / 별도 PasskeySDK / 로컬 타입 | 로컬 타입 (`MfaSdk`, `PasskeyRegisterSdk`) + AuthSDK 확장 병행 | 훅 내부에는 최소 필요 메서드만 Pick — 테스트 mock 단순화. AuthSDK 확장은 구현체 계약 명시용 |
| 테스트 전략 | jsdom `navigator.credentials` mock / `@simplewebauthn/browser` vi.mock | `@simplewebauthn/browser` 전체 vi.mock | jsdom에 `navigator.credentials` 없음 — simplewebauthn 함수 자체를 mock하면 React hook 로직만 검증 가능 |
| `@simplewebauthn/browser` 버전 | server와 동일 major (^13) | ^13.1.1 | server와 같은 버전 범위 → API 호환성 보장 |

- [x] 없음 (ADR 승격 불필요)

## 💬 사용자 협의

- **주제**: spec-07-04 scope — React hook만 vs UI 컴포넌트 포함
  - **합의**: hook만 구현. UI 컴포넌트(입력 폼, 버튼)는 Out of Scope

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm --filter frontend-auth-react test`
- **결과**: ✅ Passed (20 tests in 4 test files)
- **로그 요약**:
```
Test Files  4 passed (4)
Tests  20 passed (20)
```

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (36 packages)

### 2. 수동 검증

1. **Action**: `pnpm --filter frontend-auth-react exec vitest run src/mfa.test.ts`
   - **Result**: 5 tests passed — `useMfaChallenge` TOTP/Passkey 경로 모두 통과

2. **Action**: `pnpm --filter frontend-auth-react exec vitest run src/passkey.test.ts`
   - **Result**: 4 tests passed — `usePasskeyRegister` 성공/실패/isLoading 경로 통과

## 🔍 발견 사항

- `AuthSDK` 인터페이스에 메서드를 추가하면 기존 테스트 mock이 타입 오류를 일으킴 → `guards.test.tsx`, `provider.test.tsx`의 `makeSdk` 헬퍼에 신규 메서드 stub 추가 필요 (Task 1 커밋에 포함)
- biome가 import 순서 자동 정렬 (`mfa.test.ts`, `passkey.test.ts` pre-commit에서 1회 수정)

## 🚧 이월 항목

- 구체적인 `AuthSDK` 구현체 (HTTP 호출) — apps/web에서 구현 (Phase 8 또는 이후)
- MFA backup code 훅 (`useBackupCodeVerify`) — 현재 미구현

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | 180c4d2 |
