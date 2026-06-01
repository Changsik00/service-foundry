---
type: reference
aliases: ["@apps/api", "API 서버", "백엔드 API"]
tags: [service-foundry, reference, backend, app]
---

# api — NestJS 인증·도메인 REST 백엔드

> 💡 **한 줄 요약**: NestJS 11 + Drizzle + PostgreSQL 기반 REST API 서버. 전체 인증 플로우(세션·JWT·OAuth·MFA·Passkey)와 관측성(OTel·prom-client)을 제공한다.
> **위치**: `apps/api` · **상위**: [[architecture]]

## 요약

`api` 는 service-foundry 의 단일 백엔드 애플리케이션이다. `packages/nestjs/*` 어댑터 모듈과 `packages/backend/*` 코어를 조립해 부트스트랩하며, 모든 인증 엔드포인트·헬스체크·메트릭 스크레이프 엔드포인트를 노출한다. 진입점은 `src/main.ts` 이며 `NestFactory.create(AppModule)` 으로 Express 기반 HTTP 서버를 구동한다.

> 📄 **위치**: `apps/api` · **포트**: `$PORT` (기본 설정 참조) · **DB**: PostgreSQL (`DATABASE_URL`)

## 책임

- 인증(회원가입·로그인·로그아웃·토큰 갱신·이메일 인증·비밀번호 재설정·OAuth·MFA·Passkey) REST 엔드포인트 제공
- Drizzle ORM 으로 PostgreSQL 스키마 관리(`db:generate` / `db:migrate`) 및 쿼리 실행
- OTel 자동계측(`src/tracing.ts`), prom-client 메트릭(`GET /metrics`), pino 구조화 로깅 통합
- CORS·rate-limit·helmet 보안 헤더 적용 및 SIGTERM graceful shutdown 처리

## 구성 (조립하는 @repo 패키지)

| 패키지 | 역할 |
|---|---|
| [[reference/packages/nestjs-auth\|nestjs-auth]] | JWT 검증 NestJS 모듈 |
| [[reference/packages/nestjs-database\|nestjs-database]] | Drizzle + PostgreSQL NestJS 모듈 |
| [[reference/packages/nestjs-http-client\|nestjs-http-client]] | undici HTTP 클라이언트 NestJS 모듈 |
| [[reference/packages/nestjs-logger\|nestjs-logger]] | pino 구조화 로거 NestJS 모듈 |
| [[reference/packages/nestjs-security\|nestjs-security]] | helmet · throttler 보안 NestJS 모듈 |
| [[reference/packages/nestjs-settings\|nestjs-settings]] | 환경변수 검증 NestJS 모듈 |
| [[reference/packages/backend-auth-jwt\|backend-auth-jwt]] | EdDSA JWT 서명·검증 |
| [[reference/packages/backend-auth-session\|backend-auth-session]] | 세션 저장·회전·패밀리 격리 |
| [[reference/packages/backend-auth-password\|backend-auth-password]] | argon2id 해싱·검증 |
| [[reference/packages/backend-auth-oauth\|backend-auth-oauth]] | OAuth 2.0 PKCE 플로우 |
| [[reference/packages/backend-auth-mfa\|backend-auth-mfa]] | TOTP MFA 등록·검증 |
| [[reference/packages/backend-auth-passkey\|backend-auth-passkey]] | WebAuthn Passkey 등록·인증 |
| [[reference/packages/backend-auth-rate-limit\|backend-auth-rate-limit]] | 인증 경로 rate-limit |
| [[reference/packages/backend-auth-audit\|backend-auth-audit]] | 인증 이벤트 감사 로그 |
| [[reference/packages/backend-lifecycle\|backend-lifecycle]] | graceful shutdown 오케스트레이션 |
| [[reference/packages/backend-notification\|backend-notification]] | 알림 포트·어댑터 |
| [[reference/packages/backend-observability\|backend-observability]] | OTel 트레이싱·메트릭 프로바이더 |
| [[reference/packages/backend-settings\|backend-settings]] | 앱 설정 스키마·maskConfig |
| [[reference/packages/shared-auth-contracts\|auth-contracts]] | 공유 인증 계약 타입 |

## 주요 엔드포인트 / 라우트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 (상태·업타임·버전) |
| GET | `/health/live` | liveness probe |
| GET | `/health/ready` | readiness probe |
| POST | `/auth/signin` | 로그인 (이메일+비밀번호) |
| POST | `/auth/signup` | 회원가입 |
| POST | `/auth/signout` | 로그아웃 (세션 폐기) |
| POST | `/auth/refresh` | 액세스 토큰 갱신 |
| GET | `/auth/me` | 현재 사용자 정보 |
| POST | `/auth/password/reset` | 비밀번호 재설정 요청 |
| POST | `/auth/password/reset/confirm` | 비밀번호 재설정 확인 |
| POST | `/auth/email/verify/request` | 이메일 인증 요청 |
| POST | `/auth/email/verify/confirm` | 이메일 인증 확인 |
| GET | `/auth/oauth/:provider` | OAuth 인가 리다이렉트 |
| GET | `/auth/oauth/:provider/callback` | OAuth 콜백 처리 |
| POST | `/auth/mfa/totp/enroll` | TOTP 등록 시작 |
| POST | `/auth/mfa/totp/enroll/confirm` | TOTP 등록 확인 |
| POST | `/auth/mfa/totp/verify` | TOTP 검증 |
| POST | `/auth/mfa/totp/disable` | TOTP 비활성화 |
| POST | `/auth/passkey/register/options` | Passkey 등록 옵션 |
| POST | `/auth/passkey/register/verify` | Passkey 등록 검증 |
| POST | `/auth/passkey/authenticate/options` | Passkey 인증 옵션 |
| POST | `/auth/passkey/authenticate/verify` | Passkey 인증 검증 |
| GET | `/metrics` | Prometheus 메트릭 스크레이프 |

## 연결된 개념

- [[explainers/auth/cookie-strategy]] — httpOnly 쿠키 기반 세션 전달 전략
- [[explainers/auth/oauth-pkce-flow]] — OAuth PKCE 인가 플로우
- [[explainers/backend/otel-tracing-init-order]] — OTEL 자동계측 초기화 순서
- [[explainers/auth/session-rotation-chain]] — 세션 회전·패밀리 격리 메커니즘
- [[explainers/auth/mfa-totp-challenge]] — TOTP MFA 등록·챌린지 흐름
- [[explainers/auth/passkey-webauthn]] — WebAuthn Passkey 등록·인증 흐름
- [[reference/architecture]] — 전체 시스템 구조

> 소스: spec-03-08, spec-05-06/07, spec-06-01/03/04/05, spec-07-01/02/03, spec-11-02/03, spec-12-01/04, spec-13-04, spec-14-03 · `apps/api/src/`
