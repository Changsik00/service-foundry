# Task List: spec-24-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-24-02-retro-defects` (base: `phase-24-refactor-hardening-2`)

---

## Task 2: Wa — OAuth 빈 시크릿 fail-fast

### 2-1. 테스트 (TDD)
- [ ] `oauth.service` 테스트에 케이스 추가: known provider(google) env 미설정 → throw (빈 문자열 진행 아님)
- [ ] 실행 → Fail 확인
- [ ] Commit: `test(spec-24-02): add failing test for oauth empty-secret fail-fast`

### 2-2. 구현
- [ ] `apps/api/src/auth/oauth.service.ts` `getClientId`/`getClientSecret`: env 누락 시 `?? ""` → `AppError` throw
- [ ] 실행 → Pass
- [ ] Commit: `fix(spec-24-02): fail-fast on missing oauth client credentials (Wa)`

---

## Task 3: We — orgRole 런타임 검증

### 3-1. 테스트 (TDD)
- [ ] `packages/nestjs/auth` AuthGuard 테스트: 무효 orgRole claim → null 폴백, 유효 → 보존
- [ ] 실행 → Fail 확인
- [ ] Commit: `test(spec-24-02): add failing test for orgRole runtime validation`

### 3-2. 구현
- [ ] `auth.guard.ts`: `OrgRole.safeParse` 검증 + `AuthenticatedUser.orgRole: OrgRole | null`
- [ ] `org-roles.guard.ts`: `as OrgRole` 캐스트 제거
- [ ] `verifier.ts`: 주석 갱신
- [ ] 실행 → Pass, typecheck 회귀 0
- [ ] Commit: `fix(spec-24-02): validate orgRole claim at auth boundary (We)`

---

## Task 4: Wf — ADR-0027 보강 (docs)

- [ ] `docs/adr/0027-error-handling-layering.md`: AppErrorFilter 하드닝(statusCode 클램프 + 5xx 본문 message/details 억제) 동작 명문화
- [ ] Commit: `docs(spec-24-02): document AppErrorFilter hardening in ADR-0027 (Wf)`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] 단위 테스트(oauth.service + nestjs-auth) PASS
- [ ] `npx turbo run lint typecheck` PASS
- [ ] (회귀) 로컬 5434 DB 기동 후 e2e PASS (`reference_local_e2e_db_recipe`)

### 📝 산출물 작성
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-24-02): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-24-02-retro-defects`
- [ ] PR 생성 (base: `phase-24-refactor-hardening-2`)
