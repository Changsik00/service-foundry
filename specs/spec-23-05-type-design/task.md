# Task List: spec-23-05-type-design

> One Task = One Commit. 순수 타입 — typecheck + 기존 테스트로 검증.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-05-type-design` (완료)

---

## Task 1: F3 backend — role enum
- [x] org-list/org-members `role` → `OrgRole`, admin `role` → `Role`, org-switch query 결과 타입화
- [x] `pnpm turbo run typecheck --filter=./apps/api` 그린
- [x] Commit: `refactor(spec-23-05): type service role fields with OrgRole/Role`

---

## Task 2: F3 frontend — MemberTable role
- [x] `MemberTable.tsx` role → `OrgRole`, `as keyof` 정리
- [x] `pnpm turbo run typecheck --filter=./apps/web` 그린
- [x] Commit: `refactor(spec-23-05): type MemberTable role with OrgRole`

---

## Task 3: F4 — OAuthUserInfo discriminated union
- [x] `OAuthUserInfo` provider 판별 union + extract/소비자 정합
- [x] `pnpm turbo run typecheck --filter=@repo/backend-auth-oauth --filter=./apps/api` + oauth 테스트 그린
- [x] Commit: `refactor(spec-23-05): discriminated union for OAuthUserInfo`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] 영향 패키지 typecheck/lint + 관련 테스트 그린

### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-23-05): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-23-05-type-design`
- [x] PR 생성 (base main)
