# Walkthrough: spec-08-04

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| AuthProvider prop 타입 | `AuthSDK` 유지 / `CoreAuthSDK`으로 축소 | `CoreAuthSDK`으로 축소 | `provider.tsx`는 Core 5 메서드만 사용. MFA/Passkey 훅은 자체 파라미터 사용 — breaking 없음 |
| web-next 기본 SDK | `createMockAuthSDK()` / 실제 Firebase config | `createMockAuthSDK()` | 실제 Provider config 불필요 — TypeScript 타입 검증이 swap 증명의 핵심 |
| `@repo/auth-contracts` 의존성 | test에서 타입 import / 의존성 추가 | 의존성 추가 | `auth.test.ts`에서 `CoreAuthSDK` 타입 직접 참조. 앱에서 contracts 직접 의존은 정상 패턴 |
| swap 증명 방식 | 런타임 테스트 / TypeScript 컴파일 검증 | 양쪽 모두 | `const sdk: CoreAuthSDK = createMockAuthSDK()` — 컴파일 실패 시 TypeScript가 swap 불가 알림 + 런타임 7 테스트 |

- [x] ADR 후보: `auth-provider-sdk-prop-contract` (type: convention) — `AuthProvider`는 `CoreAuthSDK`만 요구. MFA/Passkey는 별도 훅 param. phase-08 완료 시 작성.

## 💬 사용자 협의

- **주제**: AuthProvider prop 타입 축소 방향
  - **합의**: `CoreAuthSDK`으로 축소. MFA/Passkey 훅은 자체 파라미터 사용으로 breaking 없음 확인.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 (web-next)
- **명령**: `pnpm --filter @apps/web-next test`
- **결과**: ✅ Passed (7 tests)

#### auth-react 기존 테스트
- **명령**: `pnpm --filter frontend-auth-react test`
- **결과**: ✅ Passed (20 tests) — prop 타입 변경 후에도 기존 테스트 전부 통과

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (39 packages)

### 2. 수동 검증

1. **TypeScript swap 증명**: `auth.test.ts`의 `const sdk: CoreAuthSDK = createMockAuthSDK()` 컴파일 통과 → Mock/Firebase/Supabase SDK 모두 동일 계약 충족 확인
2. **AuthProvider 연결**: `providers.tsx`에 `AuthProvider` 추가 후 typecheck 통과

## 🔍 발견 사항

- `AuthProvider` prop 타입을 `CoreAuthSDK`로 줄이는 것이 spec-08-01~03의 핵심 설계 결정을 완성시킴 — spec 순서상 마지막 spec(08-04)에서 발견되었으나, 이미 처음부터 올바른 설계였음
- `@repo/auth-contracts` 의존성: web-next의 `auth.test.ts`에서 `CoreAuthSDK` 타입을 직접 참조 — app이 contracts 패키지에 의존하는 것은 정상 패턴

## 🚧 이월 항목

- ADR `auth-provider-sdk-prop-contract` + `auth-provider-package-location` 작성 — phase-08 완료 시 함께
- 실제 Firebase/Supabase config 연동 (API 키, 환경변수) — phase-09 또는 별도 spec
- 로그인 UI 페이지 — phase-09 이후

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
