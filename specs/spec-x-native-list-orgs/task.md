# Task List: spec-x-native-list-orgs

> One Task = One Commit. 안전망: route-inventory + DI smoke + e2e.

---

## Task 1: 브랜치 생성
- [x] `git checkout -b spec-x-native-list-orgs` (base: `main`)

## Task 2: OrgListService.listForUserId + native GET /auth/orgs (TDD)
### 2-1. 테스트 (Red)
- [x] org-list.service 단위: `listForUserId(userId)` → memberships.userId 스코프 + limit. org.controller 단위: `orgs(user)` → `{ orgs }`. route-inventory EXPECTED 에 `GET /auth/orgs [AuthGuard]` 추가
- [x] 실행 → Fail
- [x] Commit: `test(spec-x-native-list-orgs): add failing tests for native /auth/orgs`
### 2-2. 구현 (Green)
- [x] `org-list.service.ts`: `listForUserId(userId)` 추가
- [x] `org.controller.ts`: OrgListService 주입 + `@Get("orgs")`
- [x] `auth.module.ts`: OrgListService provider
- [x] 실행 → 단위 + route-inventory + DI smoke PASS, typecheck
- [x] Commit: `feat(spec-x-native-list-orgs): add native GET /auth/orgs (list my orgs)`

## Task 3: Ship
### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0 (151/151)
- [x] native 실증: AUTH_MODE=native API → csrf→signup→`GET /auth/orgs` 내 org 반환 (e2e 4/4)
### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-x-native-list-orgs): ship walkthrough and pr description`
### 🚀 Push & PR
- [x] `git push -u origin spec-x-native-list-orgs`
- [x] PR 생성 (base: `main`)
