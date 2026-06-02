# Phase Ship: phase-16 — Security Hardening II

> phase base branch `phase-16-security-hardening` → `main` 최종 PR.

## 📋 Overview

phase-15(Security & Wiring Hardening) 2회 회고에서 이월한 보안 후속을 마무리한다. phase-15 는 "구현됐으나 미배선"을 배선했고, 본 phase 는 그 배선의 **잔여 공격면(MFA/passkey CSRF) · 회귀 안전망(보안헤더 SoT) · prod 가드(약한 시크릿 거부) · 클라이언트 견고화(403 자가복구)** 를 닫는다.

## 📦 Scope: 계획 vs 실제

| 구분 | 항목 | 비고 |
|:---:|---|---|
| ✅ 완료 | spec-16-01: MFA/passkey 8개 CSRF 배선 (PR #103) | W5 |
| ✅ 완료 | spec-16-02: applySecurity → configureApp SoT 흡수 (PR #104) | V1 |
| ✅ 완료 | spec-16-03: web-next CSRF 403 자가복구 (PR #105) | W6 |
| ✅ 완료 | phase-FF: W3 prod 시크릿 가드 / V2 csrf.ts 주석 / W4 knip 정리 | a748359 / 1b681e1 / 8a16ce5 |
| ➕ 추가 | 회고 W-1(CORS 회귀 가드) / W-2(undici dead-dep 제거) | 0acf0cf / 38190a5 |
| ⏭ 이연 | MFA SMS/email factor · web-next MFA/passkey 클라이언트 · web-vite/SDK CSRF | Icebox (기능 추가 / 클라이언트 부재) |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| #103 | spec-16-01-mfa-passkey-csrf | mfa/passkey 8 endpoint `CsrfGuard` (ADR-0021 재사용) + e2e |
| #104 | spec-16-02-auth-bootstrap-security-sot | `configureApp(app,{corsOrigin})` 에 applySecurity 흡수 + e2e helmet 검증 |
| #105 | spec-16-03-web-csrf-resilience | web-next `withCsrfRetry` (403 1회 재시도) + 단위 테스트 |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | MFA/passkey 8개 CSRF 미통과 시 403 | ✅ PASS | mfa 4 + passkey 4 `@UseGuards(CsrfGuard)`; e2e verify 2종 403 |
| 2 | 보안헤더(helmet/CORS) SoT, 제거 시 e2e FAIL | ✅ PASS | `app.setup.ts:24`; e2e helmet+CORS 검증, 제거 대조 2건 FAIL 확인 |
| 3 | prod + dev 기본 CSRF/OAUTH 시크릿 기동 거부 | ✅ PASS | `settings.ts` build 가드; `settings.test.ts` 4/4 (throw + dev/강한값 통과) |
| 4 | web-next 403 자가복구(1회 재시도) | ✅ PASS | `auth-api.ts` withCsrfRetry; `auth-api.test.ts` 3/3 |
| 5 | csrf.ts 주석 ADR-0021 정합 + knip redundant ignore 0 | ✅ PASS | csrf.ts csrf_id 정합; apps/api ignoreDependencies 제거(undici dead-dep 삭제) → knip exit 0 |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | MFA verify CSRF 우회 차단 (헤더 없는 POST → 403) | ✅ PASS | auth.e2e "MFA/passkey CSRF 게이트" |
| 2 | 보안헤더 배선 회귀 차단 (helmet+CORS 헤더 존재, 제거 시 FAIL) | ✅ PASS | auth.e2e "보안 헤더 (helmet/CORS)" + 대조 |
| 3 | prod 약한 시크릿 기동 거부 (loadSettings throw) | ✅ PASS | settings.test 4/4 |

> 전체 회귀: `apps/api` 110/110, `web-next` 24/24 (real PG 5434), `pnpm turbo run lint typecheck test knip depcruise` **136/136**.

## 🏗 Architecture Decisions

- **ADR-0021 재사용 (신규 ADR 없음)**: MFA/passkey CSRF 도 csrf_id double-submit(session 비의존)로 보호 — 미인증 verify/authenticate endpoint 커버.
- **configureApp SoT 확장**: phase-15 C1 의 미들웨어 SoT 에 helmet/CORS 흡수 → prod·e2e 단일 경로, 배선 제거 시 동시 실패. RCA-003(배선 검증) Invariant 적용.

## ⚠️ Known Issues / Technical Debt

- web-next 에 MFA/passkey 클라이언트 메서드 부재(보일러플레이트 의도적 미배선) — 메서드 추가 시 `csrfOpts` 자동 헤더 동반 → Icebox.
- web-vite / `packages/frontend/auth-*` SDK CSRF 미적용 → Icebox.

## 📝 Follow-up Work

- MFA SMS/email OTP factor (기능 추가) → Icebox
- web-next MFA/passkey 클라이언트 + web-vite/SDK CSRF 헤더 → Icebox
- 다음: phase-17 (deploy/k8s manifest 예제)

## 📊 Stats

- **Files changed**: 32
- **Lines**: +1,191, -151
- **Commits**: 26 (3 spec PR merge + phase-FF/docs/회고 보완)
- **Test**: apps/api 110/110, web-next 24/24, 통합 시나리오 3/3, 성공기준 5/5
- **Specs**: 3개 완료 + phase-FF 3 + 회고 보완 2
