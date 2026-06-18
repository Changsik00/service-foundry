# spec-x-proactive-token-rotation: 액세스 토큰 만료 전 자동 갱신

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-proactive-token-rotation` |
| **Branch** | `spec-x-proactive-token-rotation` |
| **상태** | Planning |
| **타입** | Feature |
| **작성일** | 2026-06-18 |
| **소유자** | dennis |

## 배경 및 문제 정의

### 현재 상황

- 액세스 토큰 TTL = 15분(ADR-0013). 갱신은 **reactive** 만 존재: 요청이 401 → `withCsrfRetry`/refresh 후 재시도(spec-x-auth-token-refresh-interceptor).
- `AuthProvider`(frontend-auth-react)는 `refresh()`를 노출하나 **만료 전 선제 갱신(타이머)이 없음**.
- sign/refresh 응답 body 에 `accessToken`(JWT) 포함 → 클라가 `exp` 를 디코드 가능. 단 현재 `auth-sdk.ts` 는 accessToken 을 버리고 user 만 사용.

### 문제점

사용자가 15분 후 첫 요청에서 **401 → 재시도 지연(UX 끊김)** 을 겪는다. 탭을 오래 열어두면 만료된 채 방치되다 다음 액션에서 끊긴다.

### 해결 방안

응답의 `accessToken` JWT 에서 `exp` 를 디코드해, **만료 N초 전 자동 `refresh()`** 하는 선제 타이머를 `AuthProvider` 에 추가한다. 탭 재포커스 시에도 만료 임박/경과면 즉시 갱신. 백엔드/contract(서버 응답 필드) 변경 없이 프론트엔드만으로 구현(토큰 exp 디코드).

## 요구사항

1. JWT `exp` 디코드 유틸 (검증 아님 — 스케줄링용 claim 읽기).
2. SDK 가 액세스 토큰 만료(epoch ms)를 노출: `CoreAuthSDK.getAccessTokenExpiresAt?(): number | null` (optional — provider 모드는 미구현, 자체 갱신).
3. apps/web `auth-sdk.ts`: sign/refresh 시 accessToken 디코드 → 만료 추적 + 위 메서드 구현.
4. `AuthProvider`: 만료 `margin`(기본 60s) 전 자동 `refresh()` → 재스케줄. signOut/unmount 시 타이머 정리.
5. **탭 재포커스**(`visibilitychange`): 표시 전환 시 만료 임박/경과면 즉시 refresh.
6. provider 모드(firebase/supabase)는 `getAccessTokenExpiresAt` 미제공 → 타이머 비활성(회귀 없음).

## Out of Scope

- 서버 응답에 별도 `expiresAt` 필드 추가 (accessToken 디코드로 충분 — 의도 동일, 변경 최소).
- refresh 토큰 로테이션/재사용 감지 (이미 spec-05-02).
- reactive 401 경로 (이미 존재 — 본 spec 은 선제 경로 보강).

## 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **만료 인지** | accessToken JWT `exp` 디코드 | 응답 body 에 이미 존재 → 백엔드/contract 무변경 |
| **SDK 노출** | optional `getAccessTokenExpiresAt()` | provider 모드(자체 갱신)와 분기, 회귀 0 |
| **스케줄** | exp - margin 타이머, refresh 후 재스케줄 | 사용자가 401 자체를 안 만남 |
| **탭 복귀** | visibilitychange 리스너 | 백그라운드에서 만료된 탭 즉시 회복 |

## Proposed Changes

#### [MODIFY] `packages/shared/auth-contracts/src/index.ts`
`CoreAuthSDK` 에 optional `getAccessTokenExpiresAt?(): number | null` 추가.

#### [NEW] JWT exp 디코드 유틸 (frontend-auth-react 또는 shared)
`decodeJwtExp(token): number | null` — base64url payload 의 `exp`(sec) → ms. 파싱 실패 시 null.

#### [MODIFY] `apps/web/src/lib/auth-sdk.ts`
sign/signUp/refresh 응답의 `accessToken` 디코드 → `accessTokenExpiresAt` 추적 + `getAccessTokenExpiresAt()` 구현. signOut 시 null.

#### [MODIFY] `packages/frontend/auth-react/src/provider.tsx`
선제 갱신 useEffect: `getAccessTokenExpiresAt` 존재 시 (exp - margin) 타이머 → `refresh()` → 재스케줄. visibilitychange 리스너. cleanup.

## 검증 계획

```bash
pnpm --filter @repo/frontend-auth-react test   # 타이머(fake timers) + visibility
pnpm --filter @apps/web test                   # auth-sdk exp 추적
```

수동 검증 시나리오:
1. fake timers: exp-margin 도달 → refresh 호출 + 재스케줄 확인
2. getAccessTokenExpiresAt 없음(provider 모드) → 타이머 비활성
3. visibilitychange(visible) + 만료 경과 → 즉시 refresh
4. signOut → 타이머 정리(이후 refresh 호출 없음)

## ✅ Definition of Done

- [ ] decode util + SDK 노출 + provider 타이머 + visibility 구현
- [ ] 단위 테스트(fake timers) 통과, provider 모드 회귀 없음
- [ ] `pnpm turbo run lint typecheck test` 통과
- [ ] `walkthrough.md` / `pr_description.md` ship
- [ ] 브랜치 push + PR
