# spec-06-03: cookie-strategy

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-06-03` |
| **Phase** | `phase-06` |
| **Branch** | `spec-06-03-cookie-strategy` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no |
| **작성일** | 2026-05-21 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- spec-06-01: `@repo/nestjs-auth` (AuthGuard / @CurrentUser) 완료.
- spec-06-02: `@repo/frontend-auth-react` (AuthProvider / AuthSDK) 완료.
- `apps/api /auth` 컨트롤러: password reset / email verify 만 존재 — 실제 login 흐름 없음.
- `signAccessToken` 은 `sub` 만 JWT 에 담음 → `AuthGuard` 의 `decodeJwt().role` 읽기 실패.

### 문제점

phase-06 목표 "end-to-end login" 을 위한 signin/signup/refresh/signout endpoint 미존재. refresh_token cookie 발급/검증 로직 미구현.

### 해결 방안 (요약)

`@repo/backend-auth-jwt` 의 `signAccessToken` 에 custom claim 지원 추가 (role 포함). `apps/api` 에 Cookie 기반 인증 5 endpoints 신설 — httpOnly + SameSite=Lax refresh_token cookie 발급/검증/갱신.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/signin` — 이메일/비밀번호 검증 → refresh_token cookie 발급 + `{ accessToken, user }` 응답
2. `POST /auth/signup` — 회원가입 → refresh_token cookie 발급 + `{ accessToken, user }` 응답
3. `POST /auth/signout` — 세션 revoke → refresh_token cookie 삭제 + `{ status: "ok" }`
4. `POST /auth/refresh` — cookie 의 refresh_token rotation → 새 cookie + `{ accessToken, user }`
5. `GET /auth/me` — AuthGuard 보호 → 현재 사용자 `{ sub, role }` 반환
6. access token JWT 에 `role` custom claim 포함 (AuthGuard 호환)

### Non-Functional Requirements

1. Cookie: `httpOnly=true`, `secure=NODE_ENV!==development`, `sameSite=lax`, `path=/`, `maxAge=30일`
2. refresh_token 평문은 DB 미저장 — SHA-256 hash 저장 (ADR-0014)
3. reuse detection — 이미 revoke 된 token 재사용 시 family 전체 revoke (ADR-0013)

## 🚫 Out of Scope

- sessions 테이블 DB 마이그레이션 실제 실행 (파일 생성까지만)
- `GET /auth/me` 에서 DB full User 조회 (AuthenticatedUser `{ sub, role }` 반환으로 충분)
- Step-up authentication (@StepUp decorator) — ADR-0014 Decision 7, phase-07
- OAuth / PKCE — phase-07

## 📑 ADR 후보

- [ ] 없음 (ADR-0014 Decision 6 이 이미 정의)

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS (signin / signup service + controller)
- [ ] `pnpm typecheck` PASS
- [ ] `biome check` PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성
- [ ] `spec-06-03-cookie-strategy` 브랜치 push + PR 생성 완료
