# spec-19-01: 계정 변경 API

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-01` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-01-account-mutations-api` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-12 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

`apps/api`의 auth 레이어는 로그인·로그아웃·비밀번호 재설정·이메일 인증까지 구현되어 있다. 그러나 인증된 사용자가 **자신의 계정을 직접 변경**할 수 있는 수단이 없다. `users` 테이블에 `displayName`과 `deletedAt` 컬럼도 없고, 이를 조작하는 엔드포인트도 존재하지 않는다.

### 문제점

- 비밀번호를 바꾸려면 재설정 메일 흐름 전체를 거쳐야 하는 UX 문제
- `displayName` 컬럼이 없어 프로필 이름 기능 불가
- 회원 탈퇴 엔드포인트 미존재 — org owner 탈퇴 시 조직 고아 위험

### 해결 방안 (요약)

`AccountController` + `AccountService`를 신규 추가한다. DB 스키마에 `display_name`, `deleted_at`을 추가(마이그레이션)하고, 비밀번호 변경·프로필 수정·회원 탈퇴 3종 엔드포인트를 구현한다. 탈퇴 시 sole org owner 여부를 사전 검증하고, soft-delete + 세션 전체 revoke를 수행한다.

## 🎯 요구사항

### Functional Requirements

1. `PATCH /auth/account/password` — 현재 비밀번호 검증 후 새 비밀번호로 변경 (JWT 필요)
2. `PATCH /auth/account/profile` — `displayName` 변경 (JWT 필요)
3. `DELETE /auth/account` — 회원 탈퇴 (JWT + CSRF 필요)
   - 사용자가 단독 `owner`인 조직이 하나라도 있으면 `400 ACCOUNT_DELETE_BLOCKED` 거부
   - 탈퇴: `deleted_at = now()` soft-delete + 해당 사용자 모든 세션 즉시 revoke
4. `GET /auth/me` 응답에 `displayName` 포함 (기존 엔드포인트 확장)
5. `users` 테이블 마이그레이션: `display_name text null`, `deleted_at timestamptz null` 추가
6. 탈퇴 후 동일 이메일 재가입 허용 — `email` unique 제약 우회를 위해 탈퇴 시 `email`을 `<email>#deleted_<uuid>` 로 마스킹

### Non-Functional Requirements

1. 비밀번호 변경 후 기존 세션 유지 (refresh token 재발급 안 함) — 사용자 경험 우선
2. `AuthGuard` + `CsrfGuard` 기존 패턴 준수 (탈퇴는 CSRF 적용, 비밀번호/프로필은 CSRF 생략 가능)
3. `verifyPassword()` / `hashPassword()` — `@repo/backend-auth-password` 사용

## 🚫 Out of Scope

- 이메일 변경 흐름 → spec-19-02
- 탈퇴 후 개인정보 완전 삭제 배치 (GDPR right-to-erasure) → 후속 phase
- 아바타/프로필 사진 업로드 → phase-20
- 탈퇴 후 org 자동 이전 → 사용자가 직접 owner 위임 후 탈퇴

## 📑 ADR 후보

- [ ] 없음

## 🔗 관련 문서

- 관련 ADR: `docs/adr/0022-multitenancy-foundation.md`
- 관련 ADR: `docs/adr/0013-session-lifecycle.md`

## ✅ Definition of Done

- [ ] `pnpm --filter @apps/api test:e2e` — account e2e 5종 PASS
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] `walkthrough.md` / `pr_description.md` 작성 및 ship commit
- [ ] `spec-19-01-account-mutations-api` 브랜치 push 완료 (base: `phase-19-account-authz`)
- [ ] 사용자 검토 요청 알림 완료
