# Walkthrough: spec-x-auth-token-refresh-interceptor

## 변경 개요

`AuthProvider`에 `withAuthRetry(fn)` 메서드와 startup 401 복구 로직을 추가했다.
native Bearer 토큰이 만료됐을 때 자동으로 refresh → 1회 재시도하는 패턴으로,
`auth-api.ts`의 `withCsrfRetry` 컨벤션을 클라이언트 레이어에 대칭 적용한 것이다.

---

## Task 1 — TDD Red

`context.ts`에 `withAuthRetry<T>` 시그니처 추가, `provider.tsx`에 stub (`throw new Error("not implemented")`), `provider.test.tsx`에 4개 신규 케이스 추가.

새 케이스:
- `withAuthRetry` fn 성공 → 그대로 반환, refresh 미호출
- `withAuthRetry` fn 401 → refresh 성공 → fn 재시도 반환
- `withAuthRetry` fn 401 → refresh 실패 → user=null + onUnauthenticated + throw
- `getCurrentUser` 401 → refresh → 재조회 → user 설정 (startup 복구)

결과: 4 FAIL (Red 확인)

---

## Task 2 — TDD Green

### `is401` 헬퍼

모듈 최상위에 정의 — `useCallback` deps 문제를 피하고 단순하게 유지:
```typescript
const is401 = (e: unknown): boolean =>
  !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;
```
`auth-api.ts`의 `is403`과 동일 덕타이핑 패턴. AppError에 결합 없음.

### startup 401 복구

```typescript
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
```

탭 비활성 후 재진입 시 accessToken 만료 → refresh → 재조회로 로딩 플리커 없이 user 복구.

### `withAuthRetry` 구현

```typescript
const withAuthRetry = useCallback(
  async <T,>(fn: () => Promise<T>): Promise<T> => {
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
      return await fn(); // 1회만 재시도
    }
  },
  [sdk, onUnauthenticated],
);
```

### 테스트 패턴 발견

`act(async () => ...)` 내부에서 throw가 발생하면 state flush가 보장되지 않는다.
refresh 실패 케이스에서 `setUser(null)` 후 UI 갱신을 검증하기 위해 에러를 `act` 내부에서 catch:

```typescript
let caughtError: unknown = null;
await act(async () => {
  try { await captured?.(() => Promise.reject(err401)); }
  catch (e) { caughtError = e; }
});
expect(caughtError).toBeTruthy();
await waitFor(() => expect(screen.getByText("no-user")).toBeInTheDocument());
```

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `provider.test.tsx` (24 tests) | ✅ PASS |
| `pnpm turbo run typecheck` (48 packages) | ✅ PASS |

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| `AuthContext`에 `withAuthRetry` 노출 | SDK 접근권 + `setUser` React 상태 동시 필요, 별도 hook 분리보다 단순 |
| 재시도 1회 | `withCsrfRetry` 컨벤션 통일 — 무한 루프 방지 |
| `is401` 모듈 최상위 정의 | `useCallback` exhaustive deps 경고 방지, 컴포넌트 재렌더 무관 |
| `onUnauthenticated` prop | redirect 로직은 앱이 결정, Provider는 상태만 관리 |

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-10 |
| **최종 commit** | `a4022b9` |
