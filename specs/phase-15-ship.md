# Phase Ship: phase-15 — Security & Wiring Hardening

> phase base branch `phase-15-security-wiring` → `main` 최종 PR.

## 📋 Overview

"YAGNI 면제" 보일러플레이트에 **구현됐으나 동작 경로에 배선되지 않은** 보안·검증 기능이 누적됐다(spec-14-08 에서 CSRF 미배선 우연 발견 → 전수 조사로 5건 확인, `docs/review/2026-06-01-wiring-audit.md`). 본 phase 는 이 5건(CSRF, 로그인 rate-limit/lockout, CI dead-code/boundary 게이트, request-id 추적, 생성기 tsconfig 정합)을 실제 동작 경로에 연결하여 "코드는 있는데 안 돌던" 상태를 해소한다.

## 📦 Scope: 계획 vs 실제

| 구분 | 항목 | 비고 |
|:---:|---|---|
| ✅ 완료 | spec-15-01: CI knip+depcruise 게이트 (PR #94) | phase-14 성공기준5 미충족분 완성 |
| ✅ 완료 | spec-15-02: CSRF double-submit 배선 (PR #95) | auth 8 endpoint + web-next |
| ✅ 완료 | spec-15-03: 로그인 rate-limit + lockout (PR #96) | failed_logins/lockouts + SigninService |
| ✅ 완료 | spec-15-04: request-id 미들웨어 배선 (PR #97) | main.ts + x-request-id |
| ✅ 완료 | spec-15-05: 생성기 backend tsconfig (PR #98) | types:["node"] |
| ➕ 추가 | review C1: e2e 가 main.ts 배선 SoT(configureApp) 공유 | phase FF (d6e43d8) — 배선 회귀 차단 |
| ➕ 추가 | RCA-003 / ADR-0021 | 회고 W1/W2 산출물 |
| ⏭ 이연 | MFA/passkey CSRF · prod secret 가드 · web-next 403 자가복구 · knip ignore 정리 | 회고 W3~W6 → Icebox |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| #94 | spec-15-01-ci-knip-depcruise-gate | `verify.yml` 에 knip+depcruise step, dead export 정리, `@public` 보존 태그 |
| #95 | spec-15-02-csrf-wiring | `CsrfGuard`(double-submit) + cookie helper + CSRF_SECRET DI, web-next 헤더 동반 |
| #96 | spec-15-03-login-ratelimit-lockout | failed_logins/lockouts 스키마+마이그레이션(0008), SigninService 5호출 배선 |
| #97 | spec-15-04-request-id-wiring | `main.ts` requestIdMiddleware 적용 + x-request-id 응답 헤더 |
| #98 | spec-15-05-generator-tsconfig | 생성기 backend tsconfig `types:["node"]` + 템플릿 회귀 테스트 |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | CSRF 배선 (상태변경 거부) | ✅ PASS | `auth.controller.ts` CsrfGuard 8개 endpoint(인증 4 + 미인증 4); e2e 헤더누락/csrf_id부재/위조 → 403, 동반 → 200 |
| 2 | 로그인 rate-limit + lockout | ✅ PASS | `signin.service.ts` 5호출(isLocked/checkRateLimit/recordFailure/evaluateLockout/recordSuccess); migration `0008` (failed_logins/lockouts +2 idx); e2e 5×401 → 429 |
| 3 | CI knip+depcruise 게이트 | ✅ PASS | `verify.yml:54` `pnpm turbo run knip depcruise` (clean exit 0); spec-15-01 canary: knip unused→exit1, depcruise frontend→backend→exit1 |
| 4 | request-id 배선 | ✅ PASS | `main.ts:19` configureApp → `app.setup.ts:16` requestIdMiddleware; e2e reqId 2건. 부정검증: 배선 제거 시 e2e 2건 FAIL (C1, d6e43d8) |
| 5 | 생성기 tsconfig 정합 | ✅ PASS | `templates.ts:117-118` backend→`{types:["node"]}`; 단위 5 PASS; 대조: types 제거 시 TS2584/TS2591 exit2 |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | CSRF 우회 차단 (토큰 없이 POST /auth/refresh → 403, 동반 → 200) | ✅ PASS | auth.e2e "CSRF 게이트" describe |
| 2 | brute-force lockout (동일 계정 5회 실패 → 이후 429) | ✅ PASS | auth.e2e "로그인 rate-limit + lockout" |
| 3 | CI 게이트가 dead-code/경계 위반 차단 (red) | ✅ PASS | 게이트 wired + spec-15-01 canary 주입 검증 |

> 전체 회귀: `apps/api` 102/102 PASS (real PG 5434), `pnpm turbo run lint typecheck test knip depcruise` 전 PASS.

## 🏗 Architecture Decisions

- **ADR-0021 (CSRF 바인딩)**: 토큰을 session 이 아닌 per-client `csrf_id` 쿠키에 바인딩(double-submit). 미인증 상태변경 endpoint 보호를 위함. trade-off: session-revoke 자동 무효화 포기.
- **review C1 (배선 검증 패턴)**: 미들웨어 배선을 `configureApp` SoT 로 추출 — main.ts·e2e 가 동일 함수를 공유해, 배선 제거 시 prod·test 동시 실패. "테스트 존재 ≠ 배선 검증" 함정 차단.

## ⚠️ Known Issues / Technical Debt

- **MFA/passkey 상태변경 POST 8개 CSRF 미보호** (회고 W5): `mfa/totp/*`·`passkey/*`. 의도적 후속 — ADR-0021 메커니즘 동일 적용 가능.
- **CSRF/OAuth secret prod 가드 부재** (회고 W3): `NODE_ENV=production` 에서도 dev 기본값 통과 (기존 패턴).
- **knip 40 redundant hint** (회고 W4): spec-15-02 실배선 후 spec-15-01 ignore 잔존. 비차단.

## 📝 Follow-up Work

- W3 (prod secret 가드) · W5 (MFA/passkey CSRF) · W6 (web-next 403 자가복구 + SDK 헤더) · W4 (knip ignore 정리) → `backlog/queue.md` Icebox
- **RCA-003**: phase-ship 성공기준 문자 단위 대조 + 부정 검증 체크리스트 → `/hk-phase-ship` 절차(harness 로컬) 반영 대상
- 다음: phase-16 (deploy/k8s manifest)

## 📊 Stats

- **Files changed**: 67
- **Lines**: +3,455, -185
- **Commits**: 49 (5 spec PR merge + phase FF/docs)
- **Test**: apps/api 102/102, 통합 시나리오 3/3, 성공기준 5/5
- **Specs**: 5개 완료, 0개 이연 (회고 항목 4건 Icebox)
