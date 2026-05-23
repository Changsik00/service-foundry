# spec-09-03: HTTP auth SDK (web-next 인라인)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-09-03` |
| **Phase** | `phase-09` |
| **Branch** | `spec-09-03-http-auth-sdk` |
| **상태** | Merged |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- `apps/web-next/src/lib/auth.ts`는 `createMockAuthSDK()`를 사용 중
- LoginForm이 구현되어 있지만 실제 NestJS 백엔드와 연결되지 않음
- NestJS `POST /auth/signin` 등 auth REST API가 phase-06에서 구현됨
- `CoreAuthSDK` 인터페이스 (5개 메서드)가 ADR-0006으로 정의됨

### 문제점

Mock SDK로는 실제 로그인 플로우 검증 불가. HTTP fetch 기반의 `CoreAuthSDK` 구현체가 없어 web-next가 NestJS 백엔드와 통신할 수 없음.

### 해결 방안 (요약)

`apps/web-next/src/lib/` 에 `auth-api.ts` + `auth-sdk.ts` 를 추가하여 NestJS auth REST API를 `CoreAuthSDK` 계약으로 래핑한다. 별도 패키지 미생성 — NestJS 백엔드에 결합된 앱 전용 구현 (ADR-0018). web-next `src/lib/auth.ts`를 `createAuthSDK()`로 교체한다.

## 📊 레이어 구조

```
@repo/frontend-http-client   ← request/response/error (transport)
        ↓
auth-api.ts                  ← endpoint·HTTP메서드·payload·Zod schema (API contract)
        ↓
auth-sdk.ts                  ← createAuthSDK, AuthResult 매핑 (SDK)
        ↓
auth.ts                      ← 싱글턴 export (env var 기반 baseUrl)
```

## 🎯 요구사항

### Functional Requirements

1. `apps/web-next/src/lib/auth-api.ts` (Layer 2 — API 계약)
   - `createAuthApi(http: HttpClient): AuthApi` — endpoint·HTTP메서드·payload·Zod schema 정의
   - `buildAuthApi(baseUrl: string): AuthApi` — `createHttpClient` 연결
   - Zod schema 기반 runtime response validation (`schema` 옵션 활용)

2. `apps/web-next/src/lib/auth-sdk.ts` (Layer 3 — SDK)
   - `createAuthSDK(baseUrl: string): CoreAuthSDK` export
   - 5개 메서드 구현:
     - `signIn({ email, password })` → `POST {baseUrl}/auth/signin` → `AuthResult`
     - `signUp({ email, password })` → `POST {baseUrl}/auth/signup` → `AuthResult`
     - `signOut()` → `POST {baseUrl}/auth/signout`
     - `getCurrentUser()` → in-memory 저장된 user 반환 (초기: null)
     - `refresh()` → `POST {baseUrl}/auth/refresh` → `Session | null`
   - `fromPromise()` (@repo/utils) 활용으로 Result 패턴 적용
   - `isCode(err, "RATE_LIMIT")` (@repo/errors) 기반 에러 판단

3. `apps/web-next/src/lib/auth.ts` 교체
   - `createMockAuthSDK()` → `createAuthSDK(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:2026")`

### Non-Functional Requirements

1. `pnpm --filter @apps/web-next test` PASS (단위 테스트 포함)
2. `pnpm -r typecheck` PASS (39+ packages)

## 🚫 Out of Scope

- refresh token 저장/관리 (httpOnly cookie — 서버가 처리)
- MFA / Passkey 엔드포인트
- 토큰 자동 갱신 (인터셉터)
- GET /auth/me 네트워크 호출 (in-memory user로 충분)

## 📑 ADR

- ADR-0018: auth-provider-package-location — 별도 패키지 미생성 결정

## ✅ Definition of Done

- [x] `pnpm --filter @apps/web-next test` PASS (21 tests)
- [x] `pnpm -r typecheck` PASS (39 packages)
- [x] `apps/web-next/src/lib/auth.ts` → `createAuthSDK()` 사용 + 환경변수 baseUrl
- [x] `auth-api.ts` Zod schema validation 적용
- [x] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [x] `spec-09-03-http-auth-sdk` 브랜치 push 완료
- [x] 사용자 검토 요청 알림 완료
