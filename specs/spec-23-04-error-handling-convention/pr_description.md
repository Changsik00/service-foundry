refactor(spec-23-04): 에러 처리 레이어링 (ADR-0027 + 전역 AppError 필터)

## 📋 Summary

### 배경 및 목적
apps/api 에 `AppError`→HTTP 변환 필터가 없어, 도메인 패키지가 던진 `AppError`(의미상 statusCode 보유)가 경계로 전파되면 **일괄 500** 으로 뭉개졌다(예: `getProvider(unknown)` → AppError(404) → 500). 레이어링을 ADR 로 명문화하고 전역 필터로 교정한다.

### 주요 변경 사항
- [x] **ADR-0027** (`docs/adr/0027-error-handling-layering.md`, type: convention) — HTTP 경계=NestJS 예외 / 도메인·패키지=Result+AppError / 전파 AppError=전역 필터 변환. 부트스트랩·invariant throw 는 예외(유지).
- [x] **전역 `AppErrorFilter`** (`apps/api/src/infra/app-error.filter.ts`, `@Catch(AppError)`) → `res.status(statusCode).json(toJSON())`. `configureApp`(SoT) 등록.
- [x] oauth.service 의 dead raw `throw new Error` → `AppError`(getProvider 와 일관, 필터 매핑).

### Phase 컨텍스트
- **Phase**: `phase-23` (non-base). 첫 ADR 동반 spec.

## 🎯 Key Review Points
1. **동작 변경(의도)**: 전파 AppError 가 500 → 의미상 statusCode(400/404/409…). 잠재 버그 수정.
2. 필터는 `AppError.statusCode`/`toJSON()`(code/message/statusCode/details, cause 제외) 그대로 사용.
3. 경계 발생 에러는 기존 NestJS 예외 유지(대량 변경 없음 — 이미 컨벤션 준수).

## 🧪 Verification
```bash
pnpm vitest run apps/api/src/infra/app-error.filter.test.ts apps/api/src/auth/oauth.service.test.ts  # 5 passed
pnpm turbo run typecheck --filter=./apps/api   # green
grep -n "throw new Error" apps/api/src/auth/oauth.service.ts   # 0
```

## 📦 Files Changed
### 🆕 New
- `docs/adr/0027-error-handling-layering.md`
- `apps/api/src/infra/app-error.filter.ts` (+test)
### 🛠 Modified
- `apps/api/src/app.setup.ts`: useGlobalFilters 등록
- `apps/api/src/auth/oauth.service.ts` (+test): AppError 변환
- `apps/api/package.json`: `@repo/errors` dep
- `docs/index.md`: ADR-0027 등재

## ✅ Definition of Done
- [x] ADR-0027 작성 + index 등재
- [x] AppErrorFilter 구현·등록·단위 테스트 그린
- [x] oauth raw throw 정리 + 테스트 그린
- [x] `apps/api` typecheck 그린
- [x] ship + push

## 🔗 관련 자료
- ADR-0027 (본 spec) · ADR-0008/0009/0020 (Result/AppError) · phase-23
- 후속: B2 컨트롤러 zod 통일(별도)
