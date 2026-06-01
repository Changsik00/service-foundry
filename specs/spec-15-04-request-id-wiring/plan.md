# Implementation Plan: spec-15-04

## 📋 Branch Strategy
- 신규 브랜치: `spec-15-04-request-id-wiring`
- 시작 지점: `phase-15-security-wiring` (phase base)
- PR base = `phase-15-security-wiring`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **미들웨어가 응답 헤더 `x-request-id` 노출** (Stripe/Heroku 관례). 검증 가능성 + 추적성. `@repo/backend-logger` 의 `requestIdMiddleware` 에 `res.setHeader` 추가(framework-agnostic `MinimalResponse`). → 패키지 단위 테스트 갱신.
> - [ ] **검증 = 응답 헤더 e2e + 기존 로거 단위 테스트**. "로그 reqId 비-undefined" 는 `@repo/nestjs-logger` 단위 테스트(child binding)가 이미 증명; 본 spec 은 e2e 응답 헤더로 "실 앱에서 ALS 가 요청별로 세팅됨" 을 증명 → 둘이 criterion4 를 커버.

> [!WARNING]
> - [ ] 미들웨어는 **가장 앞단**(cookieParser 다음, applySecurity 전) — 순서 어긋나면 일부 로그가 컨텍스트 밖.
> - [ ] e2e 부트스트랩(`auth.e2e.test.ts`)도 `app.use(requestIdMiddleware())` 추가 필요(Test 앱은 main.ts 안 거침).

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 적용 형태 | Express 미들웨어 `app.use` | ALS 를 프레임워크 진입 전 세팅 (interceptor 보다 앞) |
| 응답 헤더 | `x-request-id` 노출 | 검증 용이 + 표준 추적 |
| 헤더 재사용 | 수신 헤더 있으면 재사용 | LB/게이트웨이 reqId 보존 (기존 미들웨어 동작) |
| 검증 | e2e 응답 헤더 + 패키지 단위 | 실 앱 ALS 세팅 + 로그 binding 분리 증명 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

#### [MODIFY] `packages/backend/logger/src/index.ts`
- `requestIdMiddleware`: `MinimalResponse { setHeader(name, value) }` 추가, `res.setHeader("x-request-id", requestId)` (ALS run 전).

#### [MODIFY] `packages/backend/logger/src/index.test.ts`
- 응답 헤더 설정 케이스 추가(생성/재사용 시 setHeader 호출 검증).

#### [MODIFY] `apps/api/src/main.ts`
- `import { requestIdMiddleware } from "@repo/backend-logger"` + `app.use(requestIdMiddleware())` (cookieParser 다음).

#### [MODIFY] `apps/api/src/auth/auth.e2e.test.ts`
- 부트스트랩에 `app.use(requestIdMiddleware())` + "request-id" describe: 응답 `x-request-id` 유효 UUID(생성) / 제공 헤더 에코.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트
```bash
pnpm --filter @repo/backend-logger test   # requestIdMiddleware 응답 헤더 + 기존 ALS
pnpm --filter @repo/nestjs-logger test     # reqId child binding (회귀)
```
### 통합 테스트 (yes)
```bash
# 로컬 Postgres(5434) 후
pnpm --filter @apps/api test    # auth.e2e: x-request-id 생성/에코 + 기존 흐름 PASS
```
### 게이트
```bash
pnpm turbo run lint typecheck knip depcruise
```
### 수동 검증
1. `GET /auth/csrf` (헤더 없이) → 응답 `x-request-id` = 새 UUID.
2. `X-Request-Id: my-trace-1` 동반 요청 → 응답 `x-request-id: my-trace-1` 에코.

## 🔁 Rollback Plan
- `app.use` 1줄 + 미들웨어 헤더 추가가 전부 → revert 안전. DB·스키마 무관.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
