# Task List: spec-24-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-24-02-retro-defects` (base: `phase-24-refactor-hardening-2`)

---

## Task 2: Wa — OAuth 빈 시크릿 fail-fast

### 2-1. 테스트 (TDD)
- [x] `oauth.service` 테스트에 케이스 추가: known provider(google) env 미설정/빈값 → throw (2 cases)
- [x] 실행 → Fail 확인
- [x] Commit: `test(spec-24-02): add failing test for oauth empty-secret fail-fast` (b86e4df)

### 2-2. 구현
- [x] `apps/api/src/auth/oauth.service.ts`: `requireEnv` 헬퍼로 env 누락 시 `AppError(INTERNAL/500)` throw
- [x] 실행 → Pass (5/5), typecheck PASS
- [x] Commit: `fix(spec-24-02): fail-fast on missing oauth client credentials (Wa)`

---

## Task 3: We — orgRole 런타임 검증

### 3-1. 테스트 (TDD)
- [x] AuthGuard 테스트: 무효 orgRole→null 폴백, 유효(member)→보존 (2 cases)
- [x] 실행 → Fail 확인
- [x] Commit: `test(spec-24-02): add failing test for orgRole runtime validation` (feef272)

### 3-2. 구현
- [x] `auth.guard.ts`: `OrgRole.safeParse` 검증 + `AuthenticatedUser.orgRole: OrgRole | null`
- [x] `org-roles.guard.ts`: `as OrgRole` 캐스트 제거
- [x] `verifier.ts`: 주석 갱신
- [x] 실행 → Pass (28/28), nestjs-auth + apps/api typecheck PASS
- [x] Commit: `fix(spec-24-02): validate orgRole claim at auth boundary (We)`

---

## Task 4: Wf — ADR-0027 보강 (docs)

- [x] `docs/adr/0027-error-handling-layering.md`: Decision §3 + Consequences 에 하드닝(클램프 + 5xx 본문 억제) 명문화
- [x] Commit: `docs(spec-24-02): document AppErrorFilter hardening in ADR-0027 (Wf)`

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
