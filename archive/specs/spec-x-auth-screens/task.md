# Task List: spec-x-auth-screens

## Pre-flight
- [x] spec/plan/task 작성 + Plan Accept

## Task 1+2 (병합): features/auth + (auth) 골격 + 로그인 개편 + 회원가입
> 공유 스키마·(auth) 골격으로 두 화면이 단일 응집 변경 — 커밋 분리가 인위적이라 병합.
- [x] 단위 테스트 9건 Red (모듈 부재) → Green. jsdom native email 검증이 submit 차단 → noValidate (Zod 단일화)
- [x] Commit: `feat(spec-x-auth-screens): features/auth 구조 + 로그인·회원가입 화면`

## Task 2.5 (fill-forward 추가): supabase signUp SDK 수정
- [x] 세션 부재 크래시 → unverified_email (TDD 21/21) + rate limit 대소문자
- [x] Commit: `fix(spec-x-auth-screens): supabase signup 세션 부재·rate limit 정규화`

## Task 3: 가드 + e2e 확장
- [x] GuestOnly 가드 + e2e 3종 추가 → 10/10 PASS (Supabase Confirm email OFF — 사용자 토글)
- [x] Commit: `test(spec-x-auth-screens): guestonly 가드 + 회원가입·골격 e2e`

## Task 4: Ship
- [x] Audit Checklist 기록 + walkthrough/pr_description + push + PR
