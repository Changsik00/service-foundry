# Task List: spec-17-08

> One Task = One Commit. 매 commit 후 체크박스 갱신.

## Pre-flight
- [x] Spec ID 확정 + 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성
- [x] 백로그(phase-17.md) 표 갱신 (sdd spec new)
- [ ] 사용자 Plan Accept

---

## Task 1: 통합 테스트용 read endpoint + 실 HTTP 격리 테스트 (TDD Red)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-17-08-tenant-isolation-request-path` (시작점 phase-17)

### 1-2. GET /auth/org/members endpoint
- [ ] `auth.controller.ts` + service: active org 멤버 목록(AuthGuard 보호, RLS 자동 스코프)
- [ ] Commit: `feat(spec-17-08): add GET /auth/org/members (org-scoped read)`

### 1-3. 실 HTTP 격리 통합 테스트 (Red)
- [ ] `apps/api/src/auth/tenant-isolation.http.e2e.test.ts`: 유저 A(org A)·B(org B) signup → A 토큰으로 members 조회 시 B 안 보임 + 음성 가드
- [ ] 실행 → **Fail 확인**(C-1 로 컨텍스트 미설정 → B 노출)
- [ ] Commit: `test(spec-17-08): add failing real-HTTP cross-org isolation e2e`

---

## Task 2: 클레임 계약 수정 (C-1)
- [ ] 공유 상수 `ACTIVE_ORG_CLAIM` 도입 + `auth.guard.ts` 가 `activeOrgId` 읽기
- [ ] guard 단위 테스트 갱신 → Pass
- [ ] Commit: `fix(spec-17-08): guard reads activeOrgId claim into req.user.orgId`

## Task 3: signin/refresh org 클레임 (C-2)
- [ ] `signin.service.ts` 서명 2곳에 `activeOrgId`/`orgRole` 주입 + 단위 테스트
- [ ] Commit: `fix(spec-17-08): include activeOrgId/orgRole in signin & refresh tokens`

## Task 4: RLS 범위 정정 (C-3)
- [ ] `0013_rls_scope_domain_only.sql`(+journal): auth 인프라 5테이블 RLS/정책 제거, 도메인 3테이블 유지
- [ ] refresh/signin/rate-limit 회귀 검증
- [ ] Commit: `feat(spec-17-08): scope RLS to domain tables only (drop on auth infra)`

## Task 5: 시스템 컨텍스트 seam + invite accept (C-4/C-5/W-1)
- [ ] `tenant.ts`: `runWithSystemTenant` 헬퍼 + 단위 테스트
- [ ] `org-invite.service.ts` accept: 시스템 컨텍스트 조회 + email 바인딩 + membership unique + tx 원자화 + 단위 테스트(불일치/중복/만료/재사용)
- [ ] Commit: `fix(spec-17-08): system-context invitation lookup + email binding on accept`

## Task 6: 통합 GREEN 전환 + 전체 회귀
- [ ] Task 1-3 통합 테스트 GREEN 확인 + 전체 e2e GREEN
- [ ] Commit: (필요 시 미세 조정) 없으면 생략

## Task 7: ADR (W-3)
- [ ] `docs/adr/00NN-tenant-isolation-enforcement.md` (type: invariant)
- [ ] Commit: `docs(spec-17-08): ADR tenant-isolation-runtime-role-and-als-tx`

---

## Task N: Ship
### 🚦 Pre-Push Quality Gate
- [ ] lint/typecheck/knip/depcruise/test/build (fresh DB + app_runtime) GREEN
- [ ] 회고 C-1~C-5 해소 로그 확보

### 📝 산출물
- [ ] walkthrough.md (회고 항목별 Before/After 증거)
- [ ] pr_description.md
- [ ] Ship Commit: `docs(spec-17-08): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] Push: `git push -u origin spec-17-08-tenant-isolation-request-path`
- [ ] PR: `gh pr create --base phase-17`
- [ ] 사용자 알림 + PR URL

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task 수 | 7 작업 + Ship |
| 예상 commit 수 | ~9 |
| 현재 단계 | Planning |
| 마지막 업데이트 | 2026-06-08 |
