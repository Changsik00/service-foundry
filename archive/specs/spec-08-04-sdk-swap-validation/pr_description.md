# feat(spec-08-04): sdk-swap-validation — AuthProvider CoreAuthSDK 연결

## 📋 Summary

### 배경 및 목적

phase-08의 최종 실증 — "Consistent Wrapped SDK" 컨벤션(ADR-0006)이 실제로 작동함을 TypeScript 레벨에서 증명합니다. `apps/web-next`에 `AuthProvider`를 연결하고, Provider 교체가 `src/lib/auth.ts` 단 1줄 변경으로 가능함을 보입니다.

### 주요 변경 사항

- [x] `auth-react/provider.tsx` — `sdk: AuthSDK` → `sdk: CoreAuthSDK` (MFA/Passkey 훅은 자체 param 유지, breaking 없음)
- [x] `apps/web-next/src/lib/auth.ts` — SDK 교체 지점, `createMockAuthSDK()` 기본값 + Firebase/Supabase 교체 예시 주석
- [x] `apps/web-next/src/components/providers.tsx` — `AuthProvider` 추가
- [x] `apps/web-next/src/lib/auth.test.ts` — `CoreAuthSDK` 계약 TypeScript + 런타임 검증 7 tests

### Phase 컨텍스트

- **Phase**: `phase-08`
- **본 SPEC의 역할**: phase-08 마지막 spec — spec-08-01~03에서 구현한 Firebase/Supabase/Mock SDK가 `AuthProvider`에 호환됨을 증명. `AuthProvider` prop 타입 수정이 설계 완성의 핵심.

## 🎯 Key Review Points

1. **`AuthProvider` prop 축소**: `AuthSDK` → `CoreAuthSDK`. `provider.tsx`가 실제 사용하는 메서드는 Core 5개뿐. MFA/Passkey 훅(`useMfaChallenge`, `usePasskeyRegister`)은 `sdk` prop이 아닌 별도 파라미터를 사용.
2. **`src/lib/auth.ts` 패턴**: 앱의 SDK 선택이 단일 파일에 집중 → Provider 교체 시 다른 파일 수정 불필요.
3. **ADR 후보**: `auth-provider-sdk-prop-contract` (type: convention) — phase-08 완료 시 `auth-provider-package-location`과 함께 작성 예정.

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter @apps/web-next test
pnpm --filter frontend-auth-react test
pnpm -r typecheck
```

**결과 요약**:
- ✅ `auth.test.ts` — 7 tests (CoreAuthSDK 계약 TypeScript + 런타임)
- ✅ `auth-react` 기존 20 tests 모두 통과 (prop 타입 변경 후에도)
- ✅ 39 packages typecheck clean

## 📦 Files Changed

### 🛠 Modified Files

- `packages/frontend/auth-react/src/provider.tsx`: sdk prop `AuthSDK` → `CoreAuthSDK`
- `apps/web-next/package.json`: `@repo/auth-contracts`, `@repo/frontend-auth-react`, `@repo/frontend-auth-testing` 추가
- `apps/web-next/src/components/providers.tsx`: `AuthProvider` 추가

### 🆕 New Files

- `apps/web-next/src/lib/auth.ts`: SDK 팩토리 (교체 지점)
- `apps/web-next/src/lib/auth.test.ts`: SDK swap 검증 7 tests

**Total**: 5 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (7 tests web-next + 20 tests auth-react)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과 (39 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-08.md`
- Walkthrough: `specs/spec-08-04-sdk-swap-validation/walkthrough.md`
