# PR: spec-09-03 HTTP auth SDK (web-next 인라인)

## Summary

- `apps/web-next/src/lib/http-auth-sdk.ts` 추가 — `createHttpAuthSDK(baseUrl): CoreAuthSDK`
- fetch 기반 5개 메서드: signIn, signUp, signOut, getCurrentUser(in-memory), refresh
- `apps/web-next/src/lib/auth.ts` → `createHttpAuthSDK("http://localhost:3001")` 사용
- 별도 패키지 미생성 — NestJS 앱 전용이므로 `apps/web-next/src/lib/` 인라인 배치

## Changed Files

| 파일 | 변경 |
|---|---|
| `apps/web-next/src/lib/http-auth-sdk.ts` | NEW — createHttpAuthSDK 구현 |
| `apps/web-next/src/lib/http-auth-sdk.test.ts` | NEW — TDD 9 test cases |
| `apps/web-next/src/lib/auth.ts` | MODIFY — HTTP SDK import로 교체 |

## Test Results

```
Test Files  3 passed (3)
Tests       20 passed (20)
```

`pnpm -r typecheck` → 39 packages PASS

## Test Plan

- [x] `pnpm --filter @apps/web-next test` PASS (20 tests)
- [x] `pnpm -r typecheck` PASS
- [x] CoreAuthSDK 타입 계약 충족 확인
