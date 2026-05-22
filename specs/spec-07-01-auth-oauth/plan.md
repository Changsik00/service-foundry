# Implementation Plan: spec-07-01

## 📋 Branch Strategy

- 신규 브랜치: `spec-07-01-auth-oauth`
- **시작 지점: `phase-07-auth-extension`** (Phase Base Branch 모드 — main 아님)
- 첫 task가 브랜치 생성을 수행함

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] `users.passwordHash` 컬럼을 `NOT NULL → nullable`로 변경하는 마이그레이션을 수행함 — 기존 이메일 가입자에게는 영향 없으나 DB 스키마 변경이므로 확인 필요.
> - [ ] OAuth provider 토큰(access_token, refresh_token)을 DB에 저장하지 않기로 결정 — `providerAccountId`(sub/id)만 보관. 향후 provider API를 대리 호출해야 한다면 재설계 필요.

> [!WARNING]
> - [ ] Google OAuth + Kakao OAuth 각각 OAuth 앱 등록 및 `CLIENT_ID`, `CLIENT_SECRET` 환경 변수 설정 필요 (외부 credential 의존). 테스트는 MSW mock으로 진행하므로 실제 credential 없이 단위/통합 테스트는 동작.
> - [ ] `apps/api` DB 마이그레이션이 포함됨 — 배포 시 `drizzle-kit migrate` 실행 필요.

## 🎯 핵심 전략 (Core Strategy)

### 아키텍처 컨텍스트

```
packages/backend/auth-oauth/src/
  pkce.ts          — code_verifier 생성, code_challenge 계산 (SHA-256 base64url)
  state.ts         — state 생성 (HMAC-SHA256 서명), verifyState
  providers.ts     — Google + Kakao provider 설정 (authorizationUrl, tokenUrl, userInfoUrl, scopes)
  token.ts         — exchangeCode (HTTP POST → access_token), fetchUserInfo (HTTP GET)
  account.ts       — findOrCreateOAuthUser: users + oauth_accounts DB 조작
  schema.ts        — oauth_accounts Drizzle 테이블 정의
  index.ts         — 외부 공개 API

apps/api/src/
  infra/schema/
    oauth-accounts.ts    — [NEW] oauth_accounts 테이블 (apps/api 레벨 schema)
    users.ts             — [MODIFY] passwordHash: text().notNull() → text()
    index.ts             — [MODIFY] appSchema에 oauthAccounts 추가
  infra/migrations/      — [NEW] drizzle-kit 마이그레이션 파일
  auth/
    oauth.service.ts     — [NEW] OAuthService (auth-oauth 패키지 + session 조합)
    oauth.controller.ts  — [NEW] GET /auth/oauth/:provider + callback
    auth.module.ts       — [MODIFY] OAuthService, OAuthController 등록
```

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **State 쿠키** | HMAC-SHA256 서명 값을 `oauth_state` 쿠키에 저장 | 별도 서버 세션 없이 CSRF 방어. DB 조회 불필요 |
| **PKCE verifier 쿠키** | `oauth_pkce` 쿠키 (httpOnly, 10분 TTL) | State와 분리 저장 → 검증 로직 단순화 |
| **OAuth 토큰 비저장** | `providerAccountId`만 `oauth_accounts`에 보관 | 저장하면 암호화 키 관리 복잡. provider API 대리 호출 불필요 |
| **계정 연결 전략** | email 기준 → 기존 user link / 없으면 신규 user 생성 | 이메일을 신뢰 식별자로 사용 (Google·Kakao는 검증된 이메일 제공) |
| **NestJS 어댑터 없음** | `auth-oauth` 패키지를 `apps/api` controller에서 직접 사용 | OAuth는 HTTP redirect/callback이 controller-level concern. 별도 NestJS 패키지 불필요 |

### 📑 ADR 후보

- [x] `oauth-token-no-storage` (type: decision) — OAuth 토큰 비저장 결정. spec 머지 시 `docs/decisions/ADR-NNN-oauth-token-no-storage.md` 작성.

## 📂 Proposed Changes

### [DB Schema]

#### [MODIFY] `apps/api/src/infra/schema/users.ts`
`passwordHash: text("password_hash").notNull()` → `text("password_hash")` (nullable)

