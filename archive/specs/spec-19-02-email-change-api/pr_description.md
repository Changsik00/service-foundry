# spec-19-02: 이메일 변경 API

## 변경 요약

- `POST /auth/account/email/change-request` — 인증된 사용자가 새 이메일로 변경 요청 (토큰 생성 + 확인 메일 발송)
- `POST /auth/account/email/change-confirm` — 토큰 검증 후 이메일 갱신 + 전체 세션 revoke
- DB 마이그레이션: `email_change_tokens` 테이블 신규
- `AccountUserStore` 확장: `findByEmail`, `updateEmail`, `providerUid` 반환

## 주요 결정

- **confirm 후 전체 세션 revoke**: 이메일은 로그인 식별자 — 변경 시 모든 세션 무효화하여 재로그인 강제
- **confirm에 AuthGuard 없음**: 이메일 링크 클릭 → 프론트 페이지 → API 호출 시 세션 없을 수 있음
- **provider 사용자 차단**: `providerUid != null` → 400 (OAuth 이메일은 provider가 권위 소스)
- **Supabase autoconfirm 무관**: 자체 토큰 시스템 사용 — queue.md Icebox 항목과 별개

## 테스트

단위 7종 + e2e 5종 PASS, 전체 180/180 PASS

## 관련

- Phase: phase-19-account-authz
- 이전 spec: spec-19-01 (AccountService + revokeAllByUser)
- 다음 스펙: spec-19-03 (세션 관리 API + UI)
