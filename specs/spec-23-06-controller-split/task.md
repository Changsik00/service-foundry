# Task List: spec-23-06-controller-split

> One Task = One Commit. 순수 구조 분할(동작 보존) — 라우트 메타 테스트 + typecheck 로 검증.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-06-controller-split` (완료)

---

## Task 1: 라우트 보존 안전망 (DB-free)
- [ ] `route-inventory.test.ts` — 컨트롤러 라우트셋(method,path) 리플렉션 추출 헬퍼 + 현재 17 라우트 스냅샷 기대
- [ ] `pnpm vitest run apps/api/src/auth/route-inventory.test.ts` 그린
- [ ] Commit: `test(spec-23-06): route inventory snapshot for auth controllers`

---

## Task 2: SessionController 추출
- [ ] `session.controller.ts` — csrf + sessions×3 verbatim 이동(데코레이터/가드 포함), deps CSRF_SECRET·SessionManagementService
- [ ] auth.controller 에서 제거, auth.module 등록, route 테스트 합집합 갱신
- [ ] typecheck + route 테스트 그린
- [ ] Commit: `refactor(spec-23-06): extract SessionController from auth.controller`

---

## Task 3: OrgController 추출
- [ ] `org.controller.ts` — org/switch·invite·accept·members verbatim 이동, deps Org{Switch,Invite,Members}Service
- [ ] auth.controller 에서 제거, auth.module 등록, route 테스트 갱신
- [ ] typecheck + route 테스트 그린
- [ ] Commit: `refactor(spec-23-06): extract OrgController from auth.controller`

---

## Task 4: AuthController 정리
- [ ] 잔여 코어 9개만 + 생성자 deps 정리(미사용 import/inject 제거)
- [ ] route-inventory 합집합 == 17 최종 확인
- [ ] `pnpm turbo run typecheck lint --filter=./apps/api` 그린
- [ ] Commit: `refactor(spec-23-06): slim AuthController to auth core`

---

## Task 5: Ship (필수)
### 🚦 Pre-Push Quality Gate
- [ ] route-inventory 17 보존 + `apps/api` typecheck/lint 그린
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-23-06): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-23-06-controller-split`
- [ ] PR 생성 (base main)
