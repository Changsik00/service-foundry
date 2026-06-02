# PR: spec-06-02 — React 인증 어댑터 (@repo/frontend-auth-react)

## 요약

`packages/frontend/auth-react/` 에 `@repo/frontend-auth-react` 패키지를 신설한다. ADR-0006 Decision 2 "Consistent Wrapped SDK" 를 실체화 — `AuthSDK` interface 기반 React 인증 레이어.

## 변경 내용

### `auth-contracts` 확장

- `AuthSDK` interface 추가 (Core Surface) — `signIn` / `signOut` / `getCurrentUser` / `signUp` / `refresh`

### 신규 패키지: `packages/frontend/auth-react/` (`@repo/frontend-auth-react`)

| 파일 | 내용 |
|---|---|
| `src/context.ts` | `AuthContextValue` + `AuthContext` |
| `src/provider.tsx` | `<AuthProvider sdk={sdk}>` — mount 시 `getCurrentUser()` 초기화 |
| `src/hooks.ts` | `useAuth()` (actions 포함) / `useSession()` (read-only) |
| `src/guards.tsx` | `<RequireAuth>` / `<RequireRole role="admin">` |
| `src/index.ts` | 모든 public export |
| `src/provider.test.tsx` | AuthProvider + useAuth + useSession 테스트 (6케이스) |
| `src/guards.test.tsx` | RequireAuth + RequireRole 테스트 (5케이스) |

## 테스트

```
Tests       11 passed (11)
Test Files  2 passed (2)
```

- `AuthProvider`: mount/null user/외부 호출 에러/signIn/signOut/useSession (6케이스)
- `RequireAuth`: isLoading/미인증/인증 (3케이스)
- `RequireRole`: role 불일치/일치 (2케이스)

## 주요 결정

1. **`AuthSDK` 위치**: `auth-contracts` — future auth-firebase 패키지의 역방향 의존 방지.
2. **상태 모델**: `{ user, isLoading }` — Session 별도 추적 없음. Cookie 전략(spec-06-03) 이후 결정.
3. **peerDependency**: `react ^19.0.0` — 번들에 React 미포함.

## 체크리스트

- [x] 단위 테스트 PASS (11 tests)
- [x] `pnpm typecheck` PASS (26 packages)
- [x] `biome check src/` PASS
- [x] walkthrough.md 작성
- [x] pr_description.md 작성
