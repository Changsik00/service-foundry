# feat(spec-02-02): @repo/errors — AppError + 8 카탈로그 + 양방향 wire + TS narrow + ADR-0009

## 📋 Summary

### 배경 및 목적

Phase 2 "shared primitives"의 두 번째 spec. ADR-0008 `Result<T, E>` 후속으로 *E = AppError* 도메인 에러 표현을 박는다. BE/FE 공유 *데이터 모델* (zod 외 의존성 0, 환경 무관) + 양방향 wire (`toJSON` ↔ `fromJSON`) + TS unknown narrowing 어휘. 사용자 비판에 따라 minimal → production-ready core → round-trip + TS narrow 통합으로 격상.

### 주요 변경 사항

- [x] **`@repo/errors` 신규 패키지** (scaffold + 273줄 본문)
- [x] **`class AppError extends Error`** (code/statusCode/details/cause + `toJSON`)
- [x] **`STANDARD_ERROR_REGISTRY` 8 코드** (VALIDATION 400 / UNAUTHENTICATED 401 / FORBIDDEN 403 / NOT_FOUND 404 / CONFLICT 409 / RATE_LIMIT 429 / INTERNAL 500 / BAD_GATEWAY 502)
- [x] **8 factory** (`validationError` ~ `badGatewayError`)
- [x] **양방향 wire**: `toJSON` + `fromJSON` + `isAppErrorResponse` + `AppErrorResponse` type — FE SDK가 응답 body를 *AppError class*로 복원
- [x] **타입 가드 3종**: `isAppError` / `isCode<C>` (code별 narrow) / `isError` (cross-realm 안전)
- [x] **TS narrow helpers 2종**: `errorMessage(e)` + `errorCause(e)` — unknown narrowing boilerplate 표준화
- [x] **`wrap(e, code?, message?)`** — try/catch 패턴에서 unknown → AppError 변환 (`return err(wrap(e))`)
- [x] **`Result<T, AppError>` round-trip 테스트** — `@repo/utils`의 6 helpers와 결합 동작
- [x] **ADR-0009** (`docs/adr/0009-app-error-design.md`) — 7 결정 + 9 라이브러리 alternative 분석 (`@hapi/boom` / `http-errors` / NestJS HttpException / RFC 7807 / Stripe / GitHub API / `neverthrow` / `@total-typescript/error` / `zod-validation-error`)

### Phase 컨텍스트

- **Phase**: `phase-02` — Shared Primitives (In Progress, 5 spec 중 2번째)
- **본 SPEC의 역할**: 모든 후속 spec(`shared-validation` / `shared-contracts` / `shared-auth-contracts`) + Phase 3 backend / Phase 4 frontend가 공통 의존하는 *에러 어휘*. ADR-0009로 디자인 박음. 본 PR 머지 후 spec-02-03 (zod 변환은 본 패턴 채택) 진입 준비.

## 🎯 Key Review Points

