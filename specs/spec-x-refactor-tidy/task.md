# Task List: spec-x-refactor-tidy

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 모두 behavior-preserving 리팩토링 — 회귀 안전망(기존/신규 테스트 그린)으로 검증.

---

## Task 0: 브랜치 생성
- [x] `git checkout -b spec-x-refactor-tidy` (완료)

---

## Task 1: C1 — signup claim 키 상수화
- [ ] (회귀 안전망) signup 발급 토큰에 `activeOrgId`/`orgRole` 클레임 존재 검증 테스트 확인/보강
- [ ] `signup.service.ts:36` → `[ACTIVE_ORG_CLAIM]`/`[ORG_ROLE_CLAIM]` computed key
- [ ] `pnpm turbo run typecheck test --filter=./apps/api` 그린 + `grep 'activeOrgId:'` 0
- [ ] Commit: `refactor(spec-x-refactor-tidy): use claim constants in signup token`

---

## Task 2: C3 — invite 권한 체크 canInviteMember 재사용
- [ ] (회귀 안전망) 비-owner/admin invite 거부 테스트 확인/보강
- [ ] `org-invite.service.ts:47` → `canInviteMember(membership.role)` (`@repo/backend-authz` dep 추가)
- [ ] typecheck/test 그린 + `grep '["owner", "admin"]'` 0
- [ ] Commit: `refactor(spec-x-refactor-tidy): reuse canInviteMember for invite authz`

---

## Task 3: C2 — 세션 TTL 단일 출처화
- [ ] `@repo/backend-auth-session` 가 `SESSION_TTL_MS` export (기존 `DEFAULT_TTL_MS` 승격)
- [ ] `cookie.helper.ts` 가 import 후 ms→유지 (중복 `MAX_AGE_SECONDS` 제거)
- [ ] `pnpm turbo run typecheck test --filter=@repo/backend-auth-session --filter=./apps/api` 그린
- [ ] Commit: `refactor(spec-x-refactor-tidy): single-source session TTL constant`

---

## Task 4: D1 — http-client sleep 중복 제거
- [ ] `packages/backend/http-client/src/index.ts` 로컬 `sleep` 제거 → `import { sleep } from "@repo/utils"` (dep 확인)
- [ ] `pnpm turbo run typecheck test --filter=@repo/backend-http-client` 그린 + `grep 'const sleep'` 0
- [ ] Commit: `refactor(spec-x-refactor-tidy): drop duplicate sleep, use @repo/utils`

---

## Task 5: B4 — worker console → logger
- [ ] `apps/worker/src/main.ts` `console.info` → logger
- [ ] `pnpm turbo run typecheck lint --filter=./apps/worker` 그린 + `grep 'console.'` 0
- [ ] Commit: `refactor(spec-x-refactor-tidy): use logger instead of console in worker`

---

## Task 6: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] `pnpm turbo run typecheck lint test` (영향 범위) 전부 PASS

### 📝 산출물 작성
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-x-refactor-tidy): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-x-refactor-tidy`
- [ ] PR 생성 (base main)
