# spec-x-auth-token-refresh-interceptor: 401 자동 갱신 인터셉터

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-auth-token-refresh-interceptor` |
| **Phase** | `phase-x` |
| **Branch** | `spec-x-auth-token-refresh-interceptor` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-06-09 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

서버는 access token 만료 시 정확히 401을 반환하며, refresh token rotation과 family 격리도 완전히 구현되어 있다
(`packages/backend/auth-session`, `apps/api/src/auth/signin.service.ts`).

클라이언트는 CSRF 403 자가복구(`auth-api.ts`의 `withCsrfRetry`)는 구현됐지만
**401 자동 갱신은 없다.**

- `packages/frontend/http-client`: 401을 그냥 `AppError(statusCode: 401)`로 throw
- `packages/frontend/auth-react/src/provider.tsx`: `getCurrentUser()` 오류 시 `setIsLoading(false)`만
- `apps/web-next/src/lib/auth-sdk.ts`: `refresh()`는 수동 호출만 가능

### 문제점

access token TTL(~15분) 초과 시:

```
API 호출 → 401
  ↓
클라이언트: AppError throw (현재)
  ↓
사용자: 에러 화면 or 강제 로그아웃
```

refresh token은 유효(~30일)하므로 사용자가 전혀 모르게 갱신할 수 있음에도 에러가 노출된다.

### 해결 방안 (요약)

`packages/frontend/auth-react`에 `withAuthRetry(fn)` 헬퍼를 추가한다.
앱 코드가 이 헬퍼로 API 호출을 감싸면 401 수신 시 자동으로 refresh → retry 1회를 수행하고,
refresh도 실패하면 `user = null` 처리 후 `onUnauthenticated()` 콜백을 호출(로그인 리다이렉트 진입점).

`withCsrfRetry` 패턴과 동일한 결을 유지 — 무한 재시도 없이 **1회만** 재시도.

## 📊 흐름

```
앱 코드: withAuthRetry(() => apiClient.getSomeData())
  ├── try fn()
  │     ├── 성공 → 반환 (투명, 사용자 체감 없음)
  │     └── 401 catch
  │           ├── sdk.refresh() 호출
  │           │     ├── 성공 → retry fn() 한 번
  │           │     │     ├── 성공 → 반환 (사용자 체감 없음)
  │           │     │     └── 실패 → throw (refresh 후에도 실패, 비정상)
  │           │     └── 실패(refresh token 만료/revoke)
  │           │           ├── setUser(null)
  │           │           ├── onUnauthenticated?.() 호출
  │           │           └── 원 401 에러 throw
  │     └── 401 아닌 에러 → 그대로 throw
  └── ...
```

## 🎯 요구사항

### Functional Requirements

1. `AuthContext`에 `withAuthRetry<T>(fn: () => Promise<T>): Promise<T>` 추가
2. `useAuth()` 훅을 통해 `withAuthRetry` 노출
3. `AuthProvider` props에 `onUnauthenticated?: () => void` 추가
   - refresh 실패 시 `setUser(null)` 후 호출
4. `AuthProvider` 부팅 시(`getCurrentUser`) 401 복구
   - `getCurrentUser` 실패 → `sdk.refresh()` → 재시도 → 실패 시 `user = null`
5. `withAuthRetry`는 401 에 대해서만 재시도 — 다른 오류(403, 500 등)는 즉시 throw

### Non-Functional Requirements

1. `withCsrfRetry`와 동일한 **1회 재시도** 제한 — 무한 루프 방지
2. `onUnauthenticated` 미전달 시에도 `setUser(null)`은 항상 수행 (상태 정합성)
3. `packages/frontend/auth-react` 단독 변경 — http-client/http-client는 건드리지 않음

## 🚫 Out of Scope

- **B 방식 (Proactive rotation)**: exp 기반 만료 직전 선제 갱신 → 후속 제안으로 남김 (§ 아래)
- `apps/web-next/src/lib/auth-api.ts` 변경 (auth-flow 전용 호출, 앱 API와 다른 컨텍스트)
- `packages/frontend/http-client` 401 인터셉터 추가 (SDK 계층에서 처리하는 것이 응집성 ↑)
- Firebase / Supabase provider 모드의 access token 갱신 (각 provider SDK가 자체 처리)
- access token을 Authorization 헤더로 보내는 메커니즘 표준화 (현재 보일러플레이트 미완성 부분, 별도 spec)

## 💡 B 방식 제안 (후속 검토용)

> **Proactive Token Rotation** — exp 체크 후 만료 직전 선제 갱신
>
> - `SignResponse`에 `expiresAt: string` 추가 → auth-sdk에 저장
> - `AuthProvider`에 `useEffect` 타이머: 만료 2분 전 자동 `refresh()` 호출
> - 사용자가 401을 아예 안 만남 (UX 최상)
> - 구현 복잡도: 타이머 관리 + 탭/포커스 재진입 처리 + contracts 변경 필요
> - **추천 진입 시점**: phase-19 이후 UX 개선 phase, 또는 사용자 불만이 실제로 보고된 이후

## 📑 ADR 후보

- [ ] ADR 가치 있는 결정 있음 → `frontend-auth-retry-strategy` (type: convention) — `withCsrfRetry` / `withAuthRetry` 동일 패턴을 conventions로 문서화
- [ ] 없음

## 🔗 관련 문서

- 관련 ADR: `docs/adr/0013-session-lifecycle.md` (refresh rotation)
- 관련 Spec: `specs/spec-18-05-firebase-custom-token/` (auth 흐름 참고)
- 관련 Icebox: `backlog/queue.md` — "web-next CSRF 403 자가복구 + web-vite/SDK 헤더 동반"

## ✅ Definition of Done

- [ ] `AuthProvider` + `AuthContext` + `useAuth` 단위 테스트 PASS
- [ ] `pnpm --filter @repo/nestjs-auth-react test` → PASS (또는 해당 패키지 test 명령)
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] walkthrough.md / pr_description.md 작성 및 ship commit
- [ ] `spec-x-auth-token-refresh-interceptor` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
