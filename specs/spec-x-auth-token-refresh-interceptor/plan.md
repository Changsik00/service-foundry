# Implementation Plan: spec-x-auth-token-refresh-interceptor

## 📋 Branch Strategy

- 신규 브랜치: `spec-x-auth-token-refresh-interceptor`
- 시작 지점: `main`

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [ ] `withAuthRetry`를 `AuthContext`에 노출하는 방향 동의 여부
>   (대안: 별도 `useAuthRetry()` hook으로 분리)
> - [ ] `getCurrentUser` 실패 시 refresh 시도 — 부팅 401 복구 포함 여부 동의

## 🎯 핵심 전략

### 변경 범위

`packages/frontend/auth-react` 3개 파일만 변경. HTTP client / api-api / app 레이어 무변경.

```
AuthProvider (provider.tsx)
  ├── onUnauthenticated?: () => void  ← 새 prop (refresh 실패 시 로그인 리다이렉트 진입점)
  ├── withAuthRetry(fn)               ← 새 메서드
  └── startup: getCurrentUser 401 → refresh 시도

AuthContextValue (context.ts)
  └── withAuthRetry<T>(fn: () => Promise<T>): Promise<T>  ← 추가

useAuth() / useSession() (hooks.ts)
  └── 변경 없음 — withAuthRetry 자동으로 컨텍스트에서 노출
```

### `withAuthRetry` 흐름

```
withAuthRetry(fn)
  try → fn()
    성공   → 반환
    401    → sdk.refresh()
              성공  → fn() 재시도 1회
              실패  → setUser(null) + onUnauthenticated?.() + throw
    401 외 → throw
```

### 401 감지 헬퍼

`auth-api.ts`의 `is403`과 동일 패턴 (덕타이핑, AppError 결합 없음):
```typescript
const is401 = (e: unknown): boolean =>
  !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **위치** | `AuthProvider` / `AuthContext` | SDK 접근권 + React 상태(`setUser`) 동시 필요 |
| **재시도 횟수** | 1회 | `withCsrfRetry`와 동일 제한 — 무한 루프 방지 |
| **401 외 에러** | 즉시 throw | refresh는 인증 에러에만 의미 있음 |
| **refresh 실패 처리** | `setUser(null)` 무조건 + `onUnauthenticated?.()` | 상태 정합성 우선, redirect는 앱이 결정 |
| **startup 복구** | getCurrentUser 401 → refresh → 재조회 | 탭 비활성 후 재진입 시 UX |

### ADR 후보

- [ ] `frontend-auth-retry-strategy` — `withCsrfRetry` / `withAuthRetry` 1회 재시도 컨벤션 (type: convention)

## 📂 Proposed Changes

### [MODIFY] `packages/frontend/auth-react/src/context.ts`

```typescript
export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn(input: SignInInput): Promise<AuthResult>;
  signOut(): Promise<void>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  refresh(): Promise<void>;
  // 추가
  withAuthRetry<T>(fn: () => Promise<T>): Promise<T>;
}
```

### [MODIFY] `packages/frontend/auth-react/src/provider.tsx`

```typescript
interface AuthProviderProps {
  sdk: CoreAuthSDK;
  children: ReactNode;
  onUnauthenticated?: () => void;  // 추가
}

export function AuthProvider({ sdk, children, onUnauthenticated }: AuthProviderProps) {
  // ... 기존 상태

  // 401 감지 — AppError duck-typing (http-client 결합 없음)
  const is401 = (e: unknown): boolean =>
    !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;

  // startup: getCurrentUser 401 → refresh 시도 → 재조회
  useEffect(() => {
    sdk.getCurrentUser()
      .then((u) => { setUser(u); setIsLoading(false); })
      .catch(async (e) => {
        if (is401(e)) {
          try {
            await sdk.refresh();
            const u = await sdk.getCurrentUser();
            setUser(u);
          } catch {
            setUser(null);
          }
        }
        setIsLoading(false);
      });
  }, [sdk]);

  // withAuthRetry: 401 수신 시 refresh → 1회 재시도
  const withAuthRetry = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (e) {
        if (!is401(e)) throw e;
        try {
          await sdk.refresh();
        } catch {
          setUser(null);
          onUnauthenticated?.();
          throw e;
        }
        return await fn();  // 1회만 재시도
      }
    },
    [sdk, onUnauthenticated],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, signUp, refresh, withAuthRetry }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### [MODIFY] `packages/frontend/auth-react/src/provider.test.tsx`

신규 테스트 케이스 3개 추가:

1. `withAuthRetry` — fn 성공 → 그대로 반환 (refresh 미호출)
2. `withAuthRetry` — fn 401 → refresh 성공 → fn 재시도 성공
3. `withAuthRetry` — fn 401 → refresh 실패 → `user = null` + `onUnauthenticated` 호출 + throw

기존 테스트 케이스 1개 수정:

4. `getCurrentUser` 401 → refresh 후 재조회 → user 설정

## 🧪 검증 계획

```bash
pnpm --filter @repo/frontend-auth-react test
pnpm turbo run typecheck
```

## 🔁 Rollback Plan

- `context.ts` / `provider.tsx` revert — 기존 API는 삭제 없이 추가만 (breaking change 없음)

## 📦 Deliverables 체크

- [ ] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
