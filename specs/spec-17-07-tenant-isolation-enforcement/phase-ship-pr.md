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
| ➕ 추가 | spec-17-07: 테넌트 격리 실효화 (RLS 강제 배선) (PR #117) | ship 전 검증서 격리 부재 발견 → 추가 |

## 📊 Spec Summary

| PR | Spec | 핵심 변경 |
|---|---|---|
| #111 | spec-17-01-email-adapter | notification stub → Resend 실 어댑터, password-reset/verify 실발송 |
| #112 | spec-17-02-multi-tenancy-entity-schema | organizations/memberships/invitations 스키마 + contracts |
| #113 | spec-17-03-org-id-retrofit-rls | 기존 8 테이블 org_id + RLS 정책 |
| #114 | spec-17-04-personal-workspace-provisioning | signup 시 개인 org + owner 멤버십 (공용 seam) |
| #115 | spec-17-05-active-org-token-claims-and-switch | JWT active_org 클레임, org switch, ALS/interceptor |
| #116 | spec-17-06-org-invite-accept-flow | 초대/수락 endpoint, invitation 토큰 |
| #117 | spec-17-07-tenant-isolation-enforcement | 비-슈퍼유저 role + 요청 tx ALS proxy → RLS 격리 실효화 |

## ✅ Success Criteria Checklist

| # | 기준 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | `POST /auth/password/forgot` 실 이메일 발송 | ✅ PASS | `ResendNotifier` 배선 + production 가드. e2e 발송 경로 검증 (실 전송은 `RESEND_API_KEY` 운영 설정 의존) |
| 2 | `POST /auth/signup` → organizations+memberships 자동 생성 | ✅ PASS | provision/signup/e2e GREEN |
| 3 | RLS `app.current_org=wrong` 시 타 org 접근 불가 (DB-level) | ✅ PASS | `tenant-isolation.e2e` — app_runtime + context=A 에서 org B row 차단 실측 (17-07) |
| 4 | `POST /auth/org/switch` → active_org_id 클레임 변경 | ✅ PASS | org-switch/e2e GREEN |
| 5 | 기존 e2e 전체 GREEN (회귀 0) | ✅ PASS | fresh DB 137 tests / 22 files GREEN |

## 🧪 Integration Test Results

| # | 시나리오 | 결과 | 증거 |
|:---:|---|:---:|---|
| 1 | 이메일 실발송 | ✅ PASS | 어댑터 배선 (실 전송 키 의존) |
| 2 | signup → 개인 org 자동 생성 | ✅ PASS | e2e GREEN |
| 3 | RLS 격리 (org A→B 차단) | ✅ PASS | DB-level 차단 실측 |
| 4 | org 전환 | ✅ PASS | e2e GREEN |
| 5 | 초대→수락 | ✅ PASS | org-invite 서비스/e2e GREEN |

> 전체 게이트: `pnpm turbo run knip depcruise lint typecheck test build` → **137 tasks GREEN** (fresh DB, 런타임=app_runtime).

## 🏗 Architecture Decisions

- **테넌트 격리 = 비-슈퍼유저 role + RLS + 요청스코프 SET** (ADR 후보 `tenant-isolation-runtime-role-and-als-tx`, type: invariant): 슈퍼유저는 RLS 를 우회(FORCE 도 무력)하므로 런타임 접속을 비-슈퍼유저 `app_runtime` 으로 분리. 요청 스코프 tx + `set_config('app.current_org',…,true)` + `DATABASE` ALS proxy 로 모든 쿼리에 컨텍스트 자동 적용.
- **이메일 어댑터 = Resend** (vs SES): DX·sandbox.
- **프로비저닝 공용 seam**: native signup + provider-first-login(phase-18) 동일 경로.

## ⚠️ Known Issues / Technical Debt

- **쓰기 경로 RLS 미강제**: 정책이 `WITH CHECK(true)` — INSERT/UPDATE 의 org_id 변조 미차단(읽기 격리는 강제됨). 정당한 cross-org 쓰기(invite-accept/provision) 충돌 회피 위해 의도적 분리 → spec-17-08 후보.
- **요청-스코프 tx 의 동시성**: 동시 인증 요청 수가 DB 풀 크기에 제한됨. 운영은 풀 상향 + pgbouncer(tx 모드) 권장.
- **이메일 실 전송**: `RESEND_API_KEY` 운영 설정 의존(미설정 시 production 기동 거부 가드 있음).

## 📝 Follow-up Work

- 쓰기 경로 RLS 강제 (spec-17-08 후보) → `backlog/queue.md` Icebox
- ADR `tenant-isolation-runtime-role-and-als-tx` 작성
- 운영 DB 풀 사이징 / pgbouncer 가이드 (infra phase)

## 📊 Stats

- **Files changed**: 100
- **Lines**: +7117, -43
- **Test suites**: 22 파일 / 137 tests GREEN
- **Specs**: 7개 완료 (17-01 ~ 17-07), 0개 이연
