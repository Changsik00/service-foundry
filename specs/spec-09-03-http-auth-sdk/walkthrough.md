# Walkthrough: spec-09-03

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 구현 위치 | `packages/frontend/auth-http` (별도 패키지) | `apps/web-next/src/lib/` (인라인) | `auth-firebase`/`auth-supabase`는 여러 앱에서 재사용 가능하지만, 이 구현은 NestJS 백엔드에 묶인 앱 전용. 별도 패키지는 `frontend-http-client`와 혼동 유발. |
| `getCurrentUser()` 구현 | 네트워크 호출 (GET /auth/me) / in-memory 반환 | in-memory 반환 | `AuthProvider`가 마운트될 때마다 호출 — 네트워크 불필요. 새로고침 시 null → `refresh()`로 복구. |
| fetch mock 방법 | msw / `vi.stubGlobal('fetch', ...)` | `vi.stubGlobal` | msw 미설치. 단순 HTTP 래핑 테스트에는 fetch stub으로 충분. |
| `RequestInit.body` 할당 | `body: undefined` 직접 포함 | `if (body !== undefined) init.body = ...` | `exactOptionalPropertyTypes: true` — undefined 명시 할당 시 타입 에러. |

## 🔄 이슈 & 수정

- **초기 PR #59 (패키지 분리)**: `packages/frontend/auth-http`로 구현 후 `frontend-http-client`와 혼동 지적 → PR 닫고 인라인으로 전환.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 (web-next)
- **명령**: `pnpm --filter @apps/web-next test`
- **결과**: ✅ 20 tests PASS (http-auth-sdk 9 + login-form 4 + lib 7)

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ 39 packages PASS

### 2. 수동 검증

1. **CoreAuthSDK 타입 계약 충족**: typecheck PASS ✅
2. **web-next auth.ts**: `createHttpAuthSDK("http://localhost:3001")` 사용 ✅

## 🚧 이월 항목

- 페이지 새로고침 시 `getCurrentUser()` = null — `AuthProvider` 마운트 시 `refresh()` 자동 호출 패턴 필요 (phase-10 이후).

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
