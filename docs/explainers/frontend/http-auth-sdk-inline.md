---
difficulty: 중
aliases: ["HTTP Auth SDK 인라인", "auth-api auth-sdk 2레이어", "NestJS REST CoreAuthSDK"]
tags: [service-foundry, explainer, frontend, auth, http]
---

# HTTP Auth SDK 인라인 — auth-api.ts + auth-sdk.ts 2-레이어 구조

> **대상**: NestJS REST API를 CoreAuthSDK 인터페이스로 연결하는 방식을 이해하려는 개발자
> **연관 문서**: [[reference/apps/web-next]] · [[frontend-http-client-ky-wrapper]] · [[adr/0018-auth-provider-package-location]]

## 왜 필요한가

Firebase/Supabase SDK는 여러 앱에서 재사용 가능하지만, NestJS 백엔드를 타겟으로 하는 HTTP 인증 구현은 해당 앱의 엔드포인트 스키마에 완전히 묶여 있다. ADR-0018에 따라 별도 패키지 대신 `apps/web-next/src/lib/`에 인라인으로 배치한다.

2-레이어 분리는 관심사 혼재를 방지한다:
- **Layer 2 (auth-api.ts)**: HTTP 메서드·경로·payload 포맷을 여기서만 관리
- **Layer 3 (auth-sdk.ts)**: HTTP 응답을 `AuthResult` / `Session` 타입으로 변환하는 비즈니스 매핑

## 어떻게 동작하나

```mermaid
flowchart LR
    AP["AuthProvider<br/>CoreAuthSDK 소비"]
    SDK["createAuthSDK(baseUrl)<br/>auth-sdk.ts"]
    API["createAuthApi(http)<br/>auth-api.ts"]
    HC["createHttpClient<br/>@repo/frontend-http-client"]
    NS["NestJS API<br/>/auth/signin 등"]

    AP -->|signIn(input)| SDK
    SDK -->|fromPromise(api.signIn)| API
    API -->|http.post('auth/signin', ...)| HC
    HC -->|fetch + zod| NS
    NS -->|200 JSON| HC
    HC -->|SignInResponse| API
    API -->|AuthResult| SDK
    SDK -->|storeAndSucceed(user) 또는 failure| AP

    subgraph authapi["auth-api.ts"]
        API
        HC
    end

    subgraph authsdk["auth-sdk.ts"]
        SDK
    end
```

### fromPromise — Promise → Result 변환

`fromPromise(fn)` (`@repo/utils`)는 Promise를 `{ ok: true, value }` | `{ ok: false, error }` Result 타입으로 변환한다. SDK 레이어는 이를 사용해 예외 대신 타입 안전한 분기로 에러를 처리한다.

```ts
const r = await fromPromise(() => api.signIn(input));
if (!r.ok) return { success: false, reason: toReason(r.error) };
```

### 에러 판단 — isCode()

`toReason(error)` 는 `isCode(err, "RATE_LIMIT")`(`@repo/errors`)으로 에러 코드를 확인한다. statusCode 직접 비교 대신 코드 기반 판단으로 매직 넘버를 제거한다.

### getCurrentUser — in-memory

`getCurrentUser()`는 네트워크 호출 없이 모듈 스코프의 `currentUser` 변수를 반환한다. 새로고침 시 null이 되며, `refresh()`를 호출해 서버에서 복구한다.

### mfa_required 분기

`signIn` 응답에 `{ status: "mfa_required" }` 가 포함되면 `AuthResult`의 `{ success: false, reason: "mfa_required", challenge: {...} }` 형태로 변환해 UI가 MFA 흐름으로 진입할 수 있게 한다.

## 용어 정리

| 용어 | 설명 |
|---|---|
| `createAuthApi(http)` | HTTP 계약 레이어 — endpoint 경로/메서드/zod 스키마 정의 |
| `buildAuthApi(baseUrl)` | `createHttpClient` 생성 + `createAuthApi` 조합 헬퍼 |
| `createAuthSDK(baseUrl)` | `CoreAuthSDK` 구현 반환 — 비즈니스 매핑 레이어 |
| `fromPromise(fn)` | `@repo/utils` — Promise → Result 변환 유틸리티 |
| `isCode(err, code)` | `@repo/errors` — AppError 코드 기반 판단 |
| `credentials: "include"` | cross-origin cookie(세션 쿠키) 전송을 위한 fetch 옵션 |

## 동작/테스트 방법

> 🧪 **테스트**: `pnpm --filter @apps/web-next test` — `auth-sdk.test.ts` 10개 (signIn 성공/실패/mfa_required, signUp, signOut, getCurrentUser, refresh 성공/실패). `vi.mock("@repo/frontend-http-client")` auto-mock으로 HTTP 레이어를 대체한다.

> 🧪 **SDK 교체 검증**: `apps/web-next/src/lib/auth.ts`의 import를 `createMockAuthSDK` ↔ `createAuthSDK`로 교체 후 `pnpm -r typecheck` — `CoreAuthSDK` 타입 충족 여부를 컴파일 수준에서 확인.

## 마치며

2-레이어 분리로 엔드포인트 경로가 바뀌어도 `auth-api.ts`만 수정하면 되고, 응답 매핑 로직이 바뀌어도 `auth-sdk.ts`만 수정하면 된다. 인라인 배치(ADR-0018)는 앱 전용 구현이 다른 `frontend-*` 패키지와 혼동되지 않도록 한다.

## 연결된 개념

- [[frontend-http-client-ky-wrapper]] — auth-api.ts가 기반으로 사용하는 HTTP 클라이언트
- [[auth-react-provider-sdk-contract]] — CoreAuthSDK를 소비하는 AuthProvider
- [[auth-sdk-provider-adapters]] — 동일 CoreAuthSDK를 구현하는 Firebase/Supabase 어댑터
- [[login-ui-form]] — createAuthSDK를 통해 백엔드와 연결되는 LoginForm
- [[adr/0018-auth-provider-package-location]] — 인라인 배치 결정 근거

> 소스: spec-09-03 walkthrough · `apps/web-next/src/lib/auth-api.ts` · `apps/web-next/src/lib/auth-sdk.ts`
