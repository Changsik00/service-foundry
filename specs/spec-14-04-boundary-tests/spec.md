# spec-14-04: 비-auth 패키지 경계 테스트 보강

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-04` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-04-boundary-tests` |
| **상태** | Planning |
| **타입** | Feature (test hardening) |
| **Integration Test Required** | no |
| **작성일** | 2026-05-31 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
auth 패키지군은 테스트가 두텁지만, 공용 인프라(utils/logger/http-client)의 **경계·에러 경로** 일부가 미검증이다. (coverage 도구 `@vitest/coverage-v8` 미설치라 정량 미측정 — 소스 대비 테스트 대조로 갭 식별.)

### 문제점 (식별된 갭)
- **`@repo/utils` `fromPromise`**: export 됐으나 **테스트 0**. resolve→ok / reject→err 분기 미검증.
- **`@repo/backend-http-client`**: 4xx → `AppError(BAD_REQUEST)` 분기(`index.ts:99`) 미테스트(5xx UPSTREAM 만 있음). POST 기본 no-retry / 명시 retry 정책도 미테스트 (frontend 엔 있음 — 비대칭).
- **`@repo/backend-logger`**: `generateRequestId` 직접 테스트 없음, `requestIdMiddleware` 의 **응답 헤더 설정 + next 호출** 미검증.

### 해결 방안 (요약)
식별된 경계·에러 경로에 **characterization 테스트** 추가(소스 변경 없음 원칙 — 버그 발견 시 별도 보고).

## 🎯 요구사항

### Functional Requirements
1. **utils**: `fromPromise` — resolve 시 `ok(value)`, reject 시 `err(error)`.
2. **backend/http-client**: 4xx(404 등) → `AppError(code BAD_REQUEST)` 비-retry; POST 기본 1회 / `retries` 명시 시 retry.
3. **logger**: `generateRequestId` 문자열·유일성; `requestIdMiddleware` 가 `X-Request-Id` 응답 헤더 설정 + `next()` 호출 + 컨텍스트 주입.

### Non-Functional Requirements
1. **소스 동작 비파괴** — 테스트만 추가. 기존 동작을 단언(characterization). 실패하면 버그 발견 → 보고 후 판단.

## 🚫 Out of Scope
- **frontend/http-client**: 이미 4xx/5xx/timeout/network/VALIDATION/POST retry 커버 — 추가 없음.
- coverage 도구 도입(`@vitest/coverage-v8`) — 별도(원하면 후속).
- cache/errors: 기존 커버 양호 — 제외.

## 📑 ADR 후보
- [ ] 없음

## 🔗 관련 문서 (Related)
- phase-14 성공 기준 3.

## ✅ Definition of Done
- [ ] utils fromPromise / backend-http-client 4xx·POST / logger 3종 테스트 추가, 전부 PASS
- [ ] 전체 단위 PASS + typecheck 0
- [ ] walkthrough / pr_description ship + push + PR + CI green
