# Implementation Plan: spec-14-02

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-02-error-convention`
- 시작 지점: `phase-14-quality-cicd`
- 첫 task 가 브랜치 생성

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **규약 = Result/union/throw-AppError/boolean 결정 트리** (ADR-0020). plain Error 금지.
> - [ ] 범위 = ADR + P0(silent confirm) + P2(plain Error 6곳). P1/P3 후속.
> [!WARNING]
> - [ ] confirm 의 **HTTP 응답은 200 고정(enumeration-safe) 유지** — outcome 은 내부 관측용만.

## 🎯 핵심 전략

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| ADR | decision tree 문서화 | 전사 규약 SoT |
| P0 confirm | `Promise<ConfirmOutcome>` union 반환 | silent-void footgun 제거, 관측 가능 |
| P0 controller | outcome→200 고정 매핑 | enumeration-safe 비파괴 |
| P2 | `AppError({code:"INTERNAL"})` | 직렬화/코드 일관 (AppError ⊂ Error → 호출부 비파괴) |

### 📑 ADR 후보
- [x] ADR-0020 error-handling-convention (작성 대상)

## 📂 Proposed Changes

### Task 1 — ADR
#### [NEW] `docs/adr/0020-error-handling-convention.md`
- 결정 트리 + 각 패턴 사용 기준 + 예시 + 위반 안티패턴(plain Error, `-1` sentinel, silent void).

### Task 2 — P0 (silent confirm)
#### [MODIFY] `apps/api/src/auth/email-verify.service.ts` / `password-reset.service.ts`
- `confirm(...)` 반환: `Promise<void>` → `Promise<ConfirmOutcome>`,
  `type ConfirmOutcome = "confirmed" | "invalid" | "expired" | "used"`.
- 분기 지점(미발견/만료/사용됨/성공)에서 해당 값 반환(throw 아님 — 예상된 도메인 결과).
#### [MODIFY] confirm 컨트롤러(`auth.controller.ts`)
- outcome 무관 200 `{ status: "ok" }` 유지(enumeration-safe). outcome 은 logger.debug 로만.
#### [MODIFY] 테스트
- `*.confirm.service.test.ts`: void 대신 outcome 단언("confirmed"/"expired"/"used"/"invalid").

### Task 3 — P2 (plain Error → AppError)
#### [MODIFY] 6곳
- `auth-jwt/sign.ts:43`, `auth-oauth/account.ts:31`, `auth-oauth/providers.ts:34`, `auth-session/drizzle-store.ts:17`, `auth-rate-limit/csrf.ts:19,22`
- `throw new Error(msg)` → `throw new AppError({ code: "INTERNAL", message: msg, statusCode: 500 })`.
- 각 패키지에 `@repo/errors` 의존 추가 필요 시 package.json 갱신(이미 대부분 보유 확인 필요).
#### [MODIFY] 관련 테스트
- `toThrow(...)` 는 AppError 도 통과(서브클래스). code 단언 추가 가능.

## 🧪 검증 계획
```bash
pnpm --filter @apps/api --filter @repo/backend-auth-jwt --filter @repo/backend-auth-oauth \
  --filter @repo/backend-auth-session --filter @repo/backend-auth-rate-limit test
pnpm turbo run typecheck   # 전체
```
- confirm: PG 없이 단위(스토어 mock)로 outcome 검증.

## 🔁 Rollback Plan
- ADR 삭제 + confirm 반환을 void 로 되돌림 + AppError→Error 환원. 호출부 비파괴라 영향 국소.

## 📦 Deliverables 체크
- [ ] task.md / Plan Accept / 실행 / ship
