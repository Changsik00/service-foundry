# PR: spec-09-03 HTTP auth SDK (frontend-auth-http)

## Summary

- `packages/frontend/auth-http` 신규 패키지 추가 — `createHttpAuthSDK(baseUrl): CoreAuthSDK`
- fetch 기반 5개 메서드: signIn, signUp, signOut, getCurrentUser(in-memory), refresh
- `apps/web-next/src/lib/auth.ts` → `createHttpAuthSDK("http://localhost:3001")` 교체
- ADR-0006 CoreAuthSDK 계약 충족 — SDK swap (HTTP ↔ Mock ↔ Firebase) 타입 안전

## Changed Files

| 파일 | 변경 |
|---|---|
| `packages/frontend/auth-http/package.json` | NEW — @repo/frontend-auth-http 패키지 |
| `packages/frontend/auth-http/src/index.ts` | NEW — createHttpAuthSDK 구현 |
| `packages/frontend/auth-http/src/index.test.ts` | NEW — TDD 9 test cases |
| `packages/frontend/auth-http/tsconfig.json` | NEW |
| `packages/frontend/auth-http/vitest.config.ts` | NEW |
| `apps/web-next/src/lib/auth.ts` | MODIFY — HTTP SDK로 교체 |
| `apps/web-next/package.json` | MODIFY — @repo/frontend-auth-http 의존성 추가 |

## Test Results

```
@repo/frontend-auth-http: Test Files 1 passed (1) | Tests 9 passed (9)
```

`pnpm -r typecheck` → 40 packages PASS

## Test Plan

- [x] `pnpm --filter @repo/frontend-auth-http test` PASS
- [x] `pnpm -r typecheck` PASS
- [x] TDD Red → Green 순서 준수 (커밋 히스토리 확인)
- [x] CoreAuthSDK 타입 계약 충족 확인
