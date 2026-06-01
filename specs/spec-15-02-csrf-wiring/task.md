# Task List: spec-15-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신합니다.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋 ✅
- [x] `git checkout -b spec-15-02-csrf-wiring` (phase base 에서)
- [x] Commit: `docs(spec-15-02): add spec/plan/task` (751f359; 시크릿 가드 오탐 warn 우회)

## Task 2: settings CSRF_SECRET ✅
- [x] `apps/api/src/settings.ts` 에 `CSRF_SECRET: z.string().min(1).default(...)` 추가 (OAUTH_STATE_SECRET 패턴)
- [x] 검증: `pnpm --filter @apps/api typecheck` PASS
- [x] Commit: `feat(spec-15-02): add CSRF_SECRET to app settings`

## Task 3: CSRF 쿠키 헬퍼 (TDD)
- [ ] Red: `apps/api/src/auth/csrf.cookie.test.ts` — `setCsrfCookies`(csrf_id+csrf_token Set-Cookie, body 토큰 반환)·`readCsrfId` 기대. Fail 확인.
- [ ] Green: `apps/api/src/auth/csrf.cookie.ts` 구현 (랜덤 csrf_id, `issueCsrfToken` 재사용, 쿠키 옵션은 cookie.helper 정책 일관)
- [ ] 검증: `pnpm --filter @apps/api test -- csrf.cookie`
- [ ] Commit: `feat(spec-15-02): add CSRF cookie helper (issue/rotate/read)`

## Task 4: CsrfGuard (TDD)
- [ ] Red: `apps/api/src/auth/csrf.guard.test.ts` — 정상 통과 / 헤더 누락 / 위조 / csrf_id 쿠키 부재 → 각 기대(통과 or Forbidden). Fail 확인.
- [ ] Green: `apps/api/src/auth/csrf.guard.ts` 구현 (`verifyCsrfToken` 재사용, secret DI, 실패 시 `ForbiddenException`)
- [ ] 검증: `pnpm --filter @apps/api test -- csrf.guard`
- [ ] Commit: `feat(spec-15-02): add CsrfGuard (double-submit verify)`

## Task 5: 컨트롤러 배선
- [ ] `GET /auth/csrf` 부트스트랩 endpoint 추가 (body `{ csrfToken }`)
- [ ] 8개 POST(signin/signup/signout/refresh + password reset·confirm, email verify·confirm)에 `@UseGuards(CsrfGuard)` 적용
- [ ] signin/signup 성공 분기에 `setCsrfCookies` rotate + 응답 body `csrfToken` 추가
- [ ] `auth.module.ts` provider 정합 (필요 시)
- [ ] 검증: `pnpm --filter @apps/api typecheck && pnpm --filter @apps/api test`
- [ ] Commit: `feat(spec-15-02): wire CsrfGuard + bootstrap into auth controller`

## Task 6: e2e 통합 검증
- [ ] `auth.e2e.test.ts`: 기존 signin/refresh/signout 케이스에 부트스트랩+`X-Csrf-Token` 동반(보정)
- [ ] CSRF 누락/위조 → 403 케이스 추가 (refresh + 미인증 password/reset 각 1)
- [ ] 검증: `pnpm --filter @apps/api test` (e2e 포함 PASS)
- [ ] Commit: `test(spec-15-02): e2e CSRF bypass blocked + happy path`

## Task 7: web-next 헤더 첨부
- [ ] `apps/web-next/src/lib/auth-api.ts`(+`auth-sdk.ts`): `fetchCsrf()` 로 토큰 확보·보관, 보호 POST 에 `X-Csrf-Token` 첨부, 응답 새 토큰 반영
- [ ] 검증: `pnpm --filter @apps/web-next typecheck test`
- [ ] Commit: `feat(spec-15-02): attach X-Csrf-Token in web-next auth client`

## Task 8: Ship
- [ ] 게이트: `pnpm turbo run lint typecheck test knip depcruise` PASS
- [ ] walkthrough.md 작성
- [ ] pr_description.md 작성
- [ ] Ship commit: `docs(spec-15-02): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-15-security-wiring`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 8 (+ ship) |
| **예상 commit 수** | ~8 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-01 |
