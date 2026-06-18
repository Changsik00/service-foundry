# spec-16-03: web-next CSRF 403 자가복구

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-16-03` |
| **Phase** | `phase-16` |
| **Branch** | `spec-16-03-web-csrf-resilience` |
| **상태** | Planning |
| **타입** | Fix (프론트 견고화) |
| **Integration Test Required** | no (단위 — mock HttpClient) |
| **작성일** | 2026-06-02 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`apps/web-next/src/lib/auth-api.ts` 의 `createAuthApi` 는 보호된 POST(signin/signup/signout/refresh)에 캐시된 `csrfToken` 을 `X-Csrf-Token` 헤더로 동반하고, 응답의 새 토큰으로 `remember`(rotate)한다. csrf 토큰은 `ensureCsrf`(최초 1회 `GET /auth/csrf`)로 확보된다.

### 문제점
- **403 자가복구 부재** (phase-15 회고 W6): csrf 토큰이 만료/불일치(예: 서버 재시작으로 csrf_id↔token 불일치, 탭 장시간 방치)면 보호 POST 가 **403**(`AppError statusCode:403`)으로 throw 되고, 클라이언트는 재발급·재시도 없이 그대로 실패한다 → 사용자가 수동 새로고침해야 하는 UX 회귀.
- `frontend-http-client` 는 비-2xx 를 `AppError`(statusCode 포함)로 변환하므로, 403 을 식별해 1회 재발급+재시도하면 자가복구 가능.

### 해결 방안 (요약)
보호 POST 호출을 `withCsrfRetry` 로 감싼다: 403 이면 `fetchCsrf()`(csrf 재부트스트랩) 후 **1회만** 재시도(무한루프 가드 — 재시도는 recursion 없이 1회). signin/signup/signout/refresh 적용. mock HttpClient 단위 테스트로 "첫 403 → 재발급 → 재시도 성공" + "재시도도 403 이면 throw" 검증.

## 🎯 요구사항

### Functional Requirements
1. 보호 POST 가 403 응답 시 `fetchCsrf()` 로 토큰 재발급 후 **정확히 1회** 재시도.
2. 재시도도 403 이면 원래 에러 throw (무한루프 없음).
3. 403 이 아닌 에러(401/400/500 등)는 재시도 없이 즉시 throw (동작 불변).
4. 정상(2xx) 응답의 rotate(`remember`) 동작 불변.

### Non-Functional Requirements
1. 기존 signin/signup/signout/refresh 시그니처·반환 타입 불변.
2. 재시도 1회 한정 — 가드는 호출당 boolean 플래그(재귀 금지).

## 🚫 Out of Scope
- **web-next MFA/passkey 클라이언트 헤더 동반**: web-next 에 MFA/passkey 호출 메서드 자체가 없음(보일러플레이트 의도적 미배선, wiring audit §🟡). 메서드 추가 시 기존 `csrfOpts` 가 자동 헤더 동반하므로 별도 작업 불요 → Icebox.
- **web-vite / `packages/frontend/auth-*` SDK CSRF 헤더**: 해당 클라이언트는 CSRF 미사용 — 후속/Icebox.
- 토큰 만료 예측·선제 갱신 — 본 spec 은 반응형(403) 복구만.

## 📑 ADR 후보
- [x] 없음 (ADR-0021 클라이언트측 적용, 신규 결정 없음)

## 🔗 관련 문서 (Related)
- 관련 ADR: [[ADR-0021]]
- 관련: phase-15 회고 W6, `apps/web-next/src/lib/auth-api.ts`

## ✅ Definition of Done
- [ ] `withCsrfRetry` 로 보호 POST 403 자가복구 (1회 재시도 + 가드)
- [ ] mock HttpClient 단위 테스트 (403→재발급→성공 / 재시도도 403→throw / 비-403 즉시 throw)
- [ ] walkthrough/pr_description ship + push + PR (base: phase-16-security-hardening)
- [ ] 사용자 검토 알림
