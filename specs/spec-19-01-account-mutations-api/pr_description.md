# spec-19-01: 계정 변경 API

## 변경 요약

- `PATCH /auth/account/password` — 현재 비밀번호 검증 후 새 비밀번호로 변경
- `PATCH /auth/account/profile` — `displayName` 변경
- `DELETE /auth/account` — 회원 탈퇴 (soft-delete + 세션 revoke)
- `GET /auth/me` 응답에 `displayName` 포함
- DB 마이그레이션: `users` 테이블에 `display_name`, `deleted_at` 컬럼 추가

## 주요 결정

- **탈퇴 차단 기준**: 다른 멤버가 있는 org의 유일한 owner만 차단 (본인만 있는 org는 허용)
- **이메일 마스킹**: `<email>#deleted_<uuid>` — unique 제약 유지하면서 동일 이메일 재가입 가능
- **비밀번호 변경 후 세션**: 유지 (세션 관리 UI는 spec-19-03)

## 테스트

e2e 5종 PASS, 전체 168/168 PASS

## 관련

- Phase: phase-19-account-authz
- 다음 스펙: spec-19-02 (이메일 변경 API)
