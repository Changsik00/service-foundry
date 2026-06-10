# Spec: spec-x — AuthStore + http-client 인증 통합

## 배경

현재 `@repo/frontend-http-client`는 인증과 완전히 분리되어 있다:
- Authorization 헤더를 직접 붙이지 않음
- public / protected 엔드포인트 구분 없음
- SDK 초기화 완료 여부를 모름 (Firebase 등 비동기 초기화)

`onUnauthorized: () => Promise<void>` 콜백(PR #130)을 시도했지만,
이는 토큰 주입 없이 refresh 트리거만 하는 반쪽짜리 해결책이었다.

## 목표

**역주입(Reverse Injection)**: AuthStore(SDK 상태 소유자)를 http-client에 주입,
http-client가 토큰 획득·갱신·blocking을 직접 위임받아 처리.

## 범위

### 신규 패키지

**`packages/frontend/auth-store`** (`@repo/frontend-auth-store`)
- Zustand vanilla store (`createStore`) — React 의존 없음
- 3-state auth status 관리
- Firebase / Supabase / Native JWT 어댑터
- `AuthSource` 구현 (http-client가 소비하는 인터페이스)

### 수정 패키지

**`packages/auth-contracts`** (`@repo/auth-contracts`)
- `AuthStatus` 타입 추가
- `AuthSource` 인터페이스 추가

**`packages/frontend/http-client`** (`@repo/frontend-http-client`)
- `onUnauthorized` 제거
- `auth?: AuthSource` 옵션 추가
- 매 요청 시 `getToken()` → `Authorization: Bearer` 헤더
- `requiresAuth?: boolean` 요청 플래그
- status-based blocking (`waitUntilSettled`, 기본 5000ms timeout)
- 401 시 `auth.refresh()` → 재시도 1회

**`packages/frontend/auth-react`** (`@repo/frontend-auth-react`)
- `is401` 헬퍼 / startup 401 복구 로직 제거
- AuthStore 어댑터가 startup 복구를 담당하므로 provider.tsx 단순화

## AuthStatus 3-state 설계

```
"unknown"         → SDK 초기화 중 (onAuthStateChanged 콜백 전)
"authenticated"   → 토큰 있음, 로그인 완료
"unauthenticated" → 명확히 로그인 안 된 상태
```

`unknown` ≠ `unauthenticated`: unknown은 "아직 모름", unauthenticated는 "확인했더니 없음".

## AuthSource 인터페이스

```typescript
// @repo/auth-contracts
export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export interface AuthSource {
  readonly status: AuthStatus;
  getToken(): Promise<string | null>;
  refresh(): Promise<void>;
  waitUntilSettled(timeoutMs?: number): Promise<void>;
}
```

## http-client 동작 매트릭스

| status           | requiresAuth | 동작                                              |
|------------------|--------------|---------------------------------------------------|
| `unknown`        | any          | `waitUntilSettled()` 후 아래 분기                |
| `authenticated`  | `false`      | token 붙여서 진행                                 |
| `authenticated`  | `true`       | token 붙여서 진행                                 |
| `unauthenticated`| `false`      | token 없이 진행 (public API)                      |
| `unauthenticated`| `true`       | `AppError("UNAUTHORIZED")` 즉시 throw (요청 안 보냄) |

401 수신 후: `auth.refresh()` → 재시도 1회 (token이 없었으면 refresh 시도 안 함)

## AuthStore 어댑터

```
auth-store/src/adapters/
  firebase.ts      — onAuthStateChanged → store 갱신
  supabase.ts      — onAuthStateChange  → store 갱신
  native-jwt.ts    — startup refresh + localStorage → store 갱신
```

각 어댑터는 `connect*(store, sdk)` 팩토리 함수. SDK 타입은 peer dependency.

## 의존성 방향

```
[Firebase/Supabase/Native SDK]
        ↓ 이벤트 연결 (어댑터)
  [AuthStore — Zustand vanilla]
        ↓ implements AuthSource
   ┌────┴────┐
   │         │
[http-client] [useAuth hook — React (auth-react)]
```

http-client는 React를 모른다. AuthStore는 SDK 구체 구현을 모른다.

## 제외 범위

- concurrent 401 (동시 다중 401 → refresh dedup) — 후속
- SSR 토큰 주입 — 후속
- 토큰 저장소 암호화 — 후속
