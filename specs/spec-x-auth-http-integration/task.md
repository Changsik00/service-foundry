# Task List: spec-x — AuthStore + http-client 인증 통합

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: auth-contracts 타입 추가 ✅

- [x] `packages/shared/auth-contracts/src/index.ts` — `AuthStatus` 타입 + `AuthSource` 인터페이스 추가
- [x] 테스트 3개 추가 → PASS

**Commit**: `feat(spec-x-auth-http-integration): AuthStatus + AuthSource 계약 추가`

---

## Task 2: auth-store 패키지 신규 생성 ✅

- [x] `packages/frontend/auth-store/package.json` 신규
- [x] `packages/frontend/auth-store/tsconfig.json` 신규
- [x] `packages/frontend/auth-store/vitest.config.ts` 신규
- [x] `src/store.ts` — Zustand vanilla `createStore`
- [x] `src/source.ts` — `AuthSource` 구현 + `waitUntilSettled`
- [x] `src/adapters/firebase.ts` — `connectFirebaseAuth`
- [x] `src/adapters/supabase.ts` — `connectSupabaseAuth`
- [x] `src/adapters/native-jwt.ts` — `connectNativeJwt`
- [x] `src/index.ts` — 전체 export
- [x] 26/26 테스트 PASS
- [x] `pnpm turbo run typecheck` PASS

**Commit**: `feat(spec-x-auth-http-integration): auth-store 패키지 신규 생성 (Zustand + 어댑터)`

---

## Task 3: http-client 개선 ✅

- [x] `CreateHttpClientOptions` — `auth?: AuthSource` 추가
- [x] `HttpRequestOptions` — `requiresAuth?: boolean` 추가
- [x] `request()` — `waitUntilSettled`(requiresAuth만) + 토큰 주입 + blocking + 401 refresh 재시도
- [x] `isUnauthorized` 헬퍼 + `attempt(tok)` 패턴 (refresh 후 새 토큰)
- [x] 23/23 테스트 PASS

**Commit**: `feat(spec-x-auth-http-integration): http-client auth 주입 (blocking + 토큰 자동 주입)`

---

## Task 4: auth-react 정리 ✅

- [x] `provider.tsx` — main 브랜치 이미 clean 상태 확인 → 변경 불필요
- [x] 20/20 테스트 PASS

---

## Task 5: web-next Supabase wiring

> `@repo/frontend-auth-supabase` (기존) + `@repo/frontend-auth-store` (신규) 연결
> 두 패키지가 동일한 Supabase 클라이언트(`sdk.supabase.rls`) 공유

- [ ] `apps/web-next/package.json` — `@repo/frontend-auth-store` 의존성 추가
- [ ] `apps/web-next/src/lib/supabase-auth.ts` 신규
  - `createSupabaseAuthSDK` → `sdk` (UI용 CoreAuthSDK)
  - `createAuthStore` + `connectSupabaseAuth(store, sdk.supabase.rls)` → `source` (http용 AuthSource)
  - `sdk`, `source`, `unsubscribe` export
- [ ] `apps/web-next/src/lib/http-client.ts` 수정 — `auth: source` 주입
- [ ] `apps/web-next/src/components/providers.tsx` 수정 — `sdk` import 경로 변경
- [ ] `apps/web-next/src/lib/auth.ts` 수정 또는 제거
- [ ] `.env.local.example` (또는 `.env.example`) — Supabase 환경변수 추가
- [ ] `pnpm turbo run typecheck` PASS

**Commit**: `feat(spec-x-auth-http-integration): web-next Supabase auth 연결 (wiring)`

---

## Task 6: Playwright e2e

- [ ] `apps/web-next/package.json` — `@playwright/test` devDependency 추가
- [ ] `apps/web-next/playwright.config.ts` 신규
  - `webServer`: `next dev --port 2027`
  - `use.baseURL`: `http://localhost:2027`
- [ ] `apps/web-next/e2e/fixtures.ts` — 테스트 유저 생성/삭제 (SUPABASE_SERVICE_ROLE_KEY)
- [ ] `apps/web-next/e2e/auth.spec.ts` — 로그인/로그아웃 플로우
- [ ] `apps/web-next/e2e/http-auth.spec.ts`
  - 로그인 후 → Authorization 헤더 자동 주입 확인
  - 401 → refresh → 재시도 1회 확인
  - public 요청 → 토큰 없이 즉시 진행
  - unauthenticated + requiresAuth → AppError(401) UI 반영
- [ ] `.github/workflows/e2e.yml` 신규 또는 기존 workflow 업데이트
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` secrets 참조
  - `playwright install --with-deps chromium`
- [ ] e2e 전체 PASS

**Commit**: `feat(spec-x-auth-http-integration): Playwright e2e (auth + 토큰 주입 검증)`

---

## Task 7: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/frontend-auth-store test` PASS (26/26)
- [ ] `pnpm --filter @repo/frontend-http-client test` PASS (23/23)
- [ ] `pnpm --filter @repo/frontend-auth-react test` PASS (20/20)
- [ ] `pnpm turbo run typecheck` PASS
- [ ] Playwright e2e PASS

### 📝 산출물

- [x] walkthrough.md 작성 (Task 1~4)
- [ ] walkthrough.md 업데이트 — Task 5, 6 섹션 추가
- [ ] pr_description.md 업데이트 — Supabase wiring + e2e 반영
- [ ] **Ship Commit**: `docs(spec-x-auth-http-integration): walkthrough + pr_description 업데이트 (wiring + e2e)`

### 🚀 Push & PR

- [ ] `git push origin spec-x-auth-http-integration`
- [ ] PR #131 업데이트 확인
