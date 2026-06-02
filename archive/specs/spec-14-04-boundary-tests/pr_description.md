# test(spec-14-04): 비-auth 패키지 경계 테스트 보강

## 📋 Summary
### 배경
공용 인프라(utils/logger/http-client)의 경계·에러 경로 일부가 미검증. coverage 도구 미설치라 소스 대조로 갭 식별.
### 주요 변경 (테스트 전용, 소스 무변경)
- [x] **utils**: `fromPromise` (resolve→ok / reject→err / sync-throw) — 기존 테스트 0 → 3
- [x] **backend-http-client**: 404→`AppError(BAD_REQUEST)` 비-retry + POST 기본 no-retry + POST 명시 retries→retry (frontend 대비 비대칭 해소)
- [x] **backend-logger**: generateRequestId 유일성 + requestIdMiddleware custom header / next

### Phase 컨텍스트
- phase-14 성공 기준 3.

## 🎯 Key Review Points
1. characterization — 소스 비변경, 기존 동작 고정.
2. `requestIdMiddleware` 응답헤더 테스트는 **드롭**(미들웨어가 실제로 응답헤더를 설정 안 함 — 없는 동작 미테스트).
3. frontend/http-client·cache·errors 는 이미 커버 → 제외(정직).

## 🧪 Verification
```bash
pnpm --filter @repo/utils test            # 19
pnpm --filter @repo/backend-http-client test  # 14
pnpm --filter @repo/backend-logger test   # 10
```
+ 본 PR `verify` CI green.

## ✅ Definition of Done
- [x] 9 경계 테스트 추가, 전부 PASS + typecheck 0
- [ ] 본 PR CI green (관측)

## 🔗 관련
- 이월: @vitest/coverage-v8 도입(후속), requestIdMiddleware 응답헤더 echo(선택).