1. **Scope 진화 (v1 → v3)**: 사용자 비판 ("이정도 기능밖에 없나?") 후 벤치마킹 + 격상. v1 12 test → v3 **56 test**. 핵심 추가: **fromJSON 역변환 / wrap helper / TS narrow helpers**. 자세한 진화 추적은 walkthrough §메타.
2. **양방향 wire의 가치**: `toJSON`만으론 *반쪽*. axios interceptor에서 `fromJSON(response.data)` 한 번으로 `Result<T, AppError>` 복원. SDK 사용자는 *raw object를 매번 변환*할 필요 없음.
3. **`wrap` 한 함수로 catch 처리 일원화**: `try { ... } catch (e) { return err(wrap(e)); }`. 호출자는 *대부분 wrap만* 알면 됨. `isError` / `errorMessage` / `errorCause`는 *raw 에러 처리(로깅 등) 시 building block*.
4. **flat code (NestJS 계층 비채택)**: `class ValidationError` 등 subclass 만들지 않음. `new AppError({ code: "ORDER_FROZEN", ... })`로 사용자 도메인 확장. SCREAMING_SNAKE 또는 `DOMAIN.REASON` 컨벤션 — ADR-0009에 박음.
5. **라이브러리 specific 가드 (axios/fetch)는 본 spec 외**: 환경 무관 원칙. Phase 4 `@repo/frontend/sdk`가 axios 에러를 `wrap(e)` 호출 = AppError로 변환. ADR-0009 §결정 7.
6. **RFC 7807 Problem Details 비채택 이유**: type URI 관리 부담 + 본 spec은 *프레임워크 무관 데이터 모델*. Phase 3 backend HTTP middleware에서 `toProblemDetails(instance?)` 추가 후보로 명시.
7. **lefthook typecheck 동작의 일관성 의문** ⚠️: spec-02-01에서 quirk 발견 (typecheck fail에도 commit 통과), 본 spec T8 commit에서는 정상 차단. *어떤 케이스에서 차단되고 안 되는지 불명* — RCA-001 작성 후보 격상 (2회 트리거).
8. **shared/* DOM lib 패턴 재발** ⚠️: `@repo/utils` 다음 `@repo/errors`도 utils 의존하면서 `setTimeout` 타입 표면화. `errors/tsconfig.json`에도 DOM lib 추가. `@repo/typescript-config`에 `env-agnostic` 변형 추가 spec 후보로 격상.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS (useLiteralKeys info-level 3건, unsafe fix라 자동 적용 안 함 — 의도된 bracket access 유지)
- ✅ `pnpm typecheck`: tsc --noEmit PASS (FULL TURBO cache hit)
- ✅ `pnpm test`: **56 tests passed** in `@repo/errors`
- ✅ `depcruise`: ✔ no dependency violations found (13 modules, 10 dependencies)

### 수동 검증 시나리오

1. **BE→FE round-trip**:
   ```ts
   const e = notFoundError("missing", { id: "u1" });
   const wire = JSON.stringify(e);                              // BE: "{\"code\":\"NOT_FOUND\",\"message\":\"missing\",\"statusCode\":404,\"details\":{\"id\":\"u1\"}}"
   const restored = fromJSON(JSON.parse(wire));                 // FE: AppError instance
   isCode(restored, "NOT_FOUND");                               // ✓ true (typed narrow)
   ```
2. **wrap unknown error**:
   ```ts
   try { await api.call() } catch (e) { return err(wrap(e)); } // AppError (INTERNAL by default, cause 보존)
   ```
3. **Result<T, AppError> chain**:
   ```ts
   const dto = map(findUser("u1"), (u) => ({ email: u.email })); // Result<{email:string}, AppError>
   ```

## 📦 Files Changed

### 🆕 New Files

- `packages/shared/errors/package.json` + `tsconfig.json` (DOM lib 포함) + `vitest.config.ts`
- `packages/shared/errors/src/index.ts` (273줄)
- `packages/shared/errors/src/index.test.ts` (~400줄, 56 test)
- `docs/adr/0009-app-error-design.md` (75줄)
- `specs/spec-02-02-shared-errors/{spec,plan,task,walkthrough,pr_description}.md`

### 🛠 Modified Files

- `pnpm-lock.yaml` (catalog deps만)
- `backlog/phase-02.md` / `backlog/queue.md` (sdd 자동 — spec-02-02 SPEC 표 행)

### 🗑 Deleted Files

- 없음.

**Total**: 8 new files + 3 modified.

## ✅ Definition of Done

- [x] `@repo/errors` 신규 패키지 + AppError + 8 카탈로그 + 8 factory
- [x] 양방향 wire: toJSON / fromJSON / isAppErrorResponse
- [x] 가드 3종 + narrow helpers 2종 + wrap
- [x] Result<T, AppError> round-trip
- [x] 56 tests PASS
- [x] lint / typecheck / depcruise 0 violation
- [x] ADR-0009 작성 + 본 PR 포함
- [x] walkthrough + pr_description ship commit
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-02.md`
- ADR: `docs/adr/0009-app-error-design.md` (본 spec)
- 선행 ADR: `docs/adr/0008-result-type.md`
- Walkthrough: `specs/spec-02-02-shared-errors/walkthrough.md` (scope 진화 + lefthook quirk + DOM lib 패턴 재발)
- 후속 spec: `spec-02-03-shared-validation` (zod 변환은 `validationError(msg, zodError.flatten())` 컨벤션 채택 후보)
