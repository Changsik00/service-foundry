# Implementation Plan: spec-x-auth-screens

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 테넌트 선택/초대 화면 제외 — supabase 모드 org 백엔드 표면 부재 (조사 근거 spec.md). 후속 spec-x-org-screens
> - [x] 소셜 로그인 버튼 생략 — provider 미구성 비활성 버튼은 filler (DESIGN 가드레일 정신)

## 🎯 핵심 전략

| 결정 | 선택 | 이유 |
|---|---|---|
| 폼 | RHF + Zod (FRONT.md §4) | 에러 분기표 표준 — 401/409 는 form.setError 인라인 |
| 공통 골격 | `(auth)/layout.tsx` 1곳 | DESIGN §6.0 — 화면별 중복 금지 |
| signUp | 기존 SDK signUp (auth-react context 노출 확인됨) | 패키지 작업 0 |
| 가입 후 | 세션 있으면 `/` 직행, 없으면 이메일 확인 안내 | Supabase 프로젝트 confirm 설정 양쪽 대응 |
| features 이동 범위 | LoginForm/SignupForm/schema 만 | lib/ 의 store·http wiring 은 전역 horizontal (ARCHITECTURE §1) — 과이동 금지 |

## 📂 Proposed Changes

- [NEW] `src/features/auth/{schema.ts, LoginForm.tsx, SignupForm.tsx, index.ts}` — Task 1·2
- [NEW] `src/app/(auth)/layout.tsx` + `login/page.tsx` 이동 + `signup/page.tsx` — Task 1·2
- [DELETE] `src/components/login-form.tsx` (+ 동반 test 이전) — Task 1
- [MODIFY] `apps/web/package.json` (react-hook-form, @hookform/resolvers — catalog) — Task 1
- [MODIFY] `e2e/auth.spec.ts` (+ signup 시나리오) — Task 3

## 🧪 검증

- TDD: LoginForm/SignupForm 단위 테스트 (vitest, 기존 login-form.test.tsx 계승) Red→Green
- full-stack e2e: 기존 7 + 회원가입 성공 + (auth) 골격 렌더
- DESIGN §8 Audit Checklist 자가검증

## 🔁 Rollback — PR revert 단독 가능
