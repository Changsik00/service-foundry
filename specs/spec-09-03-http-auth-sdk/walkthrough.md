# Walkthrough: spec-09-03

## 📌 결정 기록

| # | 이슈 | 최초 선택 | 최종 결정 | 번복 이유 |
|---|---|---|---|---|
| 1 | 구현 위치 | `packages/frontend/auth-http` (별도 패키지) | `apps/web-next/src/lib/` (인라인) | `auth-firebase`/`auth-supabase`는 여러 앱에서 재사용 가능하지만, 이 구현은 NestJS 백엔드에 묶인 앱 전용. 별도 패키지는 `frontend-http-client`와 혼동 유발. ADR-0018 기록. |
| 2 | HTTP 구현 도구 | raw `fetch()` 직접 사용 | `@repo/frontend-http-client` 사용 | 프로젝트에 이미 `createHttpClient`가 있음 — raw fetch는 http-client가 이미 처리하는 에러 핸들링·헤더 등을 중복 구현하게 됨. |
| 3 | 레이어 분리 | 단일 파일 (`auth-sdk.ts`) | `auth-api.ts` + `auth-sdk.ts` 2 레이어 | SDK가 endpoint 경로·HTTP 메서드·payload 구조를 직접 알면 관심사 혼재. Layer 2(API 계약)와 Layer 3(비즈니스 매핑) 분리로 각 레이어가 단일 책임. |
| 4 | 유틸 naming | `tryCall` | `tryRequest` → `fromPromise` | "call"은 RPC 연상. "request"가 HTTP 맥락에 맞지만 함수 자체는 HTTP와 무관 — Promise→Result 변환기이므로 `fromPromise`가 가장 정확. |
| 5 | 유틸 위치 | `@repo/frontend-http-client` 내부 | `@repo/utils` | `fromPromise`는 HTTP 전용 유틸이 아님 — Feature Envy. `@repo/utils`에 ADR-0008 `Result<T>` 패턴 확장으로 배치. |
| 6 | 파일명·함수명 | `http-auth-sdk.ts` / `createHttpAuthSDK` | `auth-sdk.ts` / `createAuthSDK` | "http"는 구현 세부사항 노출. Layer 3 이름은 역할(SDK) 중심이어야 함. |
| 7 | 에러 판단 방식 | `err.statusCode === 429` | `isCode(err, "RATE_LIMIT")` | statusCode 직접 비교는 에러 타입 미검증 + 매직 넘버. `@repo/errors`의 `isCode()`가 코드 기반 판단으로 더 안전하고 의미적. |
| 8 | `getCurrentUser()` 구현 | 네트워크 호출 (GET /auth/me) | in-memory 반환 | `AuthProvider`가 마운트될 때마다 호출 — 네트워크 불필요. 새로고침 시 null → `refresh()`로 복구. |
| 9 | 테스트 mock 방법 | `vi.stubGlobal('fetch', ...)` | `vi.mock` auto-mock | `fromPromise`를 `@repo/utils`로 이동 후 `vi.mock("@repo/frontend-http-client")` auto-mock만으로 충분. factory mock 형태 불필요. |
| 10 | `RequestInit.body` 할당 | `body: undefined` 직접 포함 | `if (body !== undefined) init.body = ...` | `exactOptionalPropertyTypes: true` — undefined 명시 할당 시 타입 에러. |

## 🔄 주요 이슈 & 수정 이력

### PR #59 → #60 전환 (구현 위치 번복)

- **배경**: spec 계획 단계에서 `packages/frontend/auth-http` 별도 패키지로 설계.
- **PR #59**: 패키지 분리 구현 완료 후 PR 생성.
- **문제**: `frontend-http-client`와 이름 혼동 — 두 패키지의 역할 경계가 모호해짐.
- **결정**: PR #59 닫고, `apps/web-next/src/lib/` 인라인으로 전면 재작성. ADR-0018에 근거 기록.

### raw fetch → frontend-http-client (HTTP 도구 번복)

- **배경**: 초기 구현에서 `fetch()` 직접 사용.
- **문제**: 프로젝트에 이미 `createHttpClient`가 있고, 에러 핸들링·헤더 등을 중복 구현하게 됨.
- **결정**: `@repo/frontend-http-client` 사용 + `credentials: "include"` 옵션 추가.

### tryCall → fromPromise (유틸 위치·명칭 번복)

- **1차**: `tryCall` 명명 → HTTP 맥락에 맞지 않음 → `tryRequest`로 변경.
- **2차**: `tryRequest`를 `@repo/frontend-http-client`에 배치 → Feature Envy 지적 (HTTP와 무관한 범용 유틸).
- **최종**: `fromPromise`로 명명 + `@repo/utils`로 이동. ADR-0008 `Result<T>` 패턴 확장으로 정착.
- **부수효과**: `vi.mock` factory 형태 불필요 → auto-mock으로 단순화.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트 (web-next)
- **명령**: `pnpm --filter @apps/web-next test`
- **결과**: ✅ 21 tests PASS (auth-sdk 10 + login-form 4 + lib 7)

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ 39 packages PASS

### 2. 수동 검증

1. **CoreAuthSDK 타입 계약 충족**: `pnpm -r typecheck` PASS ✅
2. **web-next auth.ts**: `createAuthSDK("http://localhost:3001")` 사용 ✅
3. **SDK 교체 검증**: `auth.ts` import 1줄 변경으로 Mock ↔ HTTP 교체 — typecheck PASS ✅

## 🚧 이월 항목

- 페이지 새로고침 시 `getCurrentUser()` = null — `AuthProvider` 마운트 시 `refresh()` 자동 호출 패턴 필요 (phase-10 이후).
- spec-09-04 (admin-scaffold) — phase-09에서 명시적으로 이월 결정. phase-10 진입 시 재검토.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 ~ 2026-05-23 |
| **PR** | #60 (spec-09-03-http-auth-sdk) |
| **최종 commit** | (ship commit) |
