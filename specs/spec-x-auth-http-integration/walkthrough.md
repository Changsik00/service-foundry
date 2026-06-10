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

---

## Task 4 — Supabase JWKS JWT 검증 (ECC P-256) + full-stack e2e

### 배경: Supabase JWT Signing Keys

신형 Supabase 프로젝트는 HS256(대칭 시크릿) 대신 ECC P-256(비대칭)을 사용.
- `SUPABASE_JWT_SECRET` 존재하지 않음 (Legacy Keys 탭에만 있고 대기 상태)
- 공개키는 `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` JWKS 엔드포인트로 조회

### JWKS 기반 검증

`packages/nestjs/auth-supabase/src/supabase-verifier.ts` 수정:

```typescript
// 신형 (ECC P-256) — JWKS로 공개키 자동 조회
this.jwks = opts.supabaseUrl
  ? createRemoteJWKSet(new URL(`${opts.supabaseUrl}/auth/v1/.well-known/jwks.json`))
  : null;

// verify()에서 선택
if (this.jwks) {
  ({ payload } = await jwtVerify(token, this.jwks));
} else if (this.opts.jwtSecret) {
  // 레거시 HS256
}
```

### role 클레임 매핑

Supabase JWT의 `role` 클레임은 `"authenticated"` — 앱 내부 `Role = z.enum(["user","admin"])`과 불일치.

```typescript
// "authenticated" → "user", "service_role" → "admin"
const role = supabaseRole === "service_role" ? "admin" : "user";
```

### ProviderMeController — 풀스택 e2e 검증 엔드포인트

`apps/api/src/auth/provider-me.controller.ts` 신규 생성:
```typescript
@Get("me")
@UseGuards(AuthGuard)
me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
  return { user };
}
```

### ProviderAuthModule 수정

`ACCESS_TOKEN_VERIFIER`를 직접 export하면 `UnknownExportException` 발생.
import된 모듈(verifierModule)을 re-export하는 방식으로 수정:

```typescript
exports: [AuthGuard, RolesGuard, ProvisionService, verifierModule],
// before:
// exports: [AuthGuard, RolesGuard, ProvisionService, ACCESS_TOKEN_VERIFIER],  // NestJS 불허
```

---

## Task 5 — 루트 .env 통합 및 Supabase 키 이름 표준화

### 배경

기존: 앱마다 `.env` 별도 관리 → 동기화 어려움, `web-next`/`web-vite`/`api` 간 drift 발생.

### 새 구조

```
service-foundry/
├── .env          # 전체 앱 공통 (gitignored)
└── .env.sample   # 키 템플릿 (commit됨)
```

### Supabase 키 이름 (Supabase 대시보드 최신 명칭)

| 구 이름 | 신 이름 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `SUPABASE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |
| `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` → `NEXT_PUBLIC_SUPABASE_URL` (매핑) |

### 각 프레임워크 env 로딩 방식

| 앱 | 방식 |
|---|---|
| `apps/api` | `tsx --env-file-if-exists=../../.env` (Node 네이티브) |
| `apps/web-next` | `next.config.ts`에서 `dotenv.config()` + `nextConfig.env` 매핑 |
| `apps/web-vite` | `vite.config.ts`에서 `loadEnv(mode, "../../")` + `define` 매핑 |
| Playwright | `playwright.config.ts`에서 `dotenv.config()` |
| Drizzle | `drizzle.config.ts`에서 `dotenv.config()` |

### Next.js 브라우저 env 문제 해결

`env.ts`에서 `envSchema.parse(process.env)` 패턴은 서버 전용.
브라우저에서 `process.env`는 `{}` (webpack DefinePlugin은 명시적 참조만 치환).

```typescript
// ❌ 브라우저에서 실패
cached = envSchema.parse(process.env);

// ✅ 명시적 참조 — webpack이 정적 치환
cached = publicEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
```

`env.ts`를 `getEnv()` (RSC 전용 — API_BASE_URL 포함) / `getPublicEnv()` (클라이언트 전용)로 분리.

---

## Task 6 — Playwright e2e (full-stack: apps/api + apps/web-next)

### 두 서버 동시 기동

```typescript
webServer: [
  { command: "pnpm dev", cwd: "../api", url: "http://localhost:2026/health", ... },
  { command: "pnpm dev", url: "http://localhost:2027", ... },
]
```

### 테스트 케이스

| 테스트 | 검증 |
|---|---|
| 로그인 성공 | 홈으로 리다이렉트 (`/`) |
| 잘못된 비밀번호 | `role=alert` 메시지 표시 |
| 로그인 후 API 요청 | `Authorization: Bearer` 헤더 존재 |
| **로그인 후 GET /auth/me** | **apps/api JWKS 검증 → 200 + user.sub 반환** |
| **미인증 GET /auth/me** | **401 반환** |
| 미인증 public 요청 | 헤더 없이 즉시 진행 |
| 401 → refresh → 재시도 | 네트워크 요청 2회 이상 |

---

## 검증 결과

| 항목 | 결과 |
|---|---|
| `@repo/frontend-auth-store` (26 tests) | ✅ PASS |
| `@repo/frontend-http-client` (23 tests) | ✅ PASS |
| `@repo/frontend-auth-react` (20 tests) | ✅ PASS |
| `pnpm turbo run typecheck` | ✅ PASS |
| **Playwright e2e (7/7)** | **✅ PASS** |

---

## 결정 및 트레이드오프

| 결정 | 이유 |
|---|---|
| JWKS (createRemoteJWKSet) | Supabase 신형 프로젝트는 ECC P-256 — SUPABASE_JWT_SECRET 없음 |
| "authenticated" → "user" 매핑 | Supabase role 클레임이 앱 내부 Role enum과 다름 |
| verifierModule re-export | NestJS는 import된 모듈의 토큰을 직접 export 불허 |
| getPublicEnv() 분리 | 브라우저 process.env는 빈 객체 — 명시적 참조 필수 |
| 루트 .env 단일화 | 앱 3개 + Playwright가 동일 값 공유 — 동기화 drift 제거 |
| PUBLISHABLE_KEY / SECRET_KEY | Supabase 대시보드 최신 명칭 반영 |
| ProviderMeController 추가 | ANON_KEY 없는 순수 서버사이드 검증 경로 필요 |
| orgId: null 허용 | 프로비저닝 제거 없이 e2e 통과 — org 없이도 sub/role 반환 |

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-09 ~ 2026-06-10 |
| **PR** | #130 (이전 접근) 닫음 → 이 PR로 대체 |
