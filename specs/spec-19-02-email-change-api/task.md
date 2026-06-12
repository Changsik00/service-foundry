# Task List: spec-19-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: DB 마이그레이션 + 알림 빌더

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-02-email-change-api` (base: `phase-19-account-authz`)

### 1-2. 신규 파일 작성
- [ ] `apps/api/drizzle/0017_email_change_tokens.sql` — `email_change_tokens` 테이블
- [ ] `apps/api/drizzle/meta/_journal.json` — 0017 엔트리 추가
- [ ] `apps/api/src/infra/schema/email-change-tokens.ts` — Drizzle 스키마
- [ ] `apps/api/src/infra/schema/index.ts` — `emailChangeTokens` export + `appSchema` 추가
- [ ] `packages/backend/notification/src/index.ts` — `buildEmailChangeEmail` 추가

### 1-3. 검증 및 커밋
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-19-02): email_change_tokens 마이그레이션 + buildEmailChangeEmail`

---

## Task 2: EmailChangeService + Controller (Red→Green)

### 2-1. Store + Service 구현
- [ ] `apps/api/src/auth/email-change.stores.ts` — EmailChangeTokenStore 인터페이스 + Drizzle 구현
- [ ] `apps/api/src/auth/account.stores.ts` — `providerUid`, `updateEmail` 추가
- [ ] `apps/api/src/auth/email-change.service.ts` — `requestEmailChange` / `confirmEmailChange`
- [ ] `apps/api/src/auth/email-change.service.test.ts` — 단위 테스트 7종

### 2-2. Controller + Module 배선
- [ ] `apps/api/src/auth/account.controller.ts` — 2 엔드포인트 추가
- [ ] `apps/api/src/auth/auth.module.ts` — EmailChangeService, EMAIL_CHANGE_TOKEN_STORE 등록
- [ ] `apps/api/src/auth/auth.controller.test.ts` — EMAIL_CHANGE_TOKEN_STORE mock 추가 (필요 시)

### 2-3. e2e 테스트 + 전체 통과
- [ ] `apps/api/src/auth/email-change.e2e.test.ts` — e2e 5종
- [ ] e2e 5종 PASS + 전체 테스트 PASS
- [ ] Commit: `feat(spec-19-02): EmailChangeService + AccountController e2e 5종 Green`

---

## Task 3: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] e2e 5종 PASS (전체 통과)

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-19-02): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-19-02-email-change-api`
- [ ] **PR 생성**: base `phase-19-account-authz` 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 (마이그레이션+빌더 / Green / Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-12 |
