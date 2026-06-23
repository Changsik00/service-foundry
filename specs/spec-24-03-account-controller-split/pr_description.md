refactor(spec-24-03): extract EmailChangeController from account.controller

## 📋 Summary

### 배경 및 목적
phase-23 감사 §F2. `account.controller.ts`(277 LOC)가 두 서비스(AccountService+EmailChangeService)·6 라우트를 한 컨트롤러에 담고 있어 책임이 흐렸다. spec-24-01 안전망 위에서 분할.

### 주요 변경 사항
- [x] **EmailChangeController 추출** — 이메일 변경 request/confirm 2 라우트 + EmailChangeService (prefix `auth/account` 동일 유지)
- [x] **AccountController** — AccountService 만 의존(password/profile/delete/avatar), **277 → 188 LOC** (<200)
- [x] `auth.module` + `provider-auth.module` 양쪽에 EmailChangeController 등록
- [x] 테스트 재배치(email-change.controller.test 신규) + route-inventory 스냅샷에 반영(URL/가드 불변)

### Phase 컨텍스트
- **Phase**: `phase-24`. B2(zod 통일)는 분리된 spec-24-04 로.

## 🎯 Key Review Points

1. **URL·가드 완전 보존**: 분할 후에도 `auth/account/*` 경로·가드 동일 → route-inventory EXPECTED 문자열 **무변경**(클라이언트 breaking 없음).
2. **양 모듈 등록**: account 가 auth/provider-auth 양쪽에 있어 EmailChangeController 도 양쪽 추가. EmailChangeService 는 두 모듈에 이미 provider 존재.
3. **서비스 경계 분할**: AccountService ↔ EmailChangeService 자연 seam.

## 🧪 Verification

```bash
turbo run lint typecheck test   # 로컬 5434 DB
```
**결과**: ✅ 142/142 task. apps/api 340 tests / 61 files(단위+e2e), 회귀 0. account.controller 188 LOC.

## 📦 Files Changed

### 🆕 New
- `apps/api/src/auth/email-change.controller.ts`
- `apps/api/src/auth/email-change.controller.test.ts`

### 🛠 Modified
- `apps/api/src/auth/account.controller.ts` (이메일 라우트·EmailChangeService 제거)
- `apps/api/src/auth/auth.module.ts`, `provider-auth.module.ts` (EmailChangeController 등록)
- `apps/api/src/auth/account.controller.test.ts` (이메일 케이스 이동)
- `apps/api/src/auth/route-inventory.test.ts` (EmailChangeController 반영)

## ✅ Definition of Done

- [x] EmailChangeController 추출 + 양 모듈 등록
- [x] account.controller 188 LOC, AccountService 만 의존
- [x] route-inventory 스냅샷 PASS(URL/가드 보존), 테스트 재배치 PASS
- [x] e2e 회귀 0, lint/typecheck PASS
- [x] walkthrough / pr_description ship commit

## 🔗 관련 자료
- Phase: `backlog/phase-24.md`
- 선례: spec-23-06 (auth.controller 3분할)
