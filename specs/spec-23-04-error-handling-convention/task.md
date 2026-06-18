# Task List: spec-23-04-error-handling-convention

> One Task = One Commit.

---

## Task 0: 브랜치
- [x] `git checkout -b spec-23-04-error-handling-convention` (완료)

---

## Task 1: ADR-0027 작성
- [ ] `docs/adr/0027-error-handling-layering.md` (type: convention, 템플릿 준수)
- [ ] `docs/index.md` Decisions 카탈로그 등재
- [ ] Commit: `docs(spec-23-04): ADR-0027 error handling layering`

---

## Task 2: AppErrorFilter 구현 + 등록 + 테스트 (TDD)
- [ ] `app-error.filter.test.ts` 작성 → Fail 확인
- [ ] `app-error.filter.ts` 구현 (`@Catch(AppError)` → statusCode + toJSON)
- [ ] `app.setup.ts configureApp` 에 `useGlobalFilters` 등록
- [ ] `pnpm vitest run apps/api/src/infra/app-error.filter.test.ts` + typecheck 그린
- [ ] Commit: `feat(spec-23-04): global AppError exception filter`

---

## Task 3: oauth dead/raw throw 정리
- [ ] oauth.service 의 raw `throw new Error("Unknown provider")` 정리 (getProvider AppError + 필터가 처리)
- [ ] `oauth.service.test` 갱신 (미지원 provider → AppError 경로)
- [ ] `pnpm vitest run apps/api/src/auth/oauth.service.test.ts` 그린
- [ ] Commit: `refactor(spec-23-04): drop dead raw throws in oauth.service`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] `apps/api` typecheck/lint + 신규/영향 테스트 그린

### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-23-04): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-23-04-error-handling-convention`
- [ ] PR 생성 (base main)
