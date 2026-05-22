# Walkthrough: spec-08-03

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 구현 인터페이스 | `CoreAuthSDK` / `AuthSDK` (full) | `AuthSDK` (full) | `AuthProvider`가 `sdk: AuthSDK` 요구 — CoreAuthSDK만으론 주입 불가 |
| MFA/Passkey 스텁 | `return null` / `throw Error` | `throw Error("not implemented in mock")` | 명시적 — 실수로 MFA 경로가 호출되면 즉시 실패 |
| 테스트 API 노출 | `vi.fn()` 기반 spy / 직접 상태 객체 | `_state` / `_calls` 직접 참조 | vitest 의존성 없이 순수 TypeScript — 어느 테스트 환경에서도 사용 가능 |
| `_reset()` 동작 | 초기 오버라이드 값 유지 / 완전 DEFAULT로 초기화 | 완전 DEFAULT 초기화 | `_reset()`은 "테스트 격리 재설정" 용도 — 매 테스트 `beforeEach`에서 호출 가능 |
| `tsconfig.json lib` | `["ES2023"]` / `["ES2023", "DOM"]` | `["ES2023", "DOM"]` | `@repo/utils`의 `setTimeout` 참조 — auth-firebase/supabase와 동일 패턴 |

## 💬 사용자 협의

- **주제**: mock 인터페이스 설계 (`AuthSDK` full vs `CoreAuthSDK`)
  - **합의**: `AuthProvider`가 `AuthSDK`를 요구 → full 구현 채택

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm --filter frontend-auth-testing test`
- **결과**: ✅ Passed (14 tests)
- **로그 요약**:
```
Test Files  1 passed (1)
Tests  14 passed (14)
```

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (39 packages)

### 2. 수동 검증

1. **signIn 성공 흐름**: `_state.signInResult = { success: true, ... }` 설정 → 호출 후 `_calls.signIn[0]` + `_state.currentUser` 업데이트 확인 → PASS
2. **signOut 후 null**: `createMockAuthSDK({ currentUser: TEST_USER })` → `signOut()` → `_state.currentUser === null` + `signOutCount === 1` → PASS
3. **_reset**: 여러 호출 후 `_reset()` → 모든 상태/카운터 0 → PASS

## 🔍 발견 사항

- `_reset()` 설계: `initial` override 값을 유지하면 복잡 — 완전 DEFAULT 초기화로 단순하게 유지. 테스트마다 새 SDK 인스턴스를 만들거나 `beforeEach`에서 `_reset()`으로 격리.
- `tsconfig.json lib: ["ES2023"]` → `setTimeout` not found — auth-firebase/supabase와 동일. 모든 frontend 패키지에 `DOM` lib가 필요한 것은 `@repo/utils`의 의존성 체인 때문.

## 🚧 이월 항목

- MFA/Passkey mock 제어 (예: `_state.mfaResult`) — 필요 시 별도 spec
- `auth-nestjs` 전용 테스팅 헬퍼 — phase-09 이후 고려

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
