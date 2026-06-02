# spec-05-07: 이메일 인증 플로우 (Email Verify Flow)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-05-07` |
| **Phase** | `phase-05` |
| **Branch** | `spec-05-07-email-verify-flow` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-21 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

spec-05-06 (password-reset-flow)에서 users 테이블(`email_verified` boolean 컬럼 포함), UserStore, AuthController, AuthModule을 구축했다. password reset 패턴(SHA-256 token hash, always-200, console.info email stub, zodPipe inline, Store 인터페이스 + Drizzle 구현)이 확립됐다.

### 문제점

users 테이블에 `email_verified` 컬럼이 있지만, 이를 `true`로 전환하는 플로우가 없다. 신규 사용자 이메일 인증 없이 바로 계정이 활성화된다.

### 해결 방안 (요약)

password-reset 패턴을 그대로 답습해 이메일 인증 플로우를 구현한다. `POST /auth/email/verify/request`로 token을 발급(24h TTL)하고, `POST /auth/email/verify/confirm`으로 token을 검증해 `users.email_verified = true`로 갱신한다.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/email/verify/request`
   - email로 user 조회. 미존재 또는 이미 인증된 경우에도 항상 200 반환 (enumeration-safe).
   - 인증 필요한 user가 있을 때만 token 생성: SHA-256 hash DB 저장, 24h TTL, console.info로 token 출력 (email stub).

2. `POST /auth/email/verify/confirm`
   - token을 SHA-256 hash해서 email_verify_tokens 조회.
   - 미존재 / 만료 / 재사용 / 이미 인증된 user → silent fail (항상 200).
   - 유효 token → users.email_verified = true + token used_at 갱신.

3. `GET /.well-known/jwks.json` — spec-05-06에서 구현 완료, 변경 없음.

### Non-Functional Requirements

1. 모든 auth 엔드포인트 항상 200 반환 (enumeration-safe).
2. DB에 원본 token 미저장 (SHA-256 hash only).

## 🚫 Out of Scope

- 실제 이메일 전송 (console.info stub으로 대체)
- 회원가입/로그인 플로우
- email_verified 상태 강제 (signin 시 미인증 차단은 phase-06)
- nestjs-zod 도입 (zodPipe inline 패턴 유지)
- forRootAsync 패턴 (phase-03 이월 항목 — 별도 검토)
- rate limiting (spec-05-05 throttler가 이미 전역 적용됨)

## 📑 ADR 후보

- [ ] 없음 (spec-05-06 패턴 답습, 새 결정 없음)

## ✅ Definition of Done

- [ ] 단위 테스트 PASS (request 3케이스 + confirm 4케이스)
- [ ] E2E 테스트 PASS (real PG)
- [ ] `walkthrough.md` + `pr_description.md` 작성
- [ ] `spec-05-07-email-verify-flow` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
