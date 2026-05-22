# Task List: spec-07-01

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-07.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + DB 스키마 마이그레이션

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-07-01-auth-oauth` (시작점: `phase-07-auth-extension`)
- [ ] Commit: 없음 (브랜치 생성만)

### 1-2. DB 스키마 변경 + 마이그레이션
- [ ] `apps/api/src/infra/schema/users.ts` — `passwordHash` nullable로 변경
- [ ] `apps/api/src/infra/schema/oauth-accounts.ts` — [NEW] `oauth_accounts` 테이블 정의
- [ ] `apps/api/src/infra/schema/index.ts` — `appSchema`에 `oauthAccounts` 추가
- [ ] `drizzle-kit generate` → 마이그레이션 파일 생성 확인
- [ ] Commit: `feat(spec-07-01): db schema — oauth_accounts table + passwordHash nullable`

---

## Task 2: `@repo/backend-auth-oauth` 패키지 스캐폴딩 + PKCE / State 유틸

### 2-1. 패키지 초기 구조
- [ ] `packages/backend/auth-oauth/package.json` 생성 (name: `@repo/backend-auth-oauth`)
- [ ] `packages/backend/auth-oauth/tsconfig.json` 생성 (기존 패키지 참조)
- [ ] `packages/backend/auth-oauth/vitest.config.ts` 생성

### 2-2. PKCE 유틸 (TDD)
- [ ] `src/pkce.test.ts` 작성 — verifier 길이 43-128자, challenge = SHA-256(verifier) base64url 검증
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/pkce.ts` 구현 — `generateCodeVerifier()`, `generateCodeChallenge()`
- [ ] 테스트 실행 → Pass 확인

### 2-3. State 유틸 (TDD)
- [ ] `src/state.test.ts` 작성 — generateState/verifyState 성공 + 변조 시 실패
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/state.ts` 구현 — HMAC-SHA256 서명 기반 state 생성/검증
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-07-01): auth-oauth package — pkce + state utilities`

---

## Task 3: Provider 설정 + 토큰 교환 + Drizzle 스토어

### 3-1. Provider 설정
- [ ] `src/providers.ts` — `OAuthProvider` 타입, `googleProvider`, `kakaoProvider` 설정 객체 (authorizationUrl, tokenUrl, userInfoUrl, scopes)

### 3-2. 토큰 교환 + UserInfo (TDD)
- [ ] `src/token.test.ts` — MSW로 tokenUrl/userInfoUrl mock, `exchangeCode` + `fetchUserInfo` 검증
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/token.ts` — `exchangeCode()`, `fetchUserInfo()` 구현 (undici fetch 사용)
- [ ] 테스트 실행 → Pass 확인

### 3-3. Drizzle 스토어 + index.ts
- [ ] `src/schema.ts` — `oauthAccounts` Drizzle 테이블 (패키지 레벨)
- [ ] `src/index.ts` — 공개 exports 정리
- [ ] Commit: `feat(spec-07-01): auth-oauth package — providers + token exchange + schema`

---

## Task 4: 계정 연결 로직 (account.ts)

### 4-1. findOrCreateOAuthUser (TDD)
- [ ] `src/account.test.ts` 작성:
  - 신규 이메일 → `users` + `oauth_accounts` 생성 (passwordHash = null)
  - 기존 이메일 + 미연결 → `oauth_accounts`만 추가 (link)
  - 기존 이메일 + 이미 연결 → 기존 user 반환 (no-op)
- [ ] 테스트 실행 → Fail 확인
- [ ] `src/account.ts` — `findOrCreateOAuthUser(db, provider, userInfo)` 구현
- [ ] 테스트 실행 → Pass 확인
- [ ] Commit: `feat(spec-07-01): auth-oauth package — account linking logic`

---

## Task 5: `apps/api` OAuth Controller + Module 연결

### 5-1. OAuthService
- [ ] `apps/api/src/auth/oauth.service.ts` — `buildAuthorizationUrl()`, `handleCallback()` 구현
  - `buildAuthorizationUrl`: state + verifier 생성 → provider AuthURL 빌드
  - `handleCallback`: state 검증 → exchangeCode → fetchUserInfo → findOrCreateOAuthUser → createSession

### 5-2. OAuthController
- [ ] `apps/api/src/auth/oauth.controller.ts`:
  - `GET /auth/oauth/:provider` → 쿠키(oauth_state, oauth_pkce) 세팅 → 302 리다이렉트
  - `GET /auth/oauth/:provider/callback` → state/pkce 쿠키 읽기 → handleCallback → refresh cookie + accessToken 응답

### 5-3. Module 등록
- [ ] `apps/api/src/auth/auth.module.ts` — OAuthService, OAuthController 추가
- [ ] `pnpm --filter api typecheck` → 타입 오류 없음 확인

### 5-4. 통합 테스트
- [ ] `apps/api/src/auth/auth.e2e.test.ts` — OAuth 시나리오 추가 (MSW mock)
- [ ] `pnpm --filter api test:e2e -- --grep "OAuth"` → PASS 확인
- [ ] Commit: `feat(spec-07-01): apps/api oauth controller + module wiring`

---

## Task 6: Ship

> 모든 작업 task 완료 후 `/hk-ship` 절차를 따릅니다.

- [ ] 전체 테스트 실행 → 모두 PASS
  ```bash
  pnpm --filter @repo/backend-auth-oauth test
  pnpm --filter api test:e2e
  ```
- [ ] 코드 품질 점검
  ```bash
  pnpm --filter @repo/backend-auth-oauth lint
  pnpm --filter api lint
  pnpm --filter api typecheck
  ```
- [ ] 통합 테스트 PASS 확인 (OAuth callback flow)
- [ ] **walkthrough.md 작성** (증거 로그)
- [ ] **pr_description.md 작성** (템플릿 준수)
- [ ] **Ship Commit**: `docs(spec-07-01): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-07-01-auth-oauth` (대상: `phase-07-auth-extension`)
- [ ] **PR 생성**: `/hk-pr-gh` 호출 (base: `phase-07-auth-extension`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (+ Pre-flight) |
| **예상 commit 수** | 5개 (Task 1~5) + Ship |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
