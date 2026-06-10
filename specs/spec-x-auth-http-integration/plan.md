# Plan: spec-x — AuthStore + http-client 인증 통합

## 구현 순서 원칙

의존 방향에 따라 하위 계층부터:
`auth-contracts` → `auth-store` → `http-client` → `auth-react`

---

## Task 1: auth-contracts 타입 추가

**대상**: `packages/auth-contracts/src/`

### 변경

```typescript
// auth-status.ts (신규)
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

// auth-source.ts (신규)
export interface AuthSource {
  readonly status: AuthStatus;
  getToken(): Promise<string | null>;
  refresh(): Promise<void>;
  waitUntilSettled(timeoutMs?: number): Promise<void>;
}

// index.ts — 두 타입 re-export 추가
```

### TDD
- `AuthStatus` 타입 — 값 검사 테스트 (타입 레벨, vitest-type)
- `AuthSource` 인터페이스 — 구현체 mock 검증

**One Commit**: `feat(spec-x-auth-http-integration): AuthStatus + AuthSource 계약 추가`

---

## Task 2: auth-store 패키지 신규 생성

**대상**: `packages/frontend/auth-store/` (신규)

### 파일 구조

```
packages/frontend/auth-store/
  package.json
  tsconfig.json
  src/
    store.ts          — Zustand vanilla createStore
    source.ts         — AuthSource 구현 (store → AuthSource 어댑터)
    adapters/
      firebase.ts     — connectFirebaseAuth(store, firebaseAuth)
      supabase.ts     — connectSupabaseAuth(store, supabaseClient)
      native-jwt.ts   — connectNativeJwt(store, opts)
    index.ts
  src/__tests__/
    store.test.ts
    source.test.ts
    adapters/
      firebase.test.ts
      supabase.test.ts
      native-jwt.test.ts
```

### AuthStoreState

```typescript
interface AuthStoreState {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  setAuthenticated(user: User, token: string): void;
  setUnauthenticated(): void;
  setToken(token: string): void;  // refresh 후 토큰만 갱신
}
```

### waitUntilSettled 구현

```typescript
// source.ts
waitUntilSettled(timeoutMs = 5000): Promise<void> {
  if (store.getState().status !== "unknown") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs); // timeout → settle (block 안 함)
    const unsub = store.subscribe((s) => {
      if (s.status !== "unknown") { clearTimeout(timer); unsub(); resolve(); }
    });
  });
}
```

> timeout 시 reject 아닌 resolve — unknown 상태로 영원히 blocking하지 않음.
> SDK 초기화 실패 시에도 요청이 eventually 진행될 수 있도록.

### 어댑터 설계

```typescript
// firebase.ts
export function connectFirebaseAuth(
  store: AuthStore,
  auth: FirebaseAuth,  // peer dep: firebase/auth
): () => void {  // unsubscribe 반환
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      store.getState().setUnauthenticated();
      return;
    }
    const token = await firebaseUser.getIdToken();
    store.getState().setAuthenticated(toUser(firebaseUser), token);
  });
}

// supabase.ts
export function connectSupabaseAuth(
  store: AuthStore,
  client: SupabaseClient,  // peer dep: @supabase/supabase-js
): () => void {
  const { data: { subscription } } = client.auth.onAuthStateChange(
    async (_event, session) => {
      if (!session) { store.getState().setUnauthenticated(); return; }
      store.getState().setAuthenticated(toUser(session.user), session.access_token);
    }
  );
  return () => subscription.unsubscribe();
}

// native-jwt.ts
interface NativeJwtOptions {
  getStoredToken(): string | null;
  refresh(): Promise<{ token: string; user: User }>;
}

export async function connectNativeJwt(
  store: AuthStore,
  opts: NativeJwtOptions,
): Promise<void> {
  const token = opts.getStoredToken();
  if (!token) { store.getState().setUnauthenticated(); return; }
  try {
    const { token: fresh, user } = await opts.refresh();
    store.getState().setAuthenticated(user, fresh);
  } catch {
    store.getState().setUnauthenticated();
  }
}
```

