# spec-17-08: 테넌트 격리 — 요청 경로 배선 + 회귀 차단

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-17-08` |
| **Phase** | `phase-17` |
| **Branch** | `spec-17-08-tenant-isolation-request-path` |
| **상태** | Planning |
| **타입** | Fix (security) |
| **Integration Test Required** | yes |
| **작성일** | 2026-06-08 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

spec-17-07 이 DB-level 격리 메커니즘(비-슈퍼유저 role + 요청 tx + ALS proxy)을 닫았다. phase-17 회고(`docs/review/2026-06-08-phase-17-review.md`, 독립 감사 + 코드 검증)에서 **이 메커니즘이 실제 HTTP 요청 경로에서 전혀 작동하지 않음** 을 확인했다.

### 문제점 (회고 Critical, 모두 코드 검증됨)

1. **C-1 JWT 클레임명 불일치**: 토큰 서명은 `activeOrgId`(`signup.service.ts:36`, `org-switch.service.ts:31`), AuthGuard 는 `result.value.orgId`(`auth.guard.ts:59`) 를 읽음. 매핑 부재 → `req.user.orgId` 항상 `null` → `tenant.interceptor.ts:34` 가 tx 미개시 → `set_config` 미발행 → RLS 무컨텍스트(전체 허용). **격리 0**.
2. **C-2 signin/refresh org 클레임 부재**: `signin.service.ts:73,92` = `{sub, role}` 만. 로그인 사용자는 영구 무컨텍스트.
3. **C-3 org_id 미백필 + RLS 과대 적용**: auth 인프라 테이블(sessions/failed_logins/lockouts/audit)에 RLS 가 걸렸으나 org_id 가 NULL(생성 경로 미설정). C-1 을 고쳐 격리를 켜면 세션 조회·rate-limit 이 회귀(NULL row 가 컨텍스트에서 안 보임).
4. **C-4 cross-org invite accept 파손**: `org-invite.service.ts:72` 가 invitations 를 수락자 컨텍스트로 조회 → 초대 org ≠ 수락자 org → RLS 가 가려 항상 NotFound (격리 ON 시).
5. **C-5 초대 토큰-이메일 바인딩 부재**: `accept()` 가 토큰만 검증, `invitation.email` 미확인 → 토큰 입수자가 임의 org 침투(인가 우회). membership 중복 가드·원자성도 부족(W-1).

### 근본 원인 — 거짓 GREEN

격리 e2e 가 raw SQL 로 `set_config` 를 직접 호출해 guard·interceptor·JWT 를 우회 → 메커니즘만 검증, **배선은 미검증**. 137 GREEN 은 "격리가 안 켜져 회귀가 없는" 상태였다. → 실 HTTP 경로 통합 테스트로 회귀 차단이 본 spec 의 핵심.

### 해결 방안 (요약)

(1) 클레임 계약 단일화로 guard 가 `activeOrgId` 를 읽게 하고(C-1) signin/refresh 에 org 클레임 주입(C-2), (2) **RLS 를 org-스코프 도메인 테이블(organizations·memberships·invitations)로 한정**하고 auth 인프라 테이블에서 제거(C-3, spec-17-03 과대적용 정정), (3) 토큰 기반 cross-org 조회를 위한 **시스템 컨텍스트 seam**(C-4) + 초대 토큰-이메일 바인딩·원자화(C-5), (4) **실 HTTP 경로 통합 테스트**(토큰→guard→interceptor→RLS 차단 + 회귀 가드).

## 🎯 요구사항

### Functional Requirements
1. AuthGuard 가 `activeOrgId` 클레임을 읽어 `req.user.orgId` 를 채운다 — 서명/검증 클레임명 계약 일치(상수/타입 단일화).
2. signin·refresh access token 에 `activeOrgId`(= 사용자 home org) + `orgRole` 포함.
3. RLS 테넌트 정책은 `organizations`·`memberships`·`invitations` 에만 적용. auth 인프라(`users`·`sessions`·`failed_logins`·`lockouts`·`auth_audit_logs`)에서 RLS 제거 → 인증/세션 흐름이 org 컨텍스트와 무관하게 동작(회귀 0).
4. 토큰 기반 invite accept 가 시스템 컨텍스트(무-tenant)로 invitation 을 조회하여 cross-org 수락이 동작한다.
5. invite accept 가 `invitation.email == 수락 유저 email` 을 검증하고, membership 중복을 거부하며, 단일 트랜잭션으로 원자 실행된다.
6. **실 HTTP 통합 테스트**: org A 토큰으로 인증된 요청이 org B 의 org-scoped 데이터를 읽을 수 없다(실 endpoint 경유). + 음성 가드(무컨텍스트로 새면 실패).

### Non-Functional Requirements
1. 기존 e2e 전체 GREEN — 특히 signin/refresh/MFA/rate-limit 회귀 0.
2. 격리는 실 요청 경로에서 강제됨이 통합 테스트로 증명(raw SQL 우회 금지 — [[feedback_isolation_test_real_path]]).
3. 클레임명 표류 재발 방지(공유 상수).

## 🚫 Out of Scope

- **쓰기 경로 RLS 강제(`WITH CHECK org_id 일치`)** — 여전히 후속(W-2). 본 spec 은 읽기 격리의 *실 경로 작동* 까지.
- provider 모드(phase-18) org 컨텍스트.
- 운영 풀러(pgbouncer)/풀 사이징(W-4) — infra phase.
- production 슈퍼유저 가드 강화(W-5, BYPASSRLS/role 상속) — 별 항목.

## 📑 ADR 후보

- [x] 후보 `tenant-isolation-runtime-role-and-als-tx` (type: invariant) — W-3 미작성분. 본 spec 에서 **RLS 적용 범위(도메인 테이블 한정) + 클레임 계약 + 시스템 컨텍스트 seam** 까지 포함해 작성. phase-17 의 격리 불변식 SoT.

## 🔗 관련 문서 (Related)

- 회고: `docs/review/2026-06-08-phase-17-review.md`
- 관련 spec: [[spec-17-03]](RLS 과대적용 정정 대상), [[spec-17-05]](클레임/ALS 도입), [[spec-17-07]](DB 메커니즘 — 본 spec 이 실 경로 완성)
- 메모리: [[feedback_isolation_test_real_path]]
- ADR: `docs/adr/0022-multi-tenancy-strategy.md`

## ✅ Definition of Done

- [ ] 모든 단위 테스트 PASS
- [ ] (Integration Test Required = yes) 실 HTTP 격리 통합 테스트 PASS + 기존 e2e 전체 GREEN
- [ ] 회고 C-1~C-5 모두 코드로 해소 (증거 walkthrough)
- [ ] ADR 작성
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-17-08-...` push (PR base = `phase-17`)
- [ ] 사용자 검토 요청 알림 완료
