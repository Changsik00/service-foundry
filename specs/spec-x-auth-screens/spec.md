# spec-x-auth-screens: auth 화면 구현 (로그인 개편 + 회원가입) + features/ 구조 개편

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-auth-screens` |
| **Branch** | `spec-x-auth-screens` |
| **상태** | Plan Accepted |
| **타입** | Feature |
| **Integration Test Required** | yes (Playwright full-stack e2e) |
| **작성일** | 2026-06-11 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

- DESIGN.md §6 (auth 4화면 스펙)·frontend ARCHITECTURE.md (features/ 규칙) 정본 확정 (#133), 토큰 구현 완료 (#134)
- 현재 로그인: bare HTML (디자인 시스템 미적용, RHF 없음, useState 수동 폼) — DESIGN §6.1 위반 상태
- 회원가입 화면 없음. `src/lib/` 에 auth 파일 평면 적치 (ARCHITECTURE §2 가 정리 기준으로 명시)

### 스코프 제약 (조사 결과)

supabase 모드에서 apps/api 는 `GET /auth/me` 만 마운트 — org/switch·invite·members 는 native 전용이며
"내 조직 목록" 엔드포인트는 native 에도 없음. **테넌트 선택(§6.3)·초대 수락(§6.4) 화면은 백엔드 org
표면이 선행 조건** → 후속 spec (org 엔드포인트 + 화면 함께).

## 🎯 요구사항

1. **(auth) 라우트 그룹 + 공통 골격** — DESIGN §6.0 (#f6f5f4 캔버스, 400px 카드, radius 12, elevation-2) 을 `(auth)/layout.tsx` 1곳에
2. **로그인 개편** (§6.1) — RHF+Zod, shadcn Form/Input/Button(lg), 401 인라인 에러(enumeration-safe), "비밀번호를 잊으셨나요?" 링크(stub), 하단 회원가입 링크
3. **회원가입 신설** (§6.2) — 이름/이메일/비밀번호(8자+, 규칙 사전 고지 헬퍼), CTA "계정 만들기", 409/중복 인라인, 성공 시 콘솔 직행 (세션 없으면 이메일 확인 안내)
4. **features/auth 구조 개편** — LoginForm/SignupForm/schema → `src/features/auth/` (index.ts 노출), ARCHITECTURE §3 불변규칙 준수. lib/ 의 auth wiring 파일은 lib 잔존 (전역 horizontal)
5. **가드** — 로그인 상태로 (auth) 접근 → `/` redirect
6. **e2e 확장** — 회원가입 성공 플로우 + 로그인 화면 디자인 회귀(카드 골격 존재) + 기존 7개 유지

## 🚫 Out of Scope

- 테넌트 선택·초대 수락 화면 → **spec-x-org-screens** (백엔드 org 표면 포함, 후속)
- 소셜 로그인 버튼 — Supabase OAuth provider 미구성 상태의 비활성 버튼 = filler (구성 시 fill-forward)
- 비밀번호 재설정 실 flow (링크 stub 만 — supabase 모드 reset 흐름은 후속)
- 다크모드 / dialog·table·badge 컴포넌트

## ✅ Definition of Done

- [ ] 전 게이트 GREEN + full-stack e2e (기존 7 + 신규) PASS
- [ ] DESIGN.md §8 Audit Checklist 7항 자가검증 기록 (walkthrough)
- [ ] ship + push + PR