**One Commit**: `feat(spec-x-auth-http-integration): auth-store 패키지 신규 생성 (Zustand + 어댑터)`

---

## Task 3: http-client 개선

**대상**: `packages/frontend/http-client/src/index.ts`

### 인터페이스 변경

```typescript
// Before
interface CreateHttpClientOptions {
  onUnauthorized?: () => Promise<void>;
}

// After
interface CreateHttpClientOptions {
  auth?: AuthSource;  // import from @repo/auth-contracts
}

// HttpRequestOptions 에 추가
interface HttpRequestOptions<T> {
  requiresAuth?: boolean;  // default: false
}
```

### request() 로직 변경

```typescript
const request = async <T>(opts: HttpRequestOptions<T>): Promise<T> => {
  const { auth } = options;

  // 1. unknown 상태 대기
  if (auth) await auth.waitUntilSettled();

  // 2. protected API + 미인증 → 즉시 거부
  if (opts.requiresAuth && auth?.status === "unauthenticated") {
    throw new AppError({ code: "UNAUTHORIZED", message: "인증 필요", statusCode: 401 });
  }

  // 3. 토큰 주입
  const token = auth ? await auth.getToken() : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const attempt = async (): Promise<T> => {
    // ... authHeaders 를 kyOpts.headers 에 병합 ...
  };

  try {
    return await attempt();
  } catch (e) {
    if (e instanceof AppError && e.statusCode === 401 && auth && token) {
      // 토큰이 있었던 경우만 refresh 시도 (token 없으면 refresh 의미 없음)
      try { await auth.refresh(); } catch { throw e; }
      return await attempt();
    }
    throw e;
  }
};
```

### 테스트 케이스 (신규/수정)

| 케이스 | 설명 |
|---|---|
| auth 없음 | 기존 동작 유지 (Authorization 헤더 없음) |
| authenticated + requiresAuth=false | token 붙여서 진행 |
| authenticated + requiresAuth=true | token 붙여서 진행 |
| unauthenticated + requiresAuth=false | token 없이 진행 |
| unauthenticated + requiresAuth=true | AppError(401) 즉시 throw, fetch 0회 |
| unknown → authenticated → proceed | waitUntilSettled 후 진행 |
| unknown → timeout | timeout 후 unauthenticated처럼 동작 |
| authenticated + 401 + token 있음 | refresh → 재시도 |
| authenticated + 401 + token 없음 | refresh 안 함, 즉시 throw |
| onUnauthorized 제거 확인 | 이전 API 없음 |

**One Commit**: `feat(spec-x-auth-http-integration): http-client auth 주입 (blocking + 토큰 자동 주입)`

---

## Task 4: auth-react 정리

**대상**: `packages/frontend/auth-react/src/provider.tsx`

### 제거

- `is401` 헬퍼 (모듈 최상위)
- `useEffect` 내 startup 401 복구 블록 (Firebase 어댑터가 담당)

### 변경 후 useEffect

```typescript
useEffect(() => {
  sdk.getCurrentUser()
    .then((u) => { setUser(u); setIsLoading(false); })
    .catch(() => { setUser(null); setIsLoading(false); });
}, [sdk]);
```

> SDK 어댑터(connectFirebaseAuth 등)가 onAuthStateChanged를 통해
> 인증 복구를 처리하므로 Provider에서 401 핸들링 불필요.

**One Commit**: `refactor(spec-x-auth-http-integration): auth-react provider 단순화`

---

## Task 5: Ship

- walkthrough.md 작성
- pr_description.md 작성
- Commit: `docs(spec-x-auth-http-integration): ship walkthrough and pr description`
- Push → PR 생성

---

## 의존 패키지 추가 필요

| 패키지 | 추가 dep |
|---|---|
| `auth-store` | `zustand`, `@repo/auth-contracts` |
| `auth-store` adapters | `firebase` (peer), `@supabase/supabase-js` (peer) |
| `http-client` | `@repo/auth-contracts` |
