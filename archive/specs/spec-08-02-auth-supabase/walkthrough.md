# Walkthrough: spec-08-02

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Supabase 에러 감지 방식 | `instanceof AuthApiError` / `__isAuthError` 플래그 | `__isAuthError === true` 체크 | Supabase v2: `AuthError.__isAuthError = true` 가 공개 API. instanceof는 패키지 경계에서 깨질 수 있음 |
| `expires_at` undefined 처리 | TS 단언(`!`) / fallback ISO | fallback (1시간 후) | Supabase 타입상 `number \| undefined` — 단언 대신 안전한 fallback |
| `email` undefined 처리 | `string \| null` 가정 / `string \| undefined` 수용 | `email?: string \| null` — `?? ""` fallback | Supabase User 타입이 `email?: string` — toUser에서 흡수 |
| `supabase.rls` 노출 방식 | 전용 getter 메서드 / 프로퍼티 직접 노출 | 프로퍼티 (`rls: client`) | 아키텍처 노트 예시 `auth.supabase.rls` 그대로 반영. 심플 + 직관적 |
| 에러 메시지 매칭 | 문자열 exact match / status 코드 | message exact match | Supabase v2 error message는 사실상 공개 계약. status 코드는 동일 메시지가 여럿일 수 있음 |

- [ ] ADR `auth-provider-package-location` — spec-08-01 walkthrough에서 후보 등록. phase-08 완료 시 작성.

## 💬 사용자 협의

- **주제**: spec-08-02 계획 및 SupabaseExtensions 설계
  - **합의**: `supabase.rls` = `SupabaseClient` 직접 노출. RLS 쿼리는 앱 레이어 책임.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm --filter frontend-auth-supabase test`
- **결과**: ✅ Passed (19 tests in 2 test files)
- **로그 요약**:
```
Test Files  2 passed (2)
Tests  19 passed (19)
```

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (38 packages)

### 2. 수동 검증

1. **Action**: `pnpm --filter frontend-auth-supabase exec vitest run src/normalize.test.ts`
   - **Result**: 8 tests — AuthApiError 메시지별 정규화 모두 통과

2. **Action**: `pnpm --filter frontend-auth-supabase exec vitest run src/index.test.ts`
   - **Result**: 11 tests — signIn/signUp/signOut/getCurrentUser/refresh/supabase.rls 전 경로 통과

## 🔍 발견 사항

- Supabase `signUp` 반환의 `user`/`session`이 TypeScript 타입상 nullable — non-null assertion(`!`) 대신 biome가 optional chain으로 교체 제안. `signUp` 성공 경로에서는 항상 존재하므로 실제 런타임 이슈 없음.
- Supabase `User.email`은 `string | undefined` (not `string | null`) — `toUser` 함수 시그니처를 `email?: string | null`로 수정하여 TypeScript 통과.
- `session.expires_at`은 `number | undefined` — 1시간 fallback으로 처리.

## 🚧 이월 항목

- `supabase-admin` 서버 사이드 래퍼 (`service_role` key 기반) — 별도 spec 또는 phase-09 고려
- ADR `auth-provider-package-location` 작성 — phase-08 완료 시점
- Magic Link / OAuth 로그인 — Out of Scope (이 spec)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
