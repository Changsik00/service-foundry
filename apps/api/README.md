# api

> NestJS 11 + Drizzle + PostgreSQL 기반 REST API 서버. 전체 인증 플로우(세션·JWT·OAuth·MFA·Passkey)와 관측성(OTel·prom-client)을 제공한다.

## 실행

```bash
# 개발 (tsx watch)
pnpm dev

# 프로덕션
pnpm start:prod

# DB 마이그레이션
pnpm db:generate
pnpm db:migrate
```

기본 포트: `2026` (`$PORT` 환경변수로 변경 가능)

## 구성

조립하는 핵심 `@repo` 패키지:

- `@repo/nestjs-auth` — JWT 검증 NestJS 모듈
- `@repo/nestjs-database` — Drizzle + PostgreSQL NestJS 모듈
- `@repo/nestjs-logger` — pino 구조화 로거 NestJS 모듈
- `@repo/nestjs-security` — helmet · throttler 보안 NestJS 모듈
- `@repo/nestjs-settings` — 환경변수 검증 NestJS 모듈
- `@repo/backend-auth-jwt` — EdDSA JWT 서명·검증
- `@repo/backend-auth-session` — 세션 저장·회전·패밀리 격리
- `@repo/backend-auth-password` — argon2id 해싱·검증
- `@repo/backend-auth-oauth` — OAuth 2.0 PKCE 플로우
- `@repo/backend-auth-mfa` — TOTP MFA 등록·검증
- `@repo/backend-auth-passkey` — WebAuthn Passkey 등록·인증
- `@repo/backend-observability` — OTel 트레이싱·메트릭 프로바이더
- `@repo/auth-contracts` — 공유 인증 계약 타입

## 주요 엔드포인트

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
| POST | `/auth/mfa/totp/verify` | TOTP 검증 |
| POST | `/auth/passkey/register/options` | Passkey 등록 옵션 |
| POST | `/auth/passkey/authenticate/verify` | Passkey 인증 검증 |
| GET | `/metrics` | Prometheus 메트릭 스크레이프 |

## 자세히

- 레퍼런스: [`docs/reference/apps/api.md`](../../docs/reference/apps/api.md)
- 동작 원리: [`docs/explainers/auth/cookie-strategy.md`](../../docs/explainers/auth/cookie-strategy.md)
