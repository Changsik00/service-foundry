# Task List: spec-x-org-members-defensive-scope

> One Task = One Commit. defense-in-depth — 격리 e2e 회귀 0 필수.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-x-org-members-defensive-scope` (base: `main`)

## Task 2: 명시 org 스코프 (TDD)
### 2-1. 테스트 (Red)
- [ ] org-members 단위 테스트: `list(orgId, ...)` 가 명시 `WHERE org_id` 로 타 org 제외 (RLS 없는 mock db 에서도 스코프 — 이중방어 증명)
- [ ] 실행 → Fail
- [ ] Commit: `test(spec-x-org-members-defensive-scope): add failing test for explicit org scope`
### 2-2. 구현 (Green)
- [ ] `org-members.service.ts`: `orgId` 파라미터 + `eq(memberships.orgId, orgId ?? NIL_UUID)`
- [ ] `org.controller.ts` / `provider-org.controller.ts`: `user.orgId` 전달
- [ ] 실행 → Pass, typecheck
- [ ] Commit: `fix(spec-x-org-members-defensive-scope): add explicit org_id scope to org-members (defense-in-depth)`

## Task 3: Ship
### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test` + 격리/멤버 e2e (로컬 5434 DB) → 회귀 0
### 📝 산출물
- [ ] walkthrough.md (A/B 감사 안전 확인 포함) / pr_description.md
- [ ] Commit: `docs(spec-x-org-members-defensive-scope): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-x-org-members-defensive-scope`
- [ ] PR 생성 (base: `main`)
