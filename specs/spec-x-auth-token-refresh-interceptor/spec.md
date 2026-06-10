# spec-x: http-client 401 자동 refresh 인터셉터

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-auth-token-refresh-interceptor` |
| **Branch** | `spec-x-auth-token-refresh-interceptor` |
| **상태** | Planning |
| **타입** | Enhancement |
| **Integration Test Required** | no |
| **작성일** | 2026-06-10 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

`packages/frontend/http-client`의 `createHttpClient`는 ky 기반으로 retry/timeout 인프라를 갖추고 있으나,
401 Unauthorized 응답에 대한 처리가 없다. 401은 ky의 기본 retry 대상(5xx, 429 등)이 아니기 때문에
단순히 `AppError(statusCode: 401)`를 throw하고 끝낸다.

`AuthProvider`에 `withAuthRetry(fn)` 같은 수동 래핑 패턴을 붙이는 방법도 있으나,
레이어 책임 분리 원칙에 어긋난다 — HTTP transport 관심사(재시도)가 React 상태 레이어에 들어간다.

### 해결 방안

`createHttpClient`에 `onUnauthorized?: () => Promise<void>` 옵션을 추가한다.
ky의 `afterResponse` 훅에서 401을 감지하면 `onUnauthorized()`(통상 `sdk.refresh()`)를 호출하고
원래 요청을 1회 재시도한다. 앱은 http-client 생성 시 한 번만 설정하면 모든 API 호출에 자동 적용된다.

별도로, `AuthProvider`의 startup 시 `getCurrentUser()` 401 → refresh → 재조회 복구도 추가한다.
SDK가 내부적으로 http-client를 쓰는지 확실하지 않으므로 Provider 레이어에서도 안전하게 처리한다.

## 🎯 요구사항

### Functional Requirements

1. `createHttpClient({ onUnauthorized })` — 401 수신 시 `onUnauthorized()` 호출 후 1회 재시도
2. `onUnauthorized` 미제공 시 기존 동작 동일 (401 → AppError 즉시 throw)
3. `onUnauthorized` 실패(throw) 시 재시도 없이 AppError(statusCode: 401) 전파
4. 재시도 결과가 다시 401이어도 추가 retry 없음 (무한 루프 방지)
5. `AuthProvider` startup: `getCurrentUser()` 401 → `sdk.refresh()` → `getCurrentUser()` 재조회

### Non-Functional Requirements

1. http-client는 React / auth-sdk에 결합 없음 — 순수 콜백(`() => Promise<void>`)으로 주입
2. 기존 테스트 전체 PASS 유지

## 🚫 Out of Scope

- concurrent refresh queueing (동시 401이 여러 개 오면 refresh 여러 번 호출 가능 — 추후 개선)
- POST body 소진 후 재시도 (GET/멱등 요청 기준 — body clone 실패 시 graceful fallback으로 원래 401 전파)
- `AuthProvider`에서 refresh 실패 시 `user=null` 자동 전환 (앱이 401 AppError를 catch해서 처리)

## 📑 ADR 후보

- [ ] `http-client-auth-retry` — transport 레이어 1회 재시도 컨벤션 (type: convention)

## 🔗 관련 문서

- 관련 패키지: `packages/frontend/http-client`
- 관련 패키지: `packages/frontend/auth-react`

## ✅ Definition of Done

- [ ] `pnpm --filter @repo/frontend-http-client test` → onUnauthorized 케이스 4개 PASS
- [ ] `pnpm --filter @repo/frontend-auth-react test` → startup 401 복구 케이스 PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] walkthrough.md / pr_description.md 작성
