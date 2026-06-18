---
id: ADR-0027
type: convention
date: 2026-06-18
status: accepted
---

# ADR-0027: 에러 처리 레이어링 (HTTP 경계 ↔ 도메인)

> **Note**: 본 ADR 의 inline backtick 경로는 `sdd status` stale 검사 대상.

## 📚 Context

레포는 두 에러 표현을 동시에 쓴다 — apps/api 는 HTTP 에러에 **NestJS 예외**(`UnauthorizedException`/`BadRequestException` 등, 실측 183곳), 도메인 패키지(`packages/backend/*`)는 **`Result` + `AppError`**(ADR-0008/0009/0020, 22 파일). 그러나 apps/api 에 **`AppError` → HTTP 변환 필터가 없어**, 도메인 패키지가 던진 `AppError`(의미상 `statusCode` 보유)가 컨트롤러로 전파되면 NestJS 기본 필터에 의해 **일괄 500** 으로 뭉개졌다. 실측: `getProvider(unknownName)` → `AppError(..., statusCode: 400)` → 컨트롤러 → 500. 레이어 간 에러 표현의 경계·변환 지점이 암묵적이었다.

## 🎯 Decision

에러 처리를 레이어로 명문화한다:

1. **HTTP 경계(controller·guard·interceptor)에서 발생한 에러**는 **NestJS 예외**로 던진다 (현행 유지).
2. **도메인·framework-agnostic 패키지(`packages/backend/*`, `packages/shared/*`)**는 **`Result` + `AppError`** 로 표현한다 (NestJS 의존 금지, ADR-0008/0009).
3. **경계로 전파된 `AppError`** 는 apps/api 의 **전역 `AppErrorFilter`**(`@Catch(AppError)`, `apps/api/src/infra/app-error.filter.ts`)가 `err.statusCode` + `err.toJSON()` 으로 HTTP 응답에 변환한다. 등록 SoT 는 `apps/api/src/app.setup.ts` 의 `configureApp`.
4. **예외(의도적 raw throw 유지)**: 프로세스 기동 fail-fast(`apps/api/src/settings.ts` 설정 검증, `apps/api/src/infra/superuser-guard.provider.ts`)와 "절대 발생 안 해야 하는" invariant 가드(`insert returned no row`)는 HTTP 의미가 없으므로 NestJS 예외/AppError 로 바꾸지 않는다.

## 📊 Consequences

- **긍정**: 도메인 `AppError` 가 의미상 상태코드(400/404/409…)로 정확히 노출됨 — 잠재 500 버그(예: 잘못된 OAuth provider) 일괄 수정. 도메인 코드는 NestJS 비의존 유지(`AppError` 만 던지면 됨). 에러 HTTP 노출 단일 지점.
- **부정**: 전역 필터 도입은 **동작 변경** — 기존에 500 으로 나가던 전파 AppError 가 statusCode 로 바뀜(회귀 점검 필요). 두 표현(NestJS 예외 + AppError)이 공존하므로 "경계 발생 vs 전파" 구분을 작성자가 인지해야 함.
- **중립**: `AppError.toJSON()` 이 wire 응답 형태(`{ code, message, statusCode, details? }`)가 됨 — `cause` 는 제외(보안).

## 🔀 Alternatives

- **컨트롤러마다 AppError catch → NestJS 예외 재던지기**: 명시적이나 183곳+ 반복·누락 위험. 비채택.
- **도메인 패키지가 NestJS 예외를 던지기**: framework-agnostic 원칙(ADR-0015) 위반. 비채택.
- **AppError 필터 없이 현행 유지**: 전파 AppError 가 계속 500 — 잠재 버그 방치. 비채택.

## 📌 Status

Accepted (2026-06-18, spec-23-04 머지 시점). 첫 적용: `apps/api/src/infra/app-error.filter.ts` + `configureApp`.

## 🔗 Related

- ADR-0008 (Result), ADR-0009 (AppError 설계), ADR-0020 (에러 처리 규약), ADR-0015 (framework adapter 경계)
- spec-23-04
