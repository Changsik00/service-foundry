# spec-x: AuthProvider withAuthRetry — 401 자동 refresh 재시도

## 변경 내용

`AuthProvider`에 `withAuthRetry(fn)` 메서드를 추가해 401 응답 시 자동 refresh → 1회 재시도하는 패턴을 제공한다.
서버 API 호출 레이어에서 `withCsrfRetry`가 CSRF 403을 처리하는 것과 대칭되는 클라이언트 레이어 컨벤션이다.

### 신규 API

```typescript
// AuthContext에 추가
withAuthRetry<T>(fn: () => Promise<T>): Promise<T>

// AuthProvider에 추가
interface AuthProviderProps {
  onUnauthenticated?: () => void;  // refresh 실패 시 로그인 리다이렉트 진입점
}
```

### 동작 흐름

```
withAuthRetry(fn)
  try → fn()
    성공           → 반환
    401            → sdk.refresh()
                      성공  → fn() 재시도 1회
                      실패  → setUser(null) + onUnauthenticated?.() + throw
    401 외 에러    → 즉시 throw
```

### startup 401 복구

기존: `getCurrentUser()` 실패 시 무조건 `isLoading=false` (user null 고정)

변경: `getCurrentUser()` 401 → `sdk.refresh()` → `getCurrentUser()` 재시도
→ 탭 비활성 후 재진입 시 accessToken 만료 케이스에서 로그인 화면 없이 user 복구

### 변경 파일

| 파일 | 변경 |
|---|---|
| `packages/frontend/auth-react/src/context.ts` | `AuthContextValue`에 `withAuthRetry` 추가 |
| `packages/frontend/auth-react/src/provider.tsx` | `withAuthRetry` 구현 + `onUnauthenticated` prop + startup 401 복구 |
| `packages/frontend/auth-react/src/provider.test.tsx` | 케이스 4개 추가 (24/24 PASS) |

## 검증

- `pnpm --filter @repo/frontend-auth-react test` → 24/24 PASS
- `pnpm turbo run typecheck` → 48/48 PASS

## 커밋 목록

- `test(spec-x-auth-token-refresh-interceptor)`: withAuthRetry + startup 복구 테스트 (Red)
- `feat(spec-x-auth-token-refresh-interceptor)`: AuthProvider withAuthRetry + startup 401 복구
