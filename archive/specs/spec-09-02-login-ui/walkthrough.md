# Walkthrough: spec-09-02

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| form submit 트리거 | `fireEvent.submit(form)` | `fireEvent.click(button)` | `closest("form")!` non-null assertion biome 경고 회피 + 더 사용자 관점에 가까운 시뮬레이션 |
| TDD Red 스텁 | 테스트 파일만 커밋 | 빈 스텁 컴포넌트 함께 커밋 | typecheck pre-commit hook이 미존재 모듈로 차단 — 빈 `<div />` 스텁으로 typecheck 통과 + 테스트 4개 Fail 유지 |
| signInResult 타입 | `MockAuthState['signInResult']` 직접 사용 | `as never` cast | `createMockAuthSDK` 파라미터가 `Partial<MockAuthState>` — `{ success: false, reason: ... }` 는 `AuthResult` 여서 narrowing 불편, cast 사용 |

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm --filter @apps/web-next test`
- **결과**: ✅ 11 tests PASS (LoginForm 4 + 기존 7)

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ 39 packages PASS

### 2. 수동 검증

1. **`/login` 라우트 렌더**: localhost:2027/login → HTTP 200 ✅
2. **LoginForm 요소 확인**: 이메일 입력, 비밀번호 입력, 로그인 버튼 렌더 ✅
3. **Mock SDK 기본 동작**: signIn 실패 → "이메일 또는 비밀번호가 올바르지 않습니다." (테스트 검증) ✅
4. **성공 시 리다이렉트**: router.push('/') 호출 (테스트 검증) ✅

## 🔍 발견 사항

- `@testing-library/user-event` 미설치 — `fireEvent` 사용으로 대체. 폼 submit은 버튼 click 이벤트로 트리거.
- biome lint: `noNonNullAssertion` rule이 `.closest("form")!` 차단 → 버튼 클릭 방식으로 전환.
- TDD Red 단계에서 typecheck hook 이 미구현 모듈 참조를 차단 → 빈 스텁을 함께 커밋하는 패턴으로 해결 (이후 Task 2에서 구현으로 교체).

## 🚧 이월 항목

- 없음

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
