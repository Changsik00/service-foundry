fix(spec-16-01): guard MFA/passkey state-changing endpoints with CsrfGuard

## 📋 Summary

### 배경 및 목적
phase-15(spec-15-02)에서 CSRF double-submit(`CsrfGuard`, csrf_id — ADR-0021)을 auth 8개 endpoint 에 배선했으나, **MFA/passkey 상태변경 POST 8개는 사용자 합의로 후속 이월**되어 CSRF 미보호였다(phase-15 회고 W5). 특히 `mfa/totp/verify`·`passkey/authenticate/verify` 는 토큰을 발급하는 **미인증 로그인 완료 endpoint** 라 공격면이 컸다. 본 spec 은 이 8개에 기존 `CsrfGuard` 를 배선한다(신규 메커니즘 없음).

### 주요 변경 사항
- [x] MFA 4개(`enroll`/`enroll/confirm`/`verify`/`disable`) + passkey 4개(`register/options`·`register/verify`·`authenticate/options`·`authenticate/verify`)에 `CsrfGuard` 배선
- [x] AuthGuard 있는 곳은 `@UseGuards(AuthGuard, CsrfGuard)` 스택, 미인증은 `@UseGuards(CsrfGuard)`
- [x] e2e: "MFA/passkey CSRF 게이트" 신규 + 기존 슬라이스 `postCsrf` 동반 갱신

### Phase 컨텍스트
- **Phase**: `phase-16` (Security Hardening II) — 첫 spec
- **역할**: phase-15 회고 W5(잔여 CSRF 공격면) 해소. 성공기준 1 충족.

## 🎯 Key Review Points
1. **가드 스택 순서**: `(AuthGuard, CsrfGuard)` — AuthGuard 먼저라 `register/options 인증없음 → 401` 이 csrf 없이 유지됨. 미인증 verify/authenticate 만 CsrfGuard 단독.
2. **ADR-0021 재사용**: csrf_id 가 session 비의존이라 미인증 endpoint 도 동일 메커니즘으로 보호.

## 🧪 Verification
```bash
DATABASE_URL=postgres://postgres:test@localhost:5434/test pnpm --filter @apps/api test
pnpm turbo run lint typecheck test knip depcruise
```
**결과**:
- ✅ `apps/api` 104/104 PASS (+2: MFA/passkey CSRF 게이트)
- ✅ 게이트 136/136
- ✅ csrf 없는 `mfa/totp/verify`·`passkey/authenticate/verify` → 403 (배선 전 401 → 가드 선차단)

## 📦 Files Changed

### 🛠 Modified Files
- `apps/api/src/auth/mfa.controller.ts` (+5, -3): 4개 endpoint CsrfGuard
- `apps/api/src/auth/passkey.controller.ts` (+5, -2): 4개 endpoint CsrfGuard
- `apps/api/src/auth/auth.e2e.test.ts` (+46, -32): CSRF 게이트 신규 + 슬라이스 postCsrf 갱신

**Total**: 3 files

## ✅ Definition of Done
- [x] 8개 endpoint CsrfGuard 배선, 헤더 누락 → 403 e2e
- [x] 기존 MFA/passkey 슬라이스 csrf 동반 갱신 → GREEN
- [x] walkthrough/pr_description ship
- [x] lint/typecheck 통과
- [x] 사용자 검토 알림

## 🔗 관련 자료
- Phase: `backlog/phase-16.md`
- ADR: `docs/adr/0021-csrf-binding-strategy.md`
