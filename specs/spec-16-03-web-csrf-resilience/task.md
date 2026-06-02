# Task List: spec-16-03

> One Task = One Commit. 매 commit 직후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋
- [x] `git checkout -b spec-16-03-web-csrf-resilience` (phase base 에서)
- [x] Commit: `docs(spec-16-03): add spec/plan/task`

## Task 2: 403 자가복구 + 단위 테스트 (TDD)
- [x] Red: mock HttpClient (1) 403→재발급→재시도 성공, (2) 계속 403→throw+post 2회, (3) 401→즉시 throw. 래퍼 전 2건 Fail 확인.
- [x] Green: `auth-api.ts` `is403` + `withCsrfRetry` 추가, signIn/signUp/signOut/refresh 적용.
- [x] 검증: `pnpm --filter @apps/web-next test` 24/24 PASS
- [x] Commit: `fix(spec-16-03): self-recover web-next CSRF 403 ...` (f99cc27)

## Task 3: Ship
- [x] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS (136/136)
- [x] walkthrough.md / pr_description.md 작성
- [x] Ship commit: `docs(spec-16-03): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-16-security-hardening`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 (ship 포함) |
| **예상 commit 수** | 2 (fix + ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-02 |
