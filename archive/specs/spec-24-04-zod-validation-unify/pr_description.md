refactor(spec-24-04): unify controller zod validation to zodPipe

## 📋 Summary

### 배경 및 목적
phase-23 감사 §B2. auth 컨트롤러군의 zod body 검증이 3패턴(`zodPipe` / `parseOr400` / raw `.parse()`)으로 산재. 표준 `zodPipe` 로 수렴해 일관성·가독성을 높이고 중복 헬퍼를 제거한다.

### 주요 변경 사항
- [x] **provider-org**: 로컬 `parseOr400` 헬퍼 제거 → `zodPipe` (3 콜사이트)
- [x] **mfa**: raw `.parse()`(try/catch 없어 ZodError 누출) → `zodPipe` (검증실패 **400 일관화**, 3 콜사이트)
- [x] **passkey**: try/catch + `.parse()` → `zodPipe` (보일러플레이트 제거, 2 콜사이트)

### Phase 컨텍스트
- **Phase**: `phase-24` (B2). 안전망: spec-24-01 컨트롤러 단위 테스트.

## 🎯 Key Review Points

1. **동작 보존**: `zodPipe` = parseOr400 = passkey try/catch (ZodError → `BadRequestException(err.issues)`). 순수 치환.
2. **mfa 개선**: 검증 실패가 미처리 ZodError(→500 누출) → 400 BadRequest 로 일관화.
3. account 의 `body as` 캐스트는 zod 부재라 본 spec 범위 밖(Out of Scope).

## 🧪 Verification

```bash
turbo run lint typecheck test   # 로컬 5434 DB
```
**결과**: ✅ 142/142 task. apps/api 340 tests/61 files(단위+e2e), 회귀 0. provider-org/mfa/passkey 단위 PASS.

## 📦 Files Changed

### 🛠 Modified
- `apps/api/src/auth/provider-org.controller.ts` (parseOr400 제거)
- `apps/api/src/auth/mfa.controller.ts`
- `apps/api/src/auth/passkey.controller.ts`

## ✅ Definition of Done

- [x] provider-org/mfa/passkey → `zodPipe` 통일
- [x] parseOr400 + 불필요 import 제거
- [x] 단위(24-01) + e2e 회귀 0, lint/typecheck PASS
- [x] walkthrough / pr_description ship commit

## 🔗 관련 자료
- Phase: `backlog/phase-24.md`
- 헬퍼: `apps/api/src/auth/auth-controller.shared.ts` (`zodPipe`)
