# walkthrough: spec-07-03-auth-passkey

## 구현 흐름

### 1. DB 스키마

`passkey_credentials` — 사용자당 WebAuthn credential 영구 저장.  
`passkey_challenges` — 등록/인증 challenge 임시 저장 (TTL 5분).  
두 테이블은 `apps/api/src/infra/schema/` 에 추가되고 `drizzle-kit generate`로 마이그레이션 생성.

### 2. `@repo/backend-auth-passkey`

`@simplewebauthn/server` v13.3 래퍼 패키지.  
`generateRegistrationOpts` / `verifyRegistration` / `generateAuthenticationOpts` / `verifyAuthentication` 4개 함수를 얇게 감싸고, `apps/api`가 simplewebauthn을 직접 의존하지 않도록 `AuthenticationResponseJSON`, `RegistrationResponseJSON` 타입도 재export.

### 3. PasskeyStore / PasskeyService

`PasskeyStore` 인터페이스 + `createDrizzlePasskeyStore` Drizzle 구현.  
`findChallenge`는 `gt(expiresAt, now())` 조건으로 TTL을 DB 레벨에서 강제.

`PasskeyService`:
- `generateRegisterOptions(userId, userEmail)` — existing credentials 제외 옵션 포함, challenge DB 저장
- `verifyRegister(userId, challengeToken, credential)` — challenge 검증 → simplewebauthn 검증 → credential 저장 → challenge 삭제
- `generateAuthOptions()` — userId=null challenge 저장 (anonymous)
- `verifyAuth(challengeToken, credentialId, response)` — challenge/credential 조회 → 검증 → counter 업데이트 → 세션+accessToken 발급

publicKey는 `Buffer.from(cred.publicKey).toString("base64url")`로 text 저장, 검증 시 `Buffer.from(stored, "base64url")`로 복원.

### 4. PasskeyController

`/auth/passkey/register/options` — AuthGuard 필요. `user.sub`를 userId + displayName 양쪽에 전달.  
`/auth/passkey/register/verify` — AuthGuard 필요. ZodError → BadRequestException(400).  
`/auth/passkey/authenticate/options` — 공개 엔드포인트.  
`/auth/passkey/authenticate/verify` — 공개. 성공 시 refresh_token cookie + accessToken 반환.

### 5. 테스트 전략

**단위 테스트** (`passkey.service.test.ts`, 8개): `@repo/backend-auth-passkey`와 `@repo/backend-auth-session`을 vi.mock으로 교체. 실제 simplewebauthn 호출 없이 service 로직 검증.

**E2E 테스트** (`auth.e2e.test.ts`, +6개): 실 DB + 실 앱. register/options (인증 유/무), authenticate/options, register/verify bad payload, authenticate/verify bad payload. 브라우저 crypto API가 없으므로 실 credential 검증 경로는 단위 테스트에서 커버.

## 주요 결정 사항

- **챌린지를 JWT 대신 DB 저장**: TTL 만료 챌린지를 `gt(expiresAt)` 조건으로 자동 무효화, 재사용 방지를 DB 레벨에서 처리
- **publicKey text 저장**: bytea 대신 base64url text — Drizzle + pg 드라이버 타입 호환성 확보
- **rpID 파생**: `jwtOpts.issuer`에서 protocol/port 제거 → 별도 `PASSKEY_RP_ID` 환경 변수 불필요 (`settings.ts`에 추가한 3개 변수는 미래 확장용으로 남김)
