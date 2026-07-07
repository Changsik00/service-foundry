# Task List: spec-26-04

> One Task = One Commit. 보안 하드닝 — 실 격리 e2e 필수(`feedback_isolation_test_real_path`).

---

## Task 1: api_keys RLS backstop (B) (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-04-active-org-membership-gate` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 (Red)
- [x] e2e: org A 토큰으로 `GET /auth/api-keys` → org B 키 미포함; `DELETE /auth/api-keys/:id`(타 org 키) → 403/404
- [x] 실행 → 의도한 RED 또는 회귀 안전망 확인
- [x] Commit: `test(spec-26-04): api_keys cross-org isolation e2e`

### 1-3. 구현 (Green)
- [x] `api-key.service.ts` list/revoke/create → `this.database.db`(ALS tx, RLS 적용). `verifyKey` raw 유지 + 주석. `WHERE org_id` 보존
- [x] fresh DB → e2e PASS, typecheck
- [x] Commit: `fix(spec-26-04): route api_keys org-scoped ops through RLS-applied db`

---

## Task 2: provider active_org 멤버십 게이트 (A) (TDD)

### 2-1. 테스트 (Red)
- [x] supabase/firebase verifier 단위(mock 포트): claim orgB + 비멤버 → orgId=null; 멤버 → orgId+orgRole 채택. provision(무-claim) → 개인 org
- [x] 실행 → Fail (현재 무검증 채택)
- [x] Commit: `test(spec-26-04): provider verifier active_org membership gate`

### 2-2. 구현 (Green)
- [x] provision 포트 확장(supabase/firebase): providerUid+claimOrgId → 멤버십 검증 + internalUserId/orgRole
- [x] 포트 구현(apps/api provision): users.providerUid→id + memberships 조회(시스템 컨텍스트)
- [x] verifier: 멤버 검증 후에만 active_org 채택, 비멤버 fail-close, orgRole 반영
- [x] 단위 PASS, typecheck
- [x] Commit: `fix(spec-26-04): verify active_org membership in provider verifiers (fail-close)`

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0
- [x] (선택) `/hk-refute` — 보안/비가역 변경 적대적 반증

### 📝 산출물
- [x] **walkthrough.md** / **pr_description.md** (+ ADR 판단: provider-active-org-trust)
- [x] Commit: `docs(spec-26-04): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-04-active-org-membership-gate`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
