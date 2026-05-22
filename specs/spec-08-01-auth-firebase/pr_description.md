# feat(spec-08-01): auth-firebase — Firebase AuthSDK 래퍼

## 📋 Summary

### 배경 및 목적

phase-05~07에서 완성된 Native JWT 기반 `AuthSDK`와 동일한 인터페이스 계약(`CoreAuthSDK`)을 Firebase Client SDK로 구현합니다. "Consistent Wrapped SDK" 컨벤션(ADR-0006 §Decision 2)의 첫 번째 실증 — `auth-react`의 `AuthProvider`에 Firebase 기반 SDK를 그대로 주입 가능.

### 주요 변경 사항

- [x] `@repo/auth-contracts` — `CoreAuthSDK` 타입 추가 (Pick AuthSDK 5개 Core 메서드)
- [x] `@repo/frontend-auth-firebase` 패키지 신규 생성 — `createFirebaseAuthSDK(app)` 팩토리
- [x] `FirebaseError` → `AuthResult` / `AppError` 정규화 (`normalize.ts`)
- [x] `firebase ^11.0.0` pnpm-workspace.yaml catalog 등록

### Phase 컨텍스트

- **Phase**: `phase-08`
- **본 SPEC의 역할**: phase-08 첫 번째 spec — Provider Adapter 패턴 첫 실증 (Firebase). 이후 auth-supabase, auth-testing이 동일 `CoreAuthSDK` 계약 기반으로 구현됨.

## 🎯 Key Review Points

1. **`CoreAuthSDK` 타입**: `Pick<AuthSDK, ...>` — MFA/Passkey 메서드 제외. Provider 래퍼가 의존해야 하는 최소 계약. 이 타입이 phase-08의 기준점.
2. **`FirebaseError` 정규화 전략**: signIn/signUp 실패(INVALID_CREDENTIALS, RATE_LIMITED, LOCKED)는 `AuthResult`로 반환 (UI 분기용). 이메일 중복(CONFLICT)은 `AppError` throw (예외적 상황).
3. **패키지 위치**: `packages/frontend/auth-firebase/` — 아키텍처 노트의 `packages/auth-firebase/` 대비 ADR-0015 준수 방향. auth-supabase도 동일 카테고리.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter frontend-auth-firebase test
```

**결과 요약**:
- ✅ `normalizeFirebaseAuthError` — 8 tests (에러 코드별 정규화 전 경로)
- ✅ `createFirebaseAuthSDK` — 12 tests (signIn/signUp/signOut/getCurrentUser/refresh/firebase.getIdTokenResult)
- **전체**: 20 tests passed / 37 packages typecheck clean

## 📦 Files Changed

### 🆕 New Files

- `packages/frontend/auth-firebase/package.json`: `@repo/frontend-auth-firebase` 패키지 설정
- `packages/frontend/auth-firebase/tsconfig.json`: TypeScript 설정 (ES2023 + DOM)
- `packages/frontend/auth-firebase/vitest.config.ts`: vitest node preset
- `packages/frontend/auth-firebase/src/normalize.ts`: FirebaseError 정규화 로직
- `packages/frontend/auth-firebase/src/normalize.test.ts`: 정규화 단위 테스트 8개
- `packages/frontend/auth-firebase/src/index.ts`: `createFirebaseAuthSDK` 구현체
- `packages/frontend/auth-firebase/src/index.test.ts`: 구현체 단위 테스트 12개

### 🛠 Modified Files

- `packages/shared/auth-contracts/src/index.ts`: `CoreAuthSDK` 타입 export 추가
- `pnpm-workspace.yaml`: `firebase: "^11.0.0"` catalog 추가
- `pnpm-lock.yaml`: lockfile 갱신

**Total**: 10 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (20 tests)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과 (37 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-08.md`
- Walkthrough: `specs/spec-08-01-auth-firebase/walkthrough.md`
