# Implementation Plan: spec-x — http-client 401 자동 refresh 인터셉터

## 📋 Branch Strategy

- 브랜치: `spec-x-auth-token-refresh-interceptor` (base: `main`)

## 🎯 핵심 전략

### 변경 범위

```
packages/frontend/http-client/src/index.ts      ← onUnauthorized 옵션 + afterResponse hook
packages/frontend/http-client/src/index.test.ts ← 4개 신규 케이스
packages/frontend/auth-react/src/provider.tsx   ← startup 401 복구
packages/frontend/auth-react/src/provider.test.tsx ← 1개 신규 케이스
```

### http-client: afterResponse 훅 설계

```
afterResponse(request, options, response):
  response.status !== 401  → 무시 (undefined 반환, ky 정상 처리)
  onUnauthorized 없음      → 무시
  ↓
  onUnauthorized() 호출
    성공 → fetch(request.clone()) 재시도 → Response 반환 (ky가 ok 체크)
    실패 → response 반환 (ky가 401 HTTPError → AppError(statusCode:401))
  재시도 body clone 실패 → response 반환 (graceful fallback)
```

**왜 `fetch(request.clone())` 인가?**
- ky 인스턴스로 재시도하면 afterResponse 훅이 다시 발동 → 무한루프 위험
- `fetch` 직접 호출 = ky 훅 우회 → 재시도는 정확히 1회로 보장
- 재시도 응답이 다시 401이면 ky가 HTTPError를 throw → AppError(statusCode:401)

### AuthProvider: startup 복구

```typescript
.catch(async (e) => {
  if (is401(e)) {
    try { await sdk.refresh(); setUser(await sdk.getCurrentUser()); }
    catch { setUser(null); }
  }
  setIsLoading(false);
});
```

SDK의 `getCurrentUser()`가 http-client를 통하지 않을 수 있으므로 Provider에서도 처리.

### 주요 결정

| 결정 | 이유 |
|---|---|
| `onUnauthorized` 콜백 주입 | http-client가 auth-sdk/React에 결합하지 않음 |
| `fetch` 직접 호출로 재시도 | hook 재진입 무한루프를 구조적으로 방지 |
| body clone 실패 시 원래 401 전파 | POST body 소진 케이스 graceful 처리 |
| startup 복구는 Provider에 | SDK 내부 구현 불투명 — 방어적으로 양쪽 처리 |

## 📂 Proposed Changes

### [MODIFY] `packages/frontend/http-client/src/index.ts`

```typescript
export interface CreateHttpClientOptions {
  // ... 기존 ...
  /** 401 수신 시 호출 — 통상 sdk.refresh(). throw 시 재시도 없이 401 전파 */
  onUnauthorized?: () => Promise<void>;
}

// createHttpClient 내부 — afterResponse hook 추가:
hooks: {
  afterResponse: [
    async (request, _options, response) => {
      if (response.status !== 401 || !onUnauthorized) return;
      try {
        await onUnauthorized();
      } catch {
        return response; // refresh 실패 → 원래 401 응답 반환
      }
      try {
        return await fetch(request.clone()); // 1회만 재시도 (hook 우회)
      } catch {
        return response; // body 소진 등 clone 실패 → graceful fallback
      }
    },
  ],
},
```

### [MODIFY] `packages/frontend/auth-react/src/provider.tsx`

```typescript
const is401 = (e: unknown): boolean =>
  !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 401;

// useEffect startup:
.catch(async (e) => {
  if (is401(e)) {
    try {
      await sdk.refresh();
      const u = await sdk.getCurrentUser();
      setUser(u);
    } catch { setUser(null); }
  }
  setIsLoading(false);
});
```

## 🧪 검증 계획

```bash
pnpm --filter @repo/frontend-http-client test
pnpm --filter @repo/frontend-auth-react test
pnpm turbo run typecheck
```

## 🔁 Rollback Plan

- `createHttpClient` `onUnauthorized` 옵션 제거 — 기존 API 호환 유지 (optional 추가만이므로 무결)
- auth-react startup catch 블록 원복
