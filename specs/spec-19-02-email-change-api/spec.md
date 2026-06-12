# spec-19-02: 이메일 변경 API

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-02` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-02-email-change-api` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-12 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

spec-19-01에서 비밀번호 변경·프로필 변경·회원 탈퇴 3종 API가 완성됐다. 그러나 사용자가 자신의 이메일 주소를 변경하는 수단이 없다. 이메일은 로그인 식별자이므로 변경 시 소유권 확인(토큰 기반 이중 확인)이 필수다.

### 문제점

- 이메일 오기입이나 이메일 주소 변경이 필요한 사용자가 계정을 삭제 후 재가입해야 함
- 이메일 변경 없이는 계정 설정 UI(spec-19-07)가 미완성

### 해결 방안 (요약)

`POST /auth/account/email/change-request` (인증된 사용자가 새 이메일 등록)→ 새 이메일로 확인 메일 발송 → `POST /auth/account/email/change-confirm` (토큰 검증 후 이메일 갱신 + 전체 세션 revoke). password-reset / email-verify 기존 패턴을 동일하게 답습하여 새 테이블 `email_change_tokens`로 구현한다.

## 🎯 요구사항

### Functional Requirements

1. `POST /auth/account/email/change-request` (AuthGuard + CsrfGuard)
   - `{ newEmail: string }` 입력 검증 (Zod)
   - providerUid가 있는 OAuth/provider 사용자는 400 거부
   - 새 이메일이 이미 사용 중이면 409 ConflictException
   - 토큰 생성(24h TTL) → `email_change_tokens` 저장 → 새 이메일 주소로 확인 메일 발송
2. `POST /auth/account/email/change-confirm` (CsrfGuard만, AuthGuard 불필요)
   - `{ token: string }` 입력 검증 (Zod)
   - 미존재/만료/사용됨 → 200 (enumeration-safe)
   - confirm 시점에 새 이메일 재검증 (중복 점유 방지) → 409
   - 성공: `users.email = newEmail`, 토큰 markUsed, `sessionStore.revokeAllByUser`
3. DB 마이그레이션: `email_change_tokens` 테이블 신규

### Non-Functional Requirements

1. 기존 이메일로 로그인이 confirm 전까지 정상 동작 (old email 유지)
2. confirm 성공 후 모든 기존 세션 revoke → 새 이메일로 재로그인 강제 (보안)
3. 요청이 와도 이메일 주소 누출 없음 (providerUid 체크 실패 시 구체적 이유 노출 최소화)

## 🚫 Out of Scope

- 이메일 변경 중 기존 이메일 주소로 취소 링크 발송 (단순화)
- provider 사용자의 이메일 동기화 (OAuth provider 이메일과 DB 이메일 sync)
- rate limiting (IP별 변경 요청 빈도 제한) — 별도 spec 후보

## 📑 ADR 후보

- [ ] 없음

## 🔗 관련 문서

- 관련 spec: [[spec-19-01]] (AccountUserStore, revokeAllByUser 패턴)
- 관련 패턴: `apps/api/src/auth/email-verify.service.ts`, `password-reset.service.ts`

## ✅ Definition of Done

- [ ] DB 마이그레이션 + 스키마 + e2e 5종 PASS
- [ ] `pnpm turbo run typecheck` PASS
- [ ] `walkthrough.md` 와 `pr_description.md` 작성 및 ship commit
- [ ] `spec-19-02-email-change-api` 브랜치 push + PR 생성
- [ ] 사용자 검토 요청 알림 완료
