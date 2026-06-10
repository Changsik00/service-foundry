# spec-x: http-client 401 자동 refresh 인터셉터

## 변경 내용

transport 레이어(`packages/frontend/http-client`)에 401 자동 재시도 인터셉터를 추가했다.
앱에서 http-client 생성 시 `onUnauthorized` 콜백 한 번만 설정하면 모든 API 호출에 자동 적용된다.

### http-client API 변경

```typescript
// Before
createHttpClient({ baseUrl, credentials: "include" });

// After — sdk.refresh를 한 번만 연결하면 모든 API 호출에 401 재시도 자동 적용
createHttpClient({
  baseUrl,
  credentials: "include",
  onUnauthorized: () => sdk.refresh(),
});
```

### 동작 흐름

```
request(opts)
  try → doRequest(opts)
    성공           → 반환
    401 + onUnauthorized
      → onUnauthorized() 호출
          성공  → doRequest(opts) 재시도 1회
          실패  → 원래 AppError(401) throw
    401 + onUnauthorized 없음
          → AppError(401) 즉시 throw
    401 외 에러    → 즉시 throw
```

### AuthProvider startup 복구

`getCurrentUser()` 401 → `sdk.refresh()` → `getCurrentUser()` 재조회.
탭 비활성 후 재진입 시 accessToken 만료를 로그인 화면 없이 자동 복구.

### 변경 파일

| 파일 | 변경 |
|---|---|
| `packages/frontend/http-client/src/index.ts` | `onUnauthorized` 옵션 + 401 catch 재시도 래퍼 |
| `packages/frontend/http-client/src/index.test.ts` | `onUnauthorized interceptor` 케이스 4개 추가 |
| `packages/frontend/auth-react/src/provider.tsx` | startup 401 복구 (is401 헬퍼 + catch 블록) |
| `packages/frontend/auth-react/src/provider.test.tsx` | startup 401 복구 케이스 1개 추가 |

## 검증

- `@repo/frontend-http-client` → 17/17 PASS
- `@repo/frontend-auth-react` → 21/21 PASS
- `pnpm turbo run typecheck` → 48/48 PASS

## 커밋 목록

- `test(spec-x-auth-token-refresh-interceptor)`: http-client onUnauthorized + startup 복구 테스트 (Red)
- `feat(spec-x-auth-token-refresh-interceptor)`: http-client onUnauthorized interceptor + startup 401 복구
