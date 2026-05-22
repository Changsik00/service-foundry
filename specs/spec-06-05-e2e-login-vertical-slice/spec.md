# spec-06-05: 로그인 수직 슬라이스 통합 테스트

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-06-05` |
| **Phase** | `phase-06` |
| **Branch** | `spec-06-05-e2e-login-vertical-slice` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-22 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

spec-06-03에서 Cookie 기반 인증(signup/signin/signout/refresh/me)이 apps/api에 구현 완료됐다.
spec-06-04에서 Audit Event 시스템도 구축됐다.
`apps/api/src/auth/auth.e2e.test.ts`에는 이미 password-reset, email-verify, JWKS 엔드포인트의 통합 테스트가 존재하며, 실 PostgreSQL(port 5434)을 사용하는 NestJS 앱을 직접 구동하는 방식으로 작성되어 있다.

### 문제점

로그인 수직 슬라이스(signup → signin → cookie 발급 → /me 200 → signout → /me 401 → refresh)는 아직 통합 테스트로 검증되지 않았다.
단위 테스트(auth.controller.test.ts)는 mock 기반이라 실제 DB, 세션 저장, 쿠키 흐름을 검증하지 못한다.

### 해결 방안

기존 `auth.e2e.test.ts`에 "로그인 수직 슬라이스" describe 블록을 추가한다.
supertest의 `agent()`를 활용해 쿠키를 자동 관리하고, signup → signin → /me → signout → /me → refresh → /me 흐름을 실 PostgreSQL 대상으로 검증한다.

> **Playwright + web-next E2E는 Out of Scope.** phase-09에서 frontend 완성 후 별도 spec으로 진행.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/signup` → 201, accessToken 반환, refresh_token httpOnly cookie 발급
2. `POST /auth/signin` → 200, accessToken 반환, refresh_token cookie 갱신
3. `GET /auth/me` (Bearer accessToken) → 200, 인증된 사용자 정보 반환
4. `POST /auth/signout` → 200, refresh_token cookie 삭제
5. `POST /auth/signout` 이후 `GET /auth/me` → 401
6. `POST /auth/refresh` (refresh_token cookie) → 200, 새 accessToken 발급
7. `POST /auth/refresh` 이후 `GET /auth/me` → 200

### Non-Functional Requirements

1. 실 PostgreSQL DB를 사용 (mock 금지)
2. 기존 `auth.e2e.test.ts` 파일에 통합 (별도 파일 불필요)
3. 테스트 격리: 유니크 email 사용 (`Date.now()` suffix)

## 🚫 Out of Scope

- Playwright 브라우저 자동화 테스트
- apps/web-next UI 검증
- Rate limiting / 계정 잠금 시나리오 (별도 spec)
- 타 엔드포인트 커버리지 확장 (password-reset confirm E2E 등)

## 📑 ADR 후보

- [ ] 없음

## ✅ Definition of Done

- [ ] 로그인 수직 슬라이스 통합 테스트 작성 (7개 assertions 이상)
- [ ] 실 DB 대상 `pnpm --filter @apps/api test` → 모든 테스트 PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-06-05-e2e-login-vertical-slice` 브랜치 push 완료
- [ ] PR 생성 → phase-06-auth-integration base
