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

## Task 3: CSRF 쿠키 헬퍼 (TDD) ✅
- [x] `csrf.cookie.test.ts` — setCsrfCookies(httpOnly 정책·반환 토큰 일치·rotate)·readCsrfId 4 케이스
- [x] `csrf.cookie.ts` 구현 (랜덤 csrf_id, `issueCsrfToken` 재사용, cookie.helper 옵션 일관)
- [x] 검증: vitest 4 passed + `pnpm --filter @apps/api typecheck` PASS
- [x] Commit: `feat(spec-15-02): add CSRF cookie helper (issue/rotate/read)`

## Task 4: CsrfGuard (TDD) ✅
- [x] `csrf.guard.test.ts` — 정상 / 헤더 누락 / 위조 / csrf_id 부재 4 케이스 (Forbidden 검증)
- [x] `csrf.guard.ts` — `verifyCsrfToken` 재사용, `CSRF_SECRET` Symbol DI 토큰, 실패 시 `ForbiddenException`(403)
- [x] 검증: vitest 4 passed + typecheck PASS
- [x] Commit: `feat(spec-15-02): add CsrfGuard (double-submit verify)`

## Task 5+6: 컨트롤러 배선 + e2e ✅ (상호의존 → 1 commit)
> 가드 배선은 기존 e2e 를 깨므로 테스트 정합과 분리 불가 → green 유지 위해 한 commit.
- [x] `GET /auth/csrf` 부트스트랩 endpoint (body `{ csrfToken }`, 비가드)
- [x] 8개 POST 에 `@UseGuards(CsrfGuard)` (signin/signup/signout/refresh + password reset·confirm, email verify·confirm)
- [x] signin/signup/refresh 성공 시 `setCsrfCookies` rotate + body `csrfToken` (`SignResponse` 타입 확장)
- [x] `auth.module.ts`: `CsrfGuard` provider + `{ provide: CSRF_SECRET, useValue: settings.CSRF_SECRET }`
- [x] `auth.e2e.test.ts`: fresh-bootstrap CSRF 헬퍼(`postCsrf`)로 보호 POST 보정 + "CSRF 게이트" describe(누락/쿠키부재/위조 → 403, GET /auth/csrf 200)
- [x] `auth.controller.test.ts`: 테스트 모듈에 `CSRF_SECRET` provider 추가
- [x] 검증(로컬 Postgres 5434): `pnpm --filter @apps/api test` **97/97 PASS** (e2e 39 포함) + typecheck + knip/depcruise exit 0
- [x] Commit: `feat(spec-15-02): wire CsrfGuard into auth controller + e2e`

## Task 7: web-next 헤더 첨부 ✅
- [x] `auth-api.ts`: 클로저에 csrfToken 보관, `fetchCsrf()`(GET /auth/csrf)+`ensureCsrf`, 보호 POST 에 `X-Csrf-Token` 헤더, 응답 csrfToken 으로 rotate 반영. `SignResponseSchema` 에 csrfToken 추가.
- [x] `auth-sdk.test.ts`: mock http-client `get` 이 `{ csrfToken }` 반환하도록 보정 (auth-sdk.ts 자체는 시그니처 불변이라 무수정)
- [x] 검증: `pnpm --filter @apps/web-next typecheck` + test 21/21 PASS
- [x] Commit: `feat(spec-15-02): attach X-Csrf-Token in web-next auth client`

## Task 8: Ship
- [x] 게이트: `pnpm turbo run lint typecheck test knip depcruise` (로컬 DB) → 136/136 PASS
- [x] walkthrough.md 작성
- [x] pr_description.md 작성
- [x] Ship commit: `docs(spec-15-02): ship walkthrough and pr description`
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
