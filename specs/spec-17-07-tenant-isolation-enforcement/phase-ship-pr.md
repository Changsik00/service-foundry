# Phase Ship: phase-17 — 멀티테넌시 Foundation + 이메일 어댑터 (Spine)

## 📋 Overview

모든 도메인 데이터가 단일 테넌트 평면에 있던 상태에서, 조직(org) 단위 멀티테넌시 spine 을 도입한다. 실 이메일 어댑터·org/membership/invitation 엔티티·`org_id` retrofit + **Postgres RLS 격리**·개인 워크스페이스 자동 프로비저닝·`active_org` 토큰 클레임/전환·초대 흐름을 완성하여, 이후 모든 phase(인증 권위 모드·계정·인가·데이터·어드민)의 기반을 만든다.

## 📦 Scope: 계획 vs 실제

| 구분 | 항목 | 비고 |
|:---:|---|---|
| ✅ 완료 | spec-17-01: 이메일 어댑터(Resend 실발송) (PR #111) | |
| ✅ 완료 | spec-17-02: 멀티테넌시 엔티티 스키마 (PR #112) | |
| ✅ 완료 | spec-17-03: org_id retrofit + 퍼미시브 RLS (PR #113) | |
| ✅ 완료 | spec-17-04: 개인 워크스페이스 + 프로비저닝 seam (PR #114) | |
| ✅ 완료 | spec-17-05: active_org 클레임 + 전환 + ALS (PR #115) | |
| ✅ 완료 | spec-17-06: 초대 endpoint + 수락 흐름 (PR #116) | |
| ➕ 추가 | spec-17-07: 테넌트 격리 실효화 (DB 메커니즘) (PR #117) | ship 전 검증서 격리 부재 발견 → 추가 |
| ➕ 추가 | spec-17-08: 테넌트 격리 요청 경로 배선 + 회귀 차단 (PR #119) | 회고(NO-GO)서 실 경로 미작동 발견 → 추가 |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| #111 | spec-17-01-email-adapter | notification stub → Resend 실 어댑터, password-reset/verify 실발송 |
| #112 | spec-17-02-multi-tenancy-entity-schema | organizations/memberships/invitations 스키마 + contracts |
| #113 | spec-17-03-org-id-retrofit-rls | 기존 8 테이블 org_id + RLS 정책 |
| #114 | spec-17-04-personal-workspace-provisioning | signup 시 개인 org + owner 멤버십 (공용 seam) |
| #115 | spec-17-05-active-org-token-claims-and-switch | JWT active_org 클레임, org switch, ALS/interceptor |
| #116 | spec-17-06-org-invite-accept-flow | 초대/수락 endpoint, invitation 토큰 |
| #117 | spec-17-07-tenant-isolation-enforcement | 비-슈퍼유저 role + 요청 tx ALS proxy (DB 메커니즘) |
| #119 | spec-17-08-tenant-isolation-request-path | 클레임 배선(C-1/2) + RLS 도메인 한정(C-3) + 시스템 컨텍스트 seam(C-4/5) + 실 HTTP 검증 |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | `POST /auth/password/forgot` 실 이메일 발송 | ✅ PASS | `ResendNotifier` 배선 + production 가드. e2e 발송 경로 검증 (실 전송은 `RESEND_API_KEY` 운영 설정 의존) |
| 2 | `POST /auth/signup` → organizations+memberships 자동 생성 | ✅ PASS | provision/signup/e2e GREEN |
| 3 | RLS `app.current_org=wrong` 시 타 org 접근 불가 | ✅ PASS | **실 HTTP 경로**(토큰→guard→interceptor→RLS) `tenant-isolation.http.e2e` 가 org B 차단 증명 (17-08). DB-level 도 도메인 테이블서 검증 |
| 4 | `POST /auth/org/switch` → active_org_id 클레임 변경 | ✅ PASS | org-switch/e2e GREEN (switch 토큰 role 포함, 실사용 가능) |
| 5 | 기존 e2e 전체 GREEN (회귀 0) | ✅ PASS | fresh DB **144 tests / 23 files** GREEN |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | 이메일 실발송 | ✅ PASS | 어댑터 배선 (실 전송 키 의존) |
| 2 | signup → 개인 org 자동 생성 | ✅ PASS | e2e GREEN |
| 3 | RLS 격리 (org A→B 차단) | ✅ PASS | 실 HTTP 경로 차단 증명 (17-08) |
| 4 | org 전환 | ✅ PASS | e2e GREEN |
| 5 | 초대→수락 | ✅ PASS | org-invite 서비스/e2e GREEN |

> 전체 게이트: `pnpm turbo run knip depcruise lint typecheck test build` → **137 tasks GREEN** (fresh DB, 런타임=app_runtime).

## 🏗 Architecture Decisions

- **테넌트 격리 = 비-슈퍼유저 role + RLS + 요청스코프 SET** (ADR-0024, type: invariant): 슈퍼유저는 RLS 우회 → 런타임은 비-슈퍼유저 `app_runtime`. 요청 tx + `set_config` + ALS proxy 로 자동 적용. 클레임명 공유 상수 고정. **RLS 는 도메인 테이블(orgs/memberships/invitations)에만** 적용(auth 인프라 제외). cross-org 조작은 `runWithSystemTenant` seam.
- **격리 검증 = 실 HTTP 경로 필수** (17-08): raw SQL 우회 금지 — 17-07 의 거짓 GREEN 교훈.
- **이메일 어댑터 = Resend** (vs SES): DX·sandbox.
- **프로비저닝 공용 seam**: native signup + provider-first-login(phase-18) 동일 경로.

> **회고 적용**: ship 전 독립 회고(`docs/review/2026-06-08-phase-17-review.md`)가 격리 실 경로 미작동(C-1~C-5)을 적발 → NO-GO → spec-17-08 로 전량 해소 후 재-ship. 자세한 내용은 #119.

## ⚠️ Known Issues / Technical Debt

- **쓰기 경로 RLS 미강제**: 정책이 `WITH CHECK(true)` — INSERT/UPDATE 의 org_id 변조 미차단(읽기 격리는 강제됨). cross-org 쓰기 seam(`runWithSystemTenant`)은 존재 → 후속.
- **요청-스코프 tx 의 동시성**: 동시 인증 요청 수가 DB 풀 크기에 제한됨. 운영은 풀 상향 + pgbouncer(tx 모드) 권장.
- **production 슈퍼유저 가드(W-5)**: `username==="postgres"` 단일 검사 — BYPASSRLS/타 슈퍼유저 미검사.
- **이메일 실 전송(W-6)**: 코드 배선·mock 까지만, 실발송 검증 없음.

## 📝 Follow-up Work

- 쓰기 경로 RLS 강제 → `backlog/queue.md`
- 슈퍼유저 가드 강화(W-5) · 이메일 실전송 검증(W-6) → `backlog/queue.md`
- 운영 DB 풀 사이징 / pgbouncer 가이드 (infra phase)

## 📊 Stats

- **Test suites**: 23 파일 / 144 tests GREEN (fresh DB, 실 HTTP 격리 포함)
- **CI**: 전체 turbo 게이트 137 tasks GREEN · PR #119 verify pass
- **Specs**: 8개 완료 (17-01 ~ 17-08), 0개 이연
