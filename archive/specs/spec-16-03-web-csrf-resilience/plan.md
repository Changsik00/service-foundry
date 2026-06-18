# Implementation Plan: spec-16-03

## 📋 Branch Strategy
- 신규 브랜치: `spec-16-03-web-csrf-resilience`
- 시작 지점: `phase-16-security-hardening` (phase base)
- PR base = `phase-16-security-hardening`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] **403 식별 = `statusCode === 403` 덕타이핑**: `frontend-http-client` 는 비-2xx 를 `AppError`(statusCode 포함)로 throw. `@repo/errors` import 없이 `(err as { statusCode?: number }).statusCode === 403` 로 판정(결합도 최소).
> - [ ] **재시도 1회 한정**: recursion 아닌 명시적 boolean 가드. 재시도도 403 이면 원 에러 throw.

> [!WARNING]
> - [ ] web-next MFA/passkey/web-vite/SDK 헤더는 본 spec 범위 밖(클라이언트 메서드 부재) → Icebox.

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 403 복구 | `withCsrfRetry(fn)` 래퍼 | signin/signup/signout/refresh 공통 적용, 1회 재발급+재시도 |
| 403 식별 | statusCode 덕타이핑 | @repo/errors 결합 회피, http-client 계약(AppError.statusCode) 활용 |
| 루프 가드 | boolean 플래그(재귀 금지) | 재시도도 403 이면 throw — 무한 재발급 방지 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes

#### [MODIFY] `apps/web-next/src/lib/auth-api.ts`
- `is403(err)` 헬퍼 + `withCsrfRetry<T>(run: () => Promise<T>)` 추가:
```text
const is403 = (e: unknown) => !!e && typeof e === "object" && (e as { statusCode?: number }).statusCode === 403;
const withCsrfRetry = async (run) => {
  await ensureCsrf();
  try { return remember(await run()); }
  catch (e) {
    if (!is403(e)) throw e;
    await fetchCsrf();           // 재부트스트랩
    return remember(await run()); // 1회 재시도 (가드: recursion 없음)
  }
};
```
- signIn/signUp/signOut/refresh 를 `withCsrfRetry(() => http.post(...csrfOpts...))` 로 감싸기. (`csrfOpts` 가 재발급된 최신 토큰을 읽도록 run 안에서 호출.)

#### [NEW] `apps/web-next/src/lib/auth-api.test.ts`
- mock HttpClient(get/post)로:
  1. post 첫 호출 403 → get(csrf) 재호출 → post 재시도 200 성공.
  2. post 가 계속 403 → 최종 throw + post 호출 2회(최초+재시도 1).
  3. post 401/500 → 재시도 없이 즉시 throw (post 1회).

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm --filter @apps/web-next test
```

### 게이트
```bash
pnpm turbo run lint typecheck knip depcruise --filter=@apps/web-next...
```
(전체: `pnpm turbo run lint typecheck test knip depcruise` — 백엔드 test 는 PG 필요)

## 🔁 Rollback Plan
- auth-api.ts 래퍼 추가 한정 → 제거로 revert 안전. 정상 흐름 무영향.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
