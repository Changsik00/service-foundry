# feat(spec-15-04): wire request-id middleware

## 📋 Summary

### 배경 및 목적
`requestIdMiddleware`(`@repo/backend-logger`, AsyncLocalStorage)·로거 reqId child binding·http-client 전파가 구현됐으나 `apps/api/main.ts` 가 미들웨어를 적용하지 않아 ALS 가 비어 모든 로그 `reqId: undefined`, 아웃바운드 전파 무효(`wiring-audit §D`). 본 spec 이 배선해 phase-15 성공기준4 를 충족.

### 주요 변경 사항
- [x] `main.ts` 가장 앞단에 `requestIdMiddleware()` 적용 (요청별 reqId ALS)
- [x] 미들웨어가 응답 헤더 `x-request-id` 노출 (생성/에코) + 패키지 단위 테스트
- [x] apps/api 에 `@repo/backend-logger` 직접 의존 선언
- [x] e2e: reqId 생성 UUID + 제공 헤더 에코

### Phase 컨텍스트
- **Phase**: `phase-15` — 성공기준4(request-id 배선) 충족. 4/5 spec.

## 🎯 Key Review Points
1. **미들웨어 순서** (`main.ts`): `requestIdMiddleware()` → `cookieParser()` → applySecurity. 가장 앞단이라 모든 핸들러/로그/아웃바운드가 reqId 공유.
2. **응답 헤더 노출** (`@repo/backend-logger`): `res.setHeader("x-request-id", …)` 추가(framework-agnostic `MinimalResponse`). 검증성 + 추적성.
3. **검증 분리**: e2e 헤더 = 실 앱 ALS 요청별 세팅 증명; nestjs-logger 단위 = reqId→로그 child binding 증명 → 함께 "로그 reqId 비-undefined" 커버.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-logger test   # 12/12 (헤더 생성/에코 포함)
# 로컬 Postgres(5434) 후
pnpm turbo run lint typecheck test knip depcruise   # (전체 PASS)
```
- apps/api **102/102** (auth.e2e 42, reqId describe 포함), backend-logger 12/12.

## 📦 Files Changed
### 🛠 Modified
- `packages/backend/logger/src/index.ts` (+test): `requestIdMiddleware` 응답 헤더
- `apps/api/src/main.ts`: `app.use(requestIdMiddleware())`
- `apps/api/package.json` (+lockfile): `@repo/backend-logger` 의존
- `apps/api/src/auth/auth.e2e.test.ts`: 부트스트랩 미들웨어 + request-id describe

## ✅ Definition of Done
- [x] main.ts + e2e 부트스트랩 미들웨어 적용
- [x] 응답 헤더 + 패키지 단위 테스트
- [x] e2e reqId 생성/에코 PASS
- [x] walkthrough / pr_description ship
- [x] lint/typecheck/knip/depcruise PASS

## 🔗 관련 자료
- Phase: `backlog/phase-15.md` · Walkthrough: `specs/spec-15-04-request-id-wiring/walkthrough.md`
- 관련: `wiring-audit §D`, `docs/explainers/backend/request-id-propagation.md`
