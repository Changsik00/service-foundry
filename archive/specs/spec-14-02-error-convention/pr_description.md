# refactor(spec-14-02): 에러 처리 규약 통일 (ADR-0020 + P0/P2)

## 📋 Summary
### 배경
에러 표현이 5가지(throw AppError / plain Error / Result / union / boolean·-1·silent)로 혼재. 규약 미문서화 + silent-void confirm 의 관측 불가.
### 주요 변경
- [x] **ADR-0020** `docs/adr/0020-error-handling-convention.md` — 결정 트리(Result/union/throw-AppError/boolean) + 안티패턴(plain Error·`-1`·silent void).
- [x] **P0**: `email-verify/password-reset.confirm()` silent void → `ConfirmOutcome` union(`confirmed`/`invalid`/`expired`/`used`). 컨트롤러는 **200 고정(enumeration-safe) 유지**.
- [x] **P2**: plain `throw Error` 6곳 → `AppError`(INTERNAL 5곳 / NOT_FOUND 1곳). AppError ⊂ Error → 호출부 비파괴.

### Phase 컨텍스트
- phase-14 성공 기준 1. P1(auth-* boolean→Result)·P3(ExceptionFilter)는 후속.

## 🎯 Key Review Points
1. **ADR-0020 = SoT**: 함수가 실패를 표현하는 방식의 결정 트리.
2. **enumeration-safe 책임 이동**: 서비스는 정확한 outcome, 경계(컨트롤러)가 200 매핑 → 관측 회복 + 보안 유지.
3. **getProvider = NOT_FOUND(404)**: 사용자 입력성이라 INTERNAL 아님.

## 🧪 Verification
```bash
# confirm 단위 11/11, P2 4패키지 75/75, typecheck Done
pnpm --filter @apps/api ... test   # 로컬
```
+ 본 PR `verify` CI (PG service 포함 전체) green.

## 📦 Files Changed
- `docs/adr/0020-error-handling-convention.md` (신규)
- `apps/api/src/auth/{confirm-outcome.ts(신규),email-verify.service,password-reset.service,*.confirm.service.test}`
- `packages/backend/{auth-jwt/sign,auth-oauth/{account,providers},auth-session/drizzle-store,auth-rate-limit/csrf}.ts`

## ✅ Definition of Done
- [x] ADR-0020
- [x] P0 confirm outcome union + enumeration-safe 유지 + 테스트
- [x] P2 6곳 AppError + 비파괴
- [x] 단위 PASS + typecheck 0
- [ ] 본 PR CI green (관측)

## 🔗 관련
- 후속: P1(auth-* Result), P3(NestJS ExceptionFilter)