#### [NEW] `apps/api/src/infra/schema/oauth-accounts.ts`
```text
oauth_accounts 테이블:
  id             uuid PK
  userId         uuid FK → users.id (cascade delete)
  provider       text (enum: 'google' | 'kakao')
  providerAccountId  text  (sub / kakao numeric id as string)
  createdAt      timestamp with timezone
  UNIQUE(provider, providerAccountId)
```

#### [MODIFY] `apps/api/src/infra/schema/index.ts`
`appSchema`에 `oauthAccounts` 추가.

#### [NEW] `apps/api/drizzle/` (마이그레이션 파일)
`drizzle-kit generate` + `drizzle-kit migrate` 실행으로 자동 생성.

### [packages/backend/auth-oauth]

#### [NEW] `packages/backend/auth-oauth/` (전체 패키지)
- `package.json` — `@repo/backend-auth-oauth`, `@repo/backend-database` + `@repo/errors` + `undici` 의존
- `src/pkce.ts` — `generateCodeVerifier(): string`, `generateCodeChallenge(verifier): Promise<string>`
- `src/state.ts` — `generateState(secret): string`, `verifyState(state, cookie, secret): boolean`
- `src/providers.ts` — `OAuthProvider` 타입 + `googleProvider` + `kakaoProvider` 설정 객체
- `src/token.ts` — `exchangeCode(provider, code, verifier, redirectUri): Promise<OAuthTokens>`, `fetchUserInfo(provider, accessToken): Promise<OAuthUserInfo>`
- `src/account.ts` — `findOrCreateOAuthUser(db, provider, userInfo): Promise<{ user, isNew }>`
- `src/schema.ts` — `oauthAccounts` Drizzle 테이블 (패키지 레벨, apps/api schema와 별개)
- `src/index.ts` — 공개 exports

### [apps/api OAuth 엔드포인트]

#### [NEW] `apps/api/src/auth/oauth.service.ts`
`@repo/backend-auth-oauth` + `@repo/backend-auth-session` 조합.
- `buildAuthorizationUrl(provider, redirectUri): { url, state, verifier }`
- `handleCallback(provider, code, state, cookieState, verifier, redirectUri): Promise<{ accessToken, refreshToken, user }>`

#### [NEW] `apps/api/src/auth/oauth.controller.ts`
```text
GET /auth/oauth/:provider         → OAuthService.buildAuthorizationUrl → 쿠키 세팅 → 302
GET /auth/oauth/:provider/callback → OAuthService.handleCallback → refresh cookie + accessToken 응답
```

#### [MODIFY] `apps/api/src/auth/auth.module.ts`
`OAuthService`, `OAuthController` providers/controllers 배열에 추가.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm --filter @repo/backend-auth-oauth test
```
- `pkce.test.ts`: verifier 길이, challenge = SHA-256(verifier) base64url
- `state.test.ts`: generateState → verifyState 성공 / 변조 시 실패
- `account.test.ts`: 신규 user 생성 / 기존 user link / 이미 연결된 account

### 통합 테스트
```bash
pnpm --filter api test:e2e -- --grep "OAuth"
```
- MSW로 Google tokenUrl, userInfoUrl 응답 mock
- `GET /auth/oauth/google` → state/pkce 쿠키 확인 + 302 위치 검증
- `GET /auth/oauth/google/callback?code=mock&state=valid` → refresh_token 쿠키 + accessToken 응답 확인

### 수동 검증 시나리오
1. `GET /auth/oauth/google` 호출 → 302 Location에 `code_challenge`, `state` 파라미터 포함 확인
2. callback 엔드포인트에 올바른 code + state 전달 → `{ accessToken }` 응답 + `refresh_token` 쿠키 확인
3. state 불일치 callback 전달 → 400 또는 401 응답 확인

## 🔁 Rollback Plan

- 마이그레이션은 `passwordHash nullable`만 변경 (기존 데이터 보존). 롤백 시 `NOT NULL DEFAULT ''` 복원 마이그레이션 추가.
- `oauth_accounts` 테이블은 신규 생성이므로 DROP TABLE로 롤백 가능.
- `apps/api` 코드: `auth.module.ts`에서 OAuthController/OAuthService 제거하면 기존 auth 엔드포인트에 영향 없음.

## 📦 Deliverables 체크

- [x] task.md 작성 (다음 단계)
- [ ] 사용자 Plan Accept 받음
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
