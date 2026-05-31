# Implementation Plan: spec-14-04

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-04-boundary-tests`
- 시작 지점: `phase-14-quality-cicd`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **테스트 전용** spec — 소스 비변경. characterization 테스트로 경계 고정.
> [!WARNING]
> - [ ] 테스트가 기존 버그를 드러내면 소스 수정 여부는 별도 판단(보고).

## 🎯 핵심 전략
식별된 갭에만 집중. frontend/http-client·cache·errors 는 이미 커버되어 제외.

## 📂 Proposed Changes

### Task 1 — `@repo/utils`
#### [MODIFY] `src/index.test.ts`
- `fromPromise`: resolve → `ok(value)`(isOk + value), reject → `err(error)`(isErr + error 동일성).

### Task 2 — `@repo/backend-http-client`
#### [MODIFY] `src/index.test.ts`
- 404(4xx) → `AppError` `code==="BAD_REQUEST"`, statusCode 404, **retry 안 함**(fetch 호출 1회).
- POST 기본 → 5xx 라도 1회만(idempotent 아님). `retries` 명시 시 retry 동작.

### Task 3 — `@repo/backend-logger`
#### [MODIFY] `src/index.test.ts`
- `generateRequestId()` → 문자열 + 2회 호출 시 상이.
- `requestIdMiddleware`: mock req/res/next → `res.setHeader("X-Request-Id", ...)` 호출 + `next()` 1회 + 핸들러 내 `getCurrentRequestId()` 일치.

## 🧪 검증 계획
```bash
pnpm --filter @repo/utils --filter @repo/backend-http-client --filter @repo/backend-logger test
pnpm turbo run typecheck
```
+ 본 PR `verify` CI green.

## 🔁 Rollback Plan
- 추가 테스트 제거. 소스 무변경이라 영향 0.

## 📦 Deliverables 체크
- [ ] task.md / Plan Accept / 실행 / ship
