# spec-23-04: 에러 처리 레이어링 컨벤션 (ADR + 전역 AppError 필터)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-23-04` |
| **Phase** | `phase-23` |
| **Branch** | `spec-23-04-error-handling-convention` |
| **상태** | Planning |
| **타입** | Refactor (+ADR) |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황 (실태 조사)
- apps/api 는 HTTP 에러를 **NestJS 예외**로 처리(183곳: Unauthorized 63·Forbidden 44·BadRequest 34…). `AppError` 사용 **0**.
- 도메인 패키지(`packages/backend/*`)는 `AppError`(+Result) 사용(22 파일).
- apps/api 에 **AppError→HTTP ExceptionFilter 가 없음**.

### 문제점
도메인 패키지가 던진 `AppError`(의미상 400/404/409 등 `statusCode` 보유)가 컨트롤러로 **전파되면 매핑 필터가 없어 일괄 500** 으로 뭉개진다. 실측 예: `getProvider(unknownName)` → `AppError("Unknown OAuth provider", 400)` → 컨트롤러 → **500**(400 이어야 함). 또한 "HTTP=NestJS 예외 / 도메인=AppError" 레이어링이 **암묵적**이라 문서·강제 없음.

### 해결 방안
1. **ADR 로 레이어링 명문화**: HTTP 경계 발생 에러 = NestJS 예외 / 도메인·패키지 = `Result`+`AppError` / **경계로 전파된 AppError 는 전역 필터가 `statusCode` 로 변환**.
2. apps/api 에 **전역 `AppErrorFilter`**(`@Catch(AppError)`) 추가 — `res.status(err.statusCode).json(err.toJSON())`. `configureApp` 에 등록(SoT).
3. 이로써 전파 AppError(oauth unknown provider 등)가 올바른 상태코드를 받음. dead 가 된 raw throw 정리.

## 요구사항

1. `docs/adr/0027-error-handling-layering.md` 작성 (type: convention) — 레이어링 + 전역 필터 결정.
2. `AppErrorFilter` 구현 + `configureApp` 등록 + 단위 테스트(statusCode/json 매핑).
3. oauth.service 의 dead/raw "Unknown provider" throw 정리(getProvider AppError 가 필터로 처리됨). oauth.service.test 갱신.
4. 부트스트랩 fail-fast(settings/superuser)·invariant throw 는 **유지**(ADR 에 예외로 명시).

## Out of Scope

- **B2 컨트롤러 zod 검증 3패턴 통일** — 미테스트 컨트롤러 안전망 필요 → 별도 spec(후속).
- D2/D3/D4/D6 dedup, F 복잡도 → 23-05+.
- 기존 NestJS 예외 사용처 대량 변경 — 현행 유지(이미 컨벤션 준수).

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] **전역 AppError 필터는 동작 변경**: 현재 500 으로 나가던 "전파 AppError" 가 의미상 statusCode(400/404/409 등)로 바뀜 — 의도된 correctness 개선(잠재 500 버그 수정).

## 핵심 전략

| 레이어 | 에러 표현 | 비고 |
|:---:|:---|:---|
| HTTP 경계(controller/guard) | NestJS 예외 | 경계서 발생한 에러 |
| 도메인/패키지(backend/*) | `Result` + `AppError` | framework-agnostic |
| 경계 전파 AppError | **전역 `AppErrorFilter`** 가 `statusCode` 변환 | 도메인 에러의 HTTP 노출 단일 지점 |

## Proposed Changes

#### [NEW] `docs/adr/0027-error-handling-layering.md`
레이어링 컨벤션 + 전역 필터 결정 (type: convention). index.md 카탈로그 등재.

#### [NEW] `apps/api/src/infra/app-error.filter.ts`
`@Catch(AppError)` ExceptionFilter → `res.status(err.statusCode).json(err.toJSON())`.

#### [NEW] `apps/api/src/infra/app-error.filter.test.ts`
필터 단위 테스트 (statusCode·toJSON 매핑, mock ArgumentsHost).

#### [MODIFY] `apps/api/src/app.setup.ts`
`configureApp` 에 `app.useGlobalFilters(new AppErrorFilter())` 등록.

#### [MODIFY] `apps/api/src/auth/oauth.service.ts`
dead/raw `throw new Error("Unknown provider")` 정리(getProvider 가 AppError 던지고 필터가 처리). `oauth.service.test` 갱신.

## 검증 계획

```bash
pnpm vitest run apps/api/src/infra/app-error.filter.test.ts apps/api/src/auth/oauth.service.test.ts  # 그린
pnpm turbo run typecheck lint --filter=./apps/api
# (CI e2e) 잘못된 provider → 400 (기존 500 아님)
```

수동 검증:
1. 필터 단위 테스트: AppError(404) → res.status(404)+toJSON.
2. AppError 전파 경로가 500 대신 의미상 코드로 응답.

## ADR 후보
- [x] **있음** → `docs/adr/0027-error-handling-layering.md` (type: convention)

## ✅ Definition of Done

- [ ] ADR-0027 작성 + index 등재
- [ ] AppErrorFilter 구현·등록·단위 테스트 그린
- [ ] oauth dead throw 정리 + oauth.service.test 그린
- [ ] `apps/api` typecheck/lint 그린
- [ ] walkthrough/pr_description ship + push
