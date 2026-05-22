# Walkthrough: spec-09-03

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `getCurrentUser()` 구현 | 네트워크 호출 (GET /auth/me) / in-memory 반환 | in-memory 반환 | `AuthProvider`가 마운트될 때마다 호출 — 매번 네트워크 불필요. 새로고침 시 null → `refresh()`로 복구하는 패턴. |
| fetch mock 방법 | msw / `vi.stubGlobal('fetch', ...)` | `vi.stubGlobal` | msw 미설치. 단순 HTTP 래핑 테스트에는 fetch stub으로 충분. |
| `RequestInit.body` 할당 | `body: undefined` (undefined 포함) | `if (body !== undefined) init.body = ...` | `exactOptionalPropertyTypes: true` — undefined를 명시적으로 설정하면 타입 에러. |
| URL 구성 | `${baseUrl}/auth/signin` | `${baseUrl}/auth/signin` | baseUrl에 trailing slash 없음 가정. 단순 `/path` prefix. |

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 (auth-http)
- **명령**: `pnpm --filter @repo/frontend-auth-http test`
- **결과**: ✅ 9 tests PASS

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ 40 packages PASS (`@repo/frontend-auth-http` 신규 추가)

### 2. 수동 검증

1. **SDK swap 타입 안전성**: `CoreAuthSDK` 계약 충족 — typecheck PASS ✅
2. **web-next auth.ts 교체**: `createHttpAuthSDK("http://localhost:3001")` 사용 ✅

## 🔍 발견 사항

- `exactOptionalPropertyTypes: true` 설정으로 인해 `RequestInit`의 `body` 프로퍼티에 `undefined` 직접 할당 불가. `init` 객체를 분리한 후 조건부 할당으로 해결.
- `@repo/frontend-auth-http`를 `apps/web-next/package.json`에 추가해야 typecheck 통과. workspace 패키지 신규 추가 시 `pnpm install` 필수.
- NestJS signIn 응답의 `mfa_required` 경로는 stub 구현 — `challenge` 필드에 빈 값. MFA 완성은 phase-10 이후.

## 🚧 이월 항목

- accessToken 메모리 저장 — 현재는 signIn/signUp 후 user만 저장, accessToken은 미활용. GET /auth/me 호출 시 필요할 때 추가.
- 페이지 새로고침 시 `getCurrentUser()` = null — `AuthProvider`에서 마운트 시 `refresh()` 호출하는 패턴 필요 (spec-10 이후).

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
