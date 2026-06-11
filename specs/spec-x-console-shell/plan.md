# Implementation Plan: spec-x-console-shell

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 스코프 = #135 피드백 4건 (2026-06-11 dennis 승인 "머지 했어 진행해줘")
> - [x] 멤버/조직 메뉴는 만들지 않음 (org-screens 후속)

## 🎯 핵심 전략

| 결정 | 선택 | 이유 |
|---|---|---|
| 셸 위치 | `src/components/` (AppShell·Sidebar·UserMenu) | 도메인 모름 — ARCHITECTURE §2 배치 기준 |
| 가드 | auth-react `RequireAuth` 재사용 또는 GuestOnly 대칭의 클라 가드 | 기존 패키지 표면 우선 — 구현 시 RequireAuth surface 확인 |
| 계정 데이터 | features/account/ (queries + AccountCard) | /auth/me 는 도메인 데이터 — features 행 |
| 비밀번호 토글 | frontend-ui `PasswordInput` 컴포넌트 신설 | 로그인·가입 2회 사용 = 승격 기준 충족 (fill-forward) |
| 확인 필드 검증 | zod `.refine` (signupSchema) | FRONT §4 표준 |

## 📂 Proposed Changes

- [NEW] `components/{app-shell,sidebar,user-menu}.tsx` + `app/(console)/layout.tsx` — Task 1
- [MOVE] `app/page.tsx` → `app/(console)/page.tsx` 대시보드 재구성 + `features/account/` — Task 2
- [NEW] frontend-ui `password-input.tsx` + LoginForm/SignupForm 보강 (confirm+강도) — Task 3
- [MODIFY] e2e — Task 4

## 🧪 검증 — 단위 TDD + full-stack e2e + Audit Checklist
## 🔁 Rollback — PR revert 단독 가능
