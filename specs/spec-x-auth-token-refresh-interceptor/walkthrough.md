# Walkthrough: spec-x — http-client 401 자동 refresh 인터셉터

## 변경 개요

`createHttpClient`에 `onUnauthorized?: () => Promise<void>` 옵션을 추가하여,
401 응답 시 refresh 호출 후 1회 자동 재시도하는 인터셉터를 transport 레이어에 구현했다.
별도로 `AuthProvider` startup 시 `getCurrentUser()` 401 → refresh → 재조회 복구도 추가했다.

---

## Task 1 — TDD Red

### http-client 4개 케이스

- 요청 성공 (2xx) → `onUnauthorized` 미호출, fetch 1회
- 401 → `onUnauthorized` 호출 → 재시도 성공 → 결과 반환, fetch 2회
- 401 → `onUnauthorized` 실패 → AppError(statusCode:401), fetch 1회
- 401 → `onUnauthorized` 성공 → 재시도도 401 → AppError(401), fetch 2회, 루프 없음

### auth-react 1개 케이스

- `getCurrentUser()` 401 → `sdk.refresh()` → 재조회 → user 설정

---

## Task 2 — TDD Green

### http-client 구현 결정: ky afterResponse hook → AppError catch 래퍼

최초에 ky `afterResponse` hook 방식을 시도했으나, hook 추가 시 기존 테스트 전체가
`AppError(NETWORK)` 로 깨지는 현상이 발생했다. ky 내부에서 hook runner가 response를
처리하는 방식과 충돌한 것으로 판단.

**채택한 방식**: `doRequest` / `request` 분리:

```typescript
// 실제 ky 호출은 doRequest 에서만
const doRequest = async <T>(opts): Promise<T> => { ... };

// request = 401 인터셉터 래퍼
const request = async <T>(opts): Promise<T> => {
  try {
    return await doRequest(opts);
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 401 && onUnauthorized) {
      try { await onUnauthorized(); } catch { throw e; }
      return await doRequest(opts); // 재시도 1회 — 재시도 결과 그대로 return/throw
    }
    throw e;
  }
};
```

이 방식의 장점:
- ky 내부 구현과 완전히 독립 — 버전 의존성 없음
- 재시도 횟수 1회 구조적 보장 (루프 불가)
- `doRequest` → AppError 변환 재사용

### auth-react: startup 401 복구

```typescript
const is401 = (e: unknown): boolean =>
  !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;

// useEffect startup:
.catch(async (e) => {
  if (is401(e)) {
    try { await sdk.refresh(); setUser(await sdk.getCurrentUser()); }
    catch { setUser(null); }
  }
  setIsLoading(false);
});
```

SDK가 http-client를 내부적으로 쓰는지 불명확하므로, Provider에서도 방어적으로 처리.

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `@repo/frontend-http-client` (17 tests) | ✅ PASS |
| `@repo/frontend-auth-react` (21 tests) | ✅ PASS |
| `pnpm turbo run typecheck` (48 packages) | ✅ PASS |

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| ky hook 대신 catch 래퍼 | ky afterResponse hook이 기존 응답 처리와 충돌 |
| `onUnauthorized` 콜백 주입 | http-client가 React / auth-sdk에 결합하지 않음 |
| 재시도 1회 고정 | `withCsrfRetry` 컨벤션 통일, 무한루프 구조적 방지 |
| concurrent 401 처리는 Out of Scope | 동시 다중 401 → refresh 여러 번 가능하나 실용적으로 드문 케이스 |

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-10 |
| **최종 commit** | `9e1ce6f` |
