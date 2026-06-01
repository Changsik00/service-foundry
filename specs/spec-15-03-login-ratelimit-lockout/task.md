# Task List: spec-15-03

> One Task = One Commit. 매 commit 직후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성 (sdd spec new)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] phase.md SPEC 표 갱신 (sdd 자동)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 + 문서 커밋 ✅
- [x] `git checkout -b spec-15-03-login-ratelimit-lockout`
- [x] Commit: `docs(spec-15-03): add spec/plan/task`

## Task 2: 스키마 + 마이그레이션 ✅
- [x] `index.ts`·`local.ts` 에 `failedLogins`/`lockouts` (`@repo/backend-auth-rate-limit/schema`) + appSchema 포함
- [x] `db:generate` → `drizzle/0008_sad_ogun.sql` 생성 (failed_logins 4col/2idx, lockouts 4col)
- [x] 검증: typecheck PASS + 로컬 DB `db:migrate` 적용 + 테이블 확인
- [x] Commit: `feat(spec-15-03): include failed_logins/lockouts in appSchema + migration`

## Task 3: rate-limit store DI ✅
- [x] `auth/rate-limit.stores.ts` — `RATE_LIMIT_STORE` 심볼 + `InjectRateLimitStore` + `createDrizzleRateLimitStore` (session.stores 패턴)
- [x] `auth.module.ts` provider 등록 (inject:[DATABASE])
- [x] 검증: typecheck PASS
- [x] Commit: `feat(spec-15-03): wire drizzle RateLimitStore provider`

## Task 4: SigninService 배선 (TDD)
- [ ] Red: `signin.service.test.ts` 에 fake store 주입 + 시나리오(5회 실패→429 lock, 성공→reset, 잠긴 계정→429). Fail 확인.
- [ ] Green: `signin.service.ts` — `signIn(email,password,ip)`, isLocked→checkRateLimit→verify→record*. 차단 429(`HttpException`).
- [ ] `auth.controller.ts`: `signIn(email, password, ctx.ip)` 전달.
- [ ] 검증: `pnpm --filter @apps/api test -- signin.service` + typecheck
- [ ] Commit: `feat(spec-15-03): enforce rate-limit + lockout in SigninService`

## Task 5: e2e 통합 검증
- [ ] `auth.e2e.test.ts`: "rate-limit/lockout" describe — 전용 계정 5회 오답(postCsrf)→ 이후 429. 정상 흐름 회귀 확인.
- [ ] 검증(로컬 Postgres 5434): `pnpm --filter @apps/api test` 전체 PASS
- [ ] Commit: `test(spec-15-03): e2e login lockout after N failures`

## Task 6: Ship
- [ ] 게이트: `pnpm turbo run lint typecheck test knip depcruise` (로컬 DB) PASS
- [ ] walkthrough.md / pr_description.md 작성
- [ ] Ship commit: `docs(spec-15-03): ship walkthrough and pr description`
- [ ] Push + PR (base: `phase-15-security-wiring`)
- [ ] 사용자 알림 (PR URL)

---

## 진행 요약
| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 (+ ship 포함) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-01 |
