fix(spec-16-03): self-recover web-next CSRF 403 with one retry

## 📋 Summary

### 배경 및 목적
web-next `auth-api.ts` 의 보호 POST(signin/signup/signout/refresh)는 csrf 토큰을 헤더로 동반하지만, 토큰 만료/불일치로 **403** 이 나면 재발급·재시도 없이 그대로 실패했다(phase-15 회고 W6 — 사용자가 수동 새로고침해야 하는 UX 회귀). `frontend-http-client` 가 비-2xx 를 `AppError`(statusCode 포함)로 throw 하므로, 403 을 식별해 csrf 재발급 후 1회 재시도하면 자가복구된다.

### 주요 변경 사항
- [x] `withCsrfRetry` 래퍼: 403 → `fetchCsrf()` 재발급 → **1회만** 재시도 (boolean 가드, 재귀 없음)
- [x] signin/signup/signout/refresh 적용
- [x] mock HttpClient 단위 테스트 3종

### Phase 컨텍스트
- **Phase**: `phase-16` (Security Hardening II) — 마지막 spec. 성공기준4(web-next CSRF 자가복구) 충족.

## 🎯 Key Review Points
1. **1회 재시도 가드**: recursion 아닌 명시적 catch — 재시도도 403 이면 원 에러 throw(무한 재발급 방지).
2. **403 식별 덕타이핑**: `statusCode === 403` — @repo/errors 결합 회피.
3. **스코프**: web-next MFA/passkey·web-vite/SDK 헤더는 클라이언트 메서드 부재(의도적 미배선) → Icebox.

## 🧪 Verification
```bash
pnpm --filter @apps/web-next test
pnpm turbo run lint typecheck test knip depcruise
```
**결과**:
- ✅ `apps/web-next` 24/24 PASS (+3 자가복구)
- ✅ 게이트 136/136
- 케이스: 403→재발급→재시도 성공 / 계속 403→throw(post 2회) / 401→즉시 throw(post 1회)

## 📦 Files Changed

### 🆕 New Files
- `apps/web-next/src/lib/auth-api.test.ts`: 403 자가복구 단위 테스트

### 🛠 Modified Files
- `apps/web-next/src/lib/auth-api.ts`: `is403` + `withCsrfRetry`, 보호 POST 적용

**Total**: 2 files

## ✅ Definition of Done
- [x] withCsrfRetry 403 자가복구 (1회 재시도 + 가드)
- [x] mock HttpClient 단위 테스트
- [x] walkthrough/pr_description ship
- [x] lint/typecheck 통과
- [x] 사용자 검토 알림

## 🔗 관련 자료
- Phase: `backlog/phase-16.md`
- 선행: spec-15-02(web-next CSRF 클라이언트), ADR-0021
