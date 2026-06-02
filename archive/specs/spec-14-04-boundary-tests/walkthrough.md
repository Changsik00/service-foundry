# Walkthrough: spec-14-04 — 비-auth 경계 테스트 보강

> 공용 인프라(utils/logger/http-client)의 미검증 경계·에러 경로에 characterization 테스트 추가. 소스 비변경.

## 📌 결정 기록
| 이슈 | 결정 | 이유 |
|---|---|---|
| 범위 | utils/backend-http-client/logger 의 식별 갭만 | frontend/cache/errors 는 이미 커버 |
| 방식 | characterization (소스 무변경) | 기존 동작 고정, 회귀 방지 |
| logger 응답헤더 테스트 | **드롭** | `requestIdMiddleware` 가 실제로 응답헤더를 설정 안 함(컨텍스트 주입만) — 없는 동작을 테스트하지 않음 |

### ADR 승격
- [x] 없음

## 🧪 검증 결과
- `@repo/utils` 19 (+3): `fromPromise` resolve→ok / reject→err / sync-throw→err
- `@repo/backend-http-client` 14 (+3): 404→`BAD_REQUEST`(비-retry) · POST 기본 no-retry · POST 명시 retries→retry
- `@repo/backend-logger` 10 (+3): generateRequestId 유일성 · middleware custom header · next 1회
- typecheck: 전부 clean. 통합: 본 PR `verify` CI green.

## 🔍 발견 사항
- **frontend/http-client 가 backend 보다 커버 두터웠다** — 4xx/POST 정책이 frontend엔 있고 backend엔 없던 비대칭을 해소.
- `requestIdMiddleware` 는 **응답 헤더를 echo 하지 않는다**(컨텍스트 주입만). 분산추적 시 응답에 request-id 를 돌려주고 싶다면 별도 enhancement(후속 검토 여지) — 버그는 아님.
- coverage 도구 `@vitest/coverage-v8` 미설치 — 정량 측정 불가, 소스 대조로 갭 식별. 도구 도입은 후속.

## 🚧 이월 항목
- `@vitest/coverage-v8` 도입 + CI coverage 게이트(원하면).
- requestIdMiddleware 응답 헤더 echo(선택적 enhancement).

## 🔗 관련
- phase-14 성공 기준 3.

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-31 |
| 커밋 | test 3 + ship 1 |
