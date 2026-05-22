# Walkthrough: spec-08-01

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `CoreAuthSDK` 위치 | `auth-contracts` 신규 export / 각 패키지 로컬 Pick | `auth-contracts`에 export | SSOT — 이후 auth-supabase, auth-testing이 동일 타입 참조 |
| 패키지 카테고리 | `packages/frontend/` / 루트 `packages/` | `packages/frontend/auth-firebase/` | ADR-0015 준수. 아키텍처 노트는 `packages/auth-firebase/`지만 firebase/auth 소비처가 프론트엔드 |
| FirebaseError 처리 | 모두 `AuthResult` 반환 / 일부 `AppError` throw | 혼합 — CONFLICT는 throw, 나머지는 AuthResult | signIn 실패(INVALID_CREDENTIALS, RATE_LIMITED, LOCKED)는 UI 분기용 → AuthResult. 이메일 중복(CONFLICT)은 signUp 로직 오류 → AppError |
| MFA/Passkey 메서드 | `AuthSDK` 전체 구현 + stub / `CoreAuthSDK`만 구현 | `CoreAuthSDK`만 구현 | Firebase SDK ≠ Custom Backend API. stub 대신 타입 수준에서 명시 |
| `firebase/auth` 테스트 | jsdom 환경 + 실제 firebase 모듈 / `vi.mock` 전체 교체 | `vi.mock('firebase/auth', ...)` | firebase/auth 내부가 브라우저 글로벌(indexedDB 등)에 의존 — node 환경에서 실제 로드 불가 |
| `AppErrorInput` 필드 | code만 / code + statusCode + message | code + statusCode + message 모두 필수 | `AppErrorInput.statusCode`가 required 필드임을 구현 중 발견 |

- [x] ADR 승격 대상 있음: `auth-provider-package-location` (type: convention) — Provider 패키지 위치 규칙이 auth-supabase, auth-testing에도 적용. 작성 여부는 phase-08 마무리 시 결정.

## 💬 사용자 협의

- **주제**: phase-08 scope 및 시작 방식
  - **합의**: spec 3개(auth-firebase, auth-supabase, auth-testing), base branch 모드, auth-firebase 먼저

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm --filter frontend-auth-firebase test`
- **결과**: ✅ Passed (20 tests in 2 test files)
- **로그 요약**:
```
Test Files  2 passed (2)
Tests  20 passed (20)
```

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (37 packages)

### 2. 수동 검증

1. **Action**: `pnpm --filter frontend-auth-firebase exec vitest run src/normalize.test.ts`
   - **Result**: 8 tests — FirebaseError 코드별 정규화 모두 통과

2. **Action**: `pnpm --filter frontend-auth-firebase exec vitest run src/index.test.ts`
   - **Result**: 12 tests — signIn/signUp/signOut/getCurrentUser/refresh/firebase.getIdTokenResult 전 경로 통과

## 🔍 발견 사항

- `AppErrorInput`은 `statusCode`도 required 필드 — `new AppError({ code: "CONFLICT" })`가 컴파일 에러. `statusCode: 409` 추가 필요.
- `packages/frontend/auth-firebase/tsconfig.json`에 `"lib": ["ES2023"]`만 지정 시 `@repo/utils`의 `setTimeout` 참조로 typecheck 실패 → `"DOM"` 추가로 해결.
- biome pre-commit hook이 import 정렬 1회 자동 수정 (index.ts, index.test.ts).

## 🚧 이월 항목

- `firebase-admin` 서버 사이드 래퍼 (`setCustomClaims`) — 별도 spec 또는 Phase 8 후반 고려
- Provider 패키지 위치 ADR 작성 — phase-08 완료 시점

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | 413c9c5 |
