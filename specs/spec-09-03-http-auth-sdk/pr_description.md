# PR: spec-09-03 HTTP auth SDK (web-next 인라인)

## Summary

- `apps/web-next/src/lib/auth-api.ts` 추가 — endpoint/HTTP 메서드/payload 정의 (Layer 2)
- `apps/web-next/src/lib/auth-sdk.ts` 추가 — `createAuthSDK(baseUrl): CoreAuthSDK` (Layer 3)
- `@repo/utils` — `fromPromise` 추가 (ADR-0008 `Result<T>` 패턴 확장)
- `@repo/frontend-http-client` — `credentials` 옵션 추가 (cross-origin cookie 지원)
- `apps/web-next/src/lib/auth.ts` → `createAuthSDK("http://localhost:3001")` 사용
- 별도 패키지 미생성 — NestJS 백엔드에 결합된 앱 전용 구현 (ADR-0018)

## 레이어 구조

```
@repo/frontend-http-client   ← request/response/error (transport)
        ↓
auth-api.ts                  ← endpoint·HTTP메서드·payload (API contract)
        ↓
auth-sdk.ts                  ← createAuthSDK, AuthResult 매핑 (SDK)
        ↓
auth.ts                      ← 싱글턴 export
```

## Changed Files

| 파일 | 변경 |
|---|---|
| `apps/web-next/src/lib/auth-api.ts` | NEW — endpoint/payload 정의 (auth-api Layer 2) |
| `apps/web-next/src/lib/auth-sdk.ts` | NEW — createAuthSDK 구현 (Layer 3) |
| `apps/web-next/src/lib/auth-sdk.test.ts` | NEW — TDD 21 test cases |
| `apps/web-next/src/lib/auth.ts` | MODIFY — createAuthSDK import로 교체 |
| `apps/web-next/package.json` | MODIFY — @repo/utils 의존성 추가 |
| `packages/shared/utils/src/index.ts` | MODIFY — fromPromise 추가 |
| `packages/frontend/http-client/src/index.ts` | MODIFY — credentials 옵션 추가 |

## Test Results

```
Test Files  3 passed (3)
Tests       21 passed (21)
```

`pnpm -r typecheck` → 39 packages PASS

## Test Plan

- [x] `pnpm --filter @apps/web-next test` PASS (21 tests)
- [x] `pnpm -r typecheck` PASS
- [x] CoreAuthSDK 타입 계약 충족 확인
- [x] `isCode(err, "RATE_LIMIT")` — statusCode 대신 code 기반 에러 판단
