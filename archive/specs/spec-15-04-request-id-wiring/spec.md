# spec-15-04: request-id 미들웨어 배선

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-15-04` |
| **Phase** | `phase-15` |
| **Branch** | `spec-15-04-request-id-wiring` |
| **상태** | Planning |
| **타입** | Feature (관측성 배선) |
| **Integration Test Required** | yes (apps/api e2e — reqId 응답 헤더) |
| **작성일** | 2026-06-01 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
`@repo/backend-logger` 에 `requestIdMiddleware`(AsyncLocalStorage 기반 reqId 주입)·`getCurrentRequestId` 가 구현돼 있고, `@repo/nestjs-logger` 의 `PinoLoggerService` 는 매 로그마다 `getCurrentRequestId()` 를 읽어 child logger 에 `reqId` 를 바인딩한다(단위 테스트 통과). http-client 도 `getCurrentRequestId()` 로 `X-Request-Id` 를 전파한다. 그러나 `apps/api/main.ts` 가 **`requestIdMiddleware` 를 적용하지 않아** ALS 컨텍스트가 비어 모든 로그 `reqId` 가 `undefined`, 아웃바운드 전파도 무효다 (`wiring-audit §D`).

### 문제점
- phase-15 성공기준4 미충족: "main.ts 가 requestIdMiddleware 적용, 로그에 reqId 채워짐(통합 테스트로 비-undefined)".
- 관측성 부재 — 요청 단위 추적 불가.

### 해결 방안 (요약)
`main.ts` 부트스트랩 가장 앞단(cookieParser 다음, applySecurity 전)에 `requestIdMiddleware()` 를 적용한다. 검증 가능성·표준 추적을 위해 미들웨어가 응답 헤더 `x-request-id` 를 싣도록 보강하고(framework-agnostic `MinimalResponse`), e2e 로 생성·에코를 검증한다. e2e 테스트 부트스트랩에도 동일 적용.

## 🎯 요구사항

### Functional Requirements
1. `main.ts` 가 `requestIdMiddleware()` 를 적용 — ALS reqId 컨텍스트가 모든 요청 라이프사이클을 커버.
2. 미들웨어가 응답 헤더 `x-request-id` 설정: 수신 헤더(`X-Request-Id`) 있으면 재사용, 없으면 신규 UUID. (framework-agnostic — `setHeader` 만 의존.)
3. 로그에 `reqId` 가 채워짐 — `PinoLoggerService` 가 ALS 의 reqId 를 child binding (기존 동작, 본 배선으로 비-undefined 가 됨).
4. e2e: 요청 → 응답 `x-request-id` 가 유효 UUID(생성); 클라이언트가 `X-Request-Id` 제공 시 동일 값 에코.

### Non-Functional Requirements
1. 기존 미들웨어 순서·동작 불변(reqId 미들웨어만 선행 추가). CSRF(15-02)·rate-limit(15-03) 공존.
2. reqId 미들웨어는 가장 앞단 — 이후 모든 핸들러/로그/아웃바운드가 컨텍스트 공유.
3. 미들웨어 보강은 순수 추가(응답 헤더) — 기존 ALS 동작 회귀 없음, 패키지 단위 테스트 갱신.

## 🚫 Out of Scope
- reqId 를 도메인 응답 body 에 싣기 — 헤더만.
- 분산 트레이싱(traceparent/W3C) 연동 — reqId 단일.
- 생성기 tsconfig(15-05).

## 📑 ADR 후보
- [ ] ADR 가치 있는 결정 있음
- [x] 없음 (request-id-propagation explainer 범위 내 — 배선 + 헤더 노출)

## 🔗 관련 문서 (Related)
- 관련 wiki: `docs/explainers/backend/request-id-propagation.md`, `docs/review/2026-06-01-wiring-audit.md` §D
- 관련 reference: `docs/reference/packages/backend-logger.md`
- 관련 모듈: `packages/backend/logger/src/index.ts`, `apps/api/src/main.ts`

## ✅ Definition of Done
- [ ] `main.ts` + e2e 부트스트랩에 requestIdMiddleware 적용
- [ ] 미들웨어 응답 헤더 `x-request-id` + 패키지 단위 테스트
- [ ] e2e: reqId 생성 + 에코 검증 PASS
- [ ] walkthrough/pr_description ship + push + PR (base: phase-15)
