# feat(spec-08-03): auth-testing — Mock AuthSDK 팩토리

## 📋 Summary

### 배경 및 목적

`auth-react`의 `AuthProvider`와 소비 훅을 단위 테스트할 때 반복적인 `vi.mock` 설정 없이 사용 가능한 공유 Mock SDK를 제공합니다. `createMockAuthSDK(initial?)` 팩토리는 `AuthSDK` 계약을 완전 구현하며, 테스트가 `_state`로 결과를 제어하고 `_calls`로 호출을 검증할 수 있습니다.

### 주요 변경 사항

- [x] `@repo/frontend-auth-testing` 패키지 신규 생성
- [x] `createMockAuthSDK(initial?)` 팩토리 — `AuthSDK & MockControls` 반환
- [x] `_state` (결과 제어) / `_calls` (호출 기록) / `_reset()` (격리 초기화)
- [x] MFA/Passkey 5개 메서드 → `throw Error("not implemented in mock")` 스텁

### Phase 컨텍스트

- **Phase**: `phase-08`
- **본 SPEC의 역할**: phase-08 세 번째 spec — Provider Adapter 테스팅 인프라. spec-08-04 (sdk-swap-validation)에서 직접 활용 가능.

## 🎯 Key Review Points

1. **`AuthSDK` (full) 구현**: `CoreAuthSDK`가 아닌 전체 `AuthSDK` — `AuthProvider`가 `sdk: AuthSDK`를 요구하기 때문.
2. **vitest 의존 없음**: `_state` / `_calls`는 순수 TypeScript 객체 — 어느 테스트 환경에서도 사용 가능.
3. **signIn 성공 시 currentUser 자동 업데이트**: `AuthProvider`의 실제 동작 미러 — 훅 단위 테스트의 상태 흐름 재현 가능.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter frontend-auth-testing test
```

**결과 요약**:
- ✅ `createMockAuthSDK` — 14 tests (signIn/signUp/signOut/getCurrentUser/refresh/_reset/MFA 스텁)
- **전체**: 14 tests passed / 39 packages typecheck clean

## 📦 Files Changed

### 🆕 New Files

- `packages/frontend/auth-testing/package.json`: `@repo/frontend-auth-testing` 패키지 설정
- `packages/frontend/auth-testing/tsconfig.json`: TypeScript 설정 (ES2023 + DOM)
- `packages/frontend/auth-testing/vitest.config.ts`: vitest node preset
- `packages/frontend/auth-testing/src/index.ts`: `createMockAuthSDK` 구현체 + 타입 export
- `packages/frontend/auth-testing/src/index.test.ts`: 단위 테스트 14개

**Total**: 5 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (14 tests)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과 (39 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-08.md`
- Walkthrough: `specs/spec-08-03-auth-testing/walkthrough.md`
