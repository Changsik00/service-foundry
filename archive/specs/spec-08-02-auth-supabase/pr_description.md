# feat(spec-08-02): auth-supabase — Supabase AuthSDK 래퍼

## 📋 Summary

### 배경 및 목적

spec-08-01에서 확립한 `CoreAuthSDK` 계약(ADR-0006 §"Consistent Wrapped SDK")을 Supabase Client SDK로 구현합니다. `auth-react`의 `AuthProvider`에 Supabase 기반 SDK를 그대로 주입 가능 — Firebase 어댑터와 동일한 교체 패턴.

### 주요 변경 사항

- [x] `@repo/frontend-auth-supabase` 패키지 신규 생성 — `createSupabaseAuthSDK(config)` 팩토리
- [x] `AuthApiError` → `AuthResult` / `AppError` 정규화 (`normalize.ts`) — message 매칭 방식
- [x] `SupabaseExtensions.rls` — 인증 세션 적용된 `SupabaseClient` 노출 (RLS 쿼리용)
- [x] `@supabase/supabase-js: ^2.0.0` pnpm-workspace.yaml catalog 등록

### Phase 컨텍스트

- **Phase**: `phase-08`
- **본 SPEC의 역할**: phase-08 두 번째 spec — Provider Adapter 패턴 두 번째 실증 (Supabase). spec-08-01 Firebase와 동일 `CoreAuthSDK` 계약 기반.

## 🎯 Key Review Points

1. **`AuthApiError` 감지**: `__isAuthError === true` 플래그 체크 — `instanceof` 대신 사용. 패키지 경계에서 instanceof가 깨지는 엣지 케이스 방지.
2. **에러 메시지 매칭**: Supabase v2 error message는 공개 계약 수준. `"Invalid login credentials"`, `"User already registered"` 등 exact match.
3. **`supabase.rls`**: `SupabaseClient` 인스턴스 직접 노출 — RLS-aware DB 쿼리는 앱 레이어 책임. SDK는 인증된 클라이언트만 제공.
4. **패키지 위치**: `packages/frontend/auth-supabase/` — spec-08-01 Firebase와 동일 카테고리 (ADR-0015).

## 🧪 Verification

### 자동 테스트

```bash
pnpm --filter frontend-auth-supabase test
```

**결과 요약**:
- ✅ `normalizeSupabaseAuthError` — 8 tests (에러 메시지별 정규화 전 경로)
- ✅ `createSupabaseAuthSDK` — 11 tests (signIn/signUp/signOut/getCurrentUser/refresh/supabase.rls)
- **전체**: 19 tests passed / 38 packages typecheck clean

## 📦 Files Changed

### 🆕 New Files

- `packages/frontend/auth-supabase/package.json`: `@repo/frontend-auth-supabase` 패키지 설정
- `packages/frontend/auth-supabase/tsconfig.json`: TypeScript 설정 (ES2023 + DOM)
- `packages/frontend/auth-supabase/vitest.config.ts`: vitest node preset
- `packages/frontend/auth-supabase/src/normalize.ts`: AuthApiError 정규화 로직
- `packages/frontend/auth-supabase/src/normalize.test.ts`: 정규화 단위 테스트 8개
- `packages/frontend/auth-supabase/src/index.ts`: `createSupabaseAuthSDK` 구현체
- `packages/frontend/auth-supabase/src/index.test.ts`: 구현체 단위 테스트 11개

### 🛠 Modified Files

- `pnpm-workspace.yaml`: `@supabase/supabase-js: "^2.0.0"` catalog 추가
- `pnpm-lock.yaml`: lockfile 갱신

**Total**: 9 files changed

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (19 tests)
- [x] `walkthrough.md` ship commit 완료
- [x] `pr_description.md` ship commit 완료
- [x] lint / type check 통과 (38 packages)
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-08.md`
- Walkthrough: `specs/spec-08-02-auth-supabase/walkthrough.md`
