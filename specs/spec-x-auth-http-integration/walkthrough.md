# Walkthrough: spec-x — AuthStore + http-client 인증 통합

## 변경 개요

"역주입(Reverse Injection)" 패턴: AuthStore(SDK 상태 소유자)를 http-client에 주입하여
http-client가 토큰 획득·갱신·blocking을 직접 위임받아 처리하도록 설계.

기존 `onUnauthorized: () => Promise<void>` 콜백(PR #130) 방식은 토큰 주입 없이
refresh 트리거만 하는 반쪽짜리 해결책이었음. 이를 전면 재설계.

---

## Task 1 — auth-contracts 타입 추가

### AuthStatus 3-state 설계 결정

`"initializing" | "ready"` 대신 인증 상태 자체로 표현:
- `"unknown"` — SDK 초기화 중 (Firebase `onAuthStateChanged` 콜백 전)
- `"authenticated"` — 토큰 있음, 로그인 완료
- `"unauthenticated"` — 명확히 로그인 안 된 상태

`unknown` ≠ `unauthenticated`: 전자는 "아직 모름", 후자는 "확인했더니 없음".
http-client가 이 둘을 다르게 처리해야 하기 때문에 3-state가 필요.

### AuthSource 최소 계약

```typescript
export interface AuthSource {
  readonly status: AuthStatus;
  getToken(): Promise<string | null>;       // null = 미인증 or 초기화 전
  refresh(): Promise<void>;                 // 401 수신 시 호출
  waitUntilSettled(timeoutMs?: number): Promise<void>;  // unknown 대기
}
```

---

## Task 2 — auth-store 패키지 신규 생성

### Zustand vanilla store 선택 이유

React Context API 대신 Zustand vanilla(`createStore`)를 선택:
- `store.getState()` — React 트리 밖(http-client 내부)에서도 동기 접근 가능
- `store.subscribe()` — `waitUntilSettled`의 status 전환 감지에 활용
- TanStack Query와 역할 분리: Zustand = 토큰/세션 상태, TanStack Query = user 프로필 fetch

### waitUntilSettled timeout 설계

timeout 만료 시 reject가 아닌 resolve 선택:
- SDK 초기화 실패 시에도 요청이 eventually 진행되어야 함
- 공개 API는 `unknown` 상태에서도 block되어선 안 됨
- timeout = 5000ms (기본값)

### SDK 어댑터 패턴

각 어댑터는 SDK 이벤트를 store에 연결하고 `refresh` 구현을 제공:

```typescript
connectFirebaseAuth(store, firebaseAuth)  → { source, unsubscribe }
connectSupabaseAuth(store, supabaseClient) → { source, unsubscribe }
connectNativeJwt(store, opts)              → Promise<{ source }>
```

Native JWT는 startup 시 stored token → refresh를 비동기로 처리하므로 `async`.

### Firebase 어댑터 한계

Firebase UID는 UUID 형식이 아님 → `User.id` 에 Firebase UID를 임시 저장.
앱 레벨에서 `/me` API로 실제 User 레코드를 채우는 것을 권장 (후속 개선 대상).

---

## Task 3 — http-client 개선

### 요청 처리 흐름

```
request(opts)
  1. requiresAuth=true 이면만           — auth.waitUntilSettled() (public은 즉시 진행)
  2. requiresAuth=true + unauthenticated — AppError(UNAUTHENTICATED) 즉시 throw (fetch 없음)
  3. auth.getToken()                    — token 획득 (null이면 헤더 없음)
  4. attempt(token)                    — Authorization: Bearer 붙여서 ky 요청
  5. 401 + token 있었으면              — auth.refresh() → attempt(새 토큰) 재시도 1회
     401 + token 없었으면              — refresh 시도 안 함, 즉시 throw
```

### requiresAuth=true 일 때만 waitUntilSettled

public API는 Firebase SDK가 초기화 중(unknown)이어도 즉시 진행.
protected API만 settled(authenticated or unauthenticated) 상태를 보장받은 후 진행.

```typescript
if (auth && opts.requiresAuth) await auth.waitUntilSettled();
```

### attempt(tok) 패턴 — 재시도 시 새 토큰

token을 `attempt()` 외부에서 캡처하면 refresh 후에도 OLD 토큰이 사용되는 버그 발생.
token을 `attempt(tok)` 인자로 받아 호출 시점마다 새로 주입:

```typescript
const attempt = async (tok: string | null): Promise<T> => {
  const kyOpts = {
    ...baseKyOpts,
    headers: { ...(tok ? { authorization: `Bearer ${tok}` } : {}), ...opts.headers },
  };
  // ...
};

const token = auth ? await auth.getToken() : null;
try {
  return await attempt(token);               // 구 토큰
} catch (e) {
  if (!isUnauthorized(e) || !auth || !token) throw e;
  try { await auth.refresh(); } catch { throw e; }
  return await attempt(await auth.getToken()); // 새 토큰
}
```

### isUnauthorized 헬퍼 + guard clause

`@repo/errors`의 `isAppError`를 활용, &&체인 대신 early throw로 indent 절감:

```typescript
const isUnauthorized = (e: unknown): e is AppError => isAppError(e) && e.statusCode === 401;

// guard clause
if (!isUnauthorized(e) || !auth || !token) throw e;
try { await auth.refresh(); } catch { throw e; }
return await attempt(await auth.getToken());
```

### 무한 루프 없음

`attempt()`는 `request()`를 재귀하지 않는 내부 클로저.
두 번째 `attempt()` 호출이 401을 던지면 catch 블록 밖으로 전파 → caller에게 throw.
구조적으로 fetch 최대 2회 상한. ky도 401은 retry 안 함(`RETRY_STATUS_CODES`에 미포함).

---

## Task 5 — web-next Supabase wiring

### 연결 구조

```
Supabase 클라이언트 1개 공유
  ├─ createSupabaseAuthSDK  → sdk (CoreAuthSDK)  → AuthProvider (signIn/signOut UI)
  └─ connectSupabaseAuth    → source (AuthSource) → createHttpClient({ auth: source })
```

`sdk.supabase.rls`를 통해 두 시스템이 동일한 Supabase 클라이언트를 공유 → 세션 동기화 자동.

### 환경변수

기존 `src/env.ts`의 zod 검증 패턴에 Supabase 변수 추가:

```typescript
NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
```

`@env-kit/node-settings`(Node.js 전용)는 브라우저 번들에 사용 불가 → 동일한 원칙(zod + lazy parse)을 앱 자체 `env.ts`에서 구현.

### 파일 변경

| 파일 | 변경 |
|---|---|
| `src/env.ts` | Supabase 환경변수 2개 추가 |
| `src/lib/supabase-auth.ts` (신규) | SDK + store + connect + export |
| `src/lib/auth.ts` | `sdk as authSDK` re-export로 교체 |
| `src/lib/http-client.ts` | `auth: source` 주입 |
| `package.json` | `@repo/frontend-auth-store`, `@repo/frontend-auth-supabase` 추가 |

---

## Task 6 — Playwright e2e

### 설정

- `playwright.config.ts` — `webServer: pnpm dev`, port 2027, CI reuse 없음
- `e2e/fixtures.ts` — `SUPABASE_SERVICE_ROLE_KEY`로 테스트 유저 생성/삭제 (admin API)
- `e2e/auth.spec.ts` — 로그인/로그아웃 UI 플로우
- `e2e/http-auth.spec.ts` — 토큰 주입 + 401 refresh 헤더 검증

### 테스트 케이스

| 테스트 | 검증 |
|---|---|
| 로그인 성공 | 홈으로 리다이렉트 (`/`) |
| 잘못된 비밀번호 | `role=alert` 메시지 표시 |
| 로그인 후 API 요청 | `Authorization: Bearer` 헤더 존재 |
| 미인증 public 요청 | 헤더 없이 즉시 진행 (차단 없음) |
| 401 → refresh → 재시도 | 네트워크 요청 2회 이상 |

### CI 연동

`.github/workflows/e2e.yml` 신규 생성:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` GitHub Secrets 참조
- Playwright 실패 시 `playwright-report/` artifact 업로드 (7일 보관)

---

## Task 4 — auth-react 정리

main 브랜치의 provider.tsx가 이미 clean 상태 (spec-x-auth-token-refresh-interceptor 브랜치는
닫혀 main에 미머지) → 변경 불필요, 테스트 20/20 PASS.

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `@repo/frontend-auth-store` (26 tests) | ✅ PASS |
| `@repo/frontend-http-client` (23 tests) | ✅ PASS |
| `@repo/frontend-auth-react` (20 tests) | ✅ PASS |
| `pnpm turbo run typecheck` (54 packages) | ✅ PASS |

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| Zustand vanilla (React Context 아님) | http-client에서 React 의존 없이 store 접근 |
| 3-state AuthStatus | unknown/unauthenticated 구분이 http-client blocking 로직에 필수 |
| timeout → resolve (reject 아님) | SDK 초기화 실패 시 무한 blocking 방지 |
| public은 waitUntilSettled 생략 | auth SDK 초기화 전에도 public API 즉시 사용 가능 |
| attempt(tok) 패턴 | refresh 후 새 토큰으로 재시도 — 캡처된 구 토큰 재사용 버그 방지 |
| token 존재 여부로 refresh 분기 | 미인증 상태에서 온 401에 불필요한 refresh 방지 |
| isUnauthorized + guard clause | &&체인 평탄화, @repo/errors의 isAppError 재사용 |
| Firebase UID → User.id 임시 사용 | /me API 연동은 앱 레이어에서 후속 처리 |
| concurrent 401 dedup — Out of Scope | 동시 다중 401 → refresh 여러 번 가능하나 후속 처리 |

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-10 |
| **PR** | #130 (이전 접근) 닫음 → 이 PR로 대체 |
