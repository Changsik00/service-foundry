# Task List: spec-x — AuthStore + http-client 인증 통합

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: auth-contracts 타입 추가

- [ ] `packages/auth-contracts/src/auth-status.ts` 신규 — `AuthStatus` 타입
- [ ] `packages/auth-contracts/src/auth-source.ts` 신규 — `AuthSource` 인터페이스
- [ ] `packages/auth-contracts/src/index.ts` — re-export 추가
- [ ] Red → Green → Commit

**Commit**: `feat(spec-x-auth-http-integration): AuthStatus + AuthSource 계약 추가`

---

## Task 2: auth-store 패키지 신규 생성

- [ ] `packages/frontend/auth-store/package.json` 신규
- [ ] `packages/frontend/auth-store/tsconfig.json` 신규
- [ ] `src/store.ts` — Zustand vanilla `createStore`
- [ ] `src/source.ts` — `AuthSource` 구현 + `waitUntilSettled`
- [ ] `src/adapters/firebase.ts` — `connectFirebaseAuth`
- [ ] `src/adapters/supabase.ts` — `connectSupabaseAuth`
- [ ] `src/adapters/native-jwt.ts` — `connectNativeJwt`
- [ ] `src/index.ts` — 전체 export
- [ ] 테스트 작성 (Red → Green)
- [ ] `pnpm turbo run typecheck` PASS

**Commit**: `feat(spec-x-auth-http-integration): auth-store 패키지 신규 생성 (Zustand + 어댑터)`

---

## Task 3: http-client 개선

- [ ] `CreateHttpClientOptions` — `onUnauthorized` 제거, `auth?: AuthSource` 추가
- [ ] `HttpRequestOptions` — `requiresAuth?: boolean` 추가
- [ ] `request()` — `waitUntilSettled` + 토큰 주입 + blocking + 401 refresh 재시도
- [ ] 테스트 작성 (Red → Green, 기존 테스트 유지)
- [ ] `pnpm --filter @repo/frontend-http-client test` PASS

**Commit**: `feat(spec-x-auth-http-integration): http-client auth 주입 (blocking + 토큰 자동 주입)`

---

## Task 4: auth-react 정리

- [ ] `provider.tsx` — `is401` 제거, startup 401 복구 블록 제거
- [ ] `provider.test.tsx` — 401 복구 테스트 케이스 제거 (어댑터 테스트로 이동)
- [ ] `pnpm --filter @repo/frontend-auth-react test` PASS

**Commit**: `refactor(spec-x-auth-http-integration): auth-react provider 단순화`

---

## Task 5: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm --filter @repo/frontend-http-client test` PASS
- [ ] `pnpm --filter @repo/frontend-auth-react test` PASS
- [ ] `pnpm --filter @repo/frontend-auth-store test` PASS
- [ ] `pnpm turbo run typecheck` PASS

### 📝 산출물

- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] **Ship Commit**: `docs(spec-x-auth-http-integration): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-x-auth-http-integration`
- [ ] PR 생성 (base: `main`)
- [ ] 사용자 알림
