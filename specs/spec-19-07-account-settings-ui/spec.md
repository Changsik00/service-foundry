# spec-19-07: 계정 설정 UI

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-19-07` |
| **Phase** | `phase-19` |
| **Branch** | `spec-19-07-account-settings-ui` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | no (브라우저 수동 검증) |
| **작성일** | 2026-06-13 |
| **소유자** | changsik |

## 📋 배경 및 문제 정의

### 현재 상황

spec-19-01~03에서 계정 변경 API(비밀번호·이름·탈퇴)와 세션 관리 API가 구현됐다. `GET /auth/me`는 `displayName`을 포함해 반환한다. 대시보드(`/`)에는 `AccountCard`(읽기 전용 정보)와 `SessionsCard`(세션 목록·종료)가 있지만 변경 UI는 없다.

### 문제점

사용자가 이름·비밀번호를 변경하거나 계정을 탈퇴하려면 직접 API를 호출해야 한다. 계정 관리 전용 페이지가 없다.

### 해결 방안 (요약)

`(console)/account/` 라우트에 탭 구조 계정 설정 페이지를 추가한다. 프로필 탭(이름 변경)과 보안 탭(비밀번호 변경·탈퇴)으로 구성하며, 기구현 API를 `httpClient`로 호출한다.

## 🎯 요구사항

### Functional Requirements

1. `/account` 페이지 — 프로필/보안 탭 전환
2. 프로필 탭: 현재 `displayName` prefill → 변경 후 `PATCH /auth/account/profile` 호출 → 성공 시 `me` 캐시 무효화
3. 보안 탭: 비밀번호 변경 폼 → `PATCH /auth/account/password` 호출 (currentPassword + newPassword + confirm 입력)
4. 보안 탭: 계정 탈퇴 섹션 → 확인 후 `DELETE /auth/account` (CSRF 토큰 필요) → 로그아웃
5. 사이드바에 "계정 설정" 네비 링크 추가

### Non-Functional Requirements

1. 오류 응답(401, 400, 409)은 폼 내 인라인으로 표시 (토스트 없음)
2. 제출 중에는 버튼 비활성화 (`isPending` 반영)
3. 기존 `AccountCard` / `SessionsCard`는 대시보드에 그대로 유지 — 삭제 금지

## 🚫 Out of Scope

- 이메일 변경 UI (외부 메일 흐름 의존 → Icebox)
- 아바타 업로드 (storage 포트 필요 → phase-20)
- API Key 관리 UI
- E2E 자동화 테스트 (브라우저 수동 검증으로 대체)

## 🔗 관련 문서

- spec-19-01 (account-mutations-api) — `PATCH /auth/account/*`, `DELETE /auth/account`
- spec-19-03 (session-management) — `SessionsCard`
- `apps/api/src/auth/account.controller.ts` — API 계약

## ✅ Definition of Done

- [ ] `ProfileForm` · `PasswordForm` 단위 테스트 PASS
- [ ] `/account` 페이지 브라우저 수동 검증 — 이름 변경·비밀번호 변경·탈퇴 흐름 동작
- [ ] 사이드바 "계정 설정" 링크 노출
- [ ] `walkthrough.md` 와 `pr_description.md` 작성
- [ ] `spec-19-07-account-settings-ui` 브랜치 push + PR 생성
