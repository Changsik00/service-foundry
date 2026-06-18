# Task List: spec-19-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: SessionStore 확장 + SessionManagementService (Green)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-03-session-management-api` (base: `phase-19-account-authz`)

### 1-2. SessionStore 패키지 확장
- [ ] `packages/backend/auth-session/src/store.ts` — `listActiveByUser`, `findById`, `revokeOthers` 추가
- [ ] `packages/backend/auth-session/src/drizzle-store.ts` — 3개 메서드 구현
- [ ] `packages/backend/auth-session/src/session.test.ts` — fake store 업데이트

### 1-3. 기존 테스트 mock 업데이트
- [ ] `passkey.service.test.ts`, `signin.service.test.ts`, `signup.service.test.ts`, `email-change.service.test.ts` — `vi.fn()` 추가

### 1-4. SessionManagementService + e2e
- [ ] `apps/api/src/auth/session-management.service.ts` 신규
- [ ] `apps/api/src/auth/session-management.service.test.ts` — 단위 테스트
- [ ] `apps/api/src/auth/auth.controller.ts` — 3개 엔드포인트 추가
- [ ] `apps/api/src/auth/auth.controller.test.ts` — mock 업데이트
- [ ] `apps/api/src/auth/auth.module.ts` — SessionManagementService 등록
- [ ] `apps/api/src/auth/session-management.e2e.test.ts` — e2e 4종
- [ ] e2e 4종 PASS + 전체 테스트 PASS
- [ ] Commit: `feat(spec-19-03): SessionManagementService + 세션 API e2e 4종 Green`

---

## Task 2: SessionsCard 프론트 컴포넌트

### 2-1. 쿼리 + 컴포넌트
- [ ] `apps/web/src/features/account/queries.ts` — `sessionQueries.list()`, `sessionMutations` 추가
- [ ] `apps/web/src/features/account/SessionsCard.tsx` 신규
- [ ] `apps/web/src/features/account/index.ts` — export 추가
- [ ] `apps/web/src/app/(console)/page.tsx` — `SessionsCard` 추가
- [ ] `pnpm turbo run typecheck` → PASS
- [ ] Commit: `feat(spec-19-03): SessionsCard 컴포넌트 + 대시보드 노출`

---

## Task 3: Ship

### 🚦 Pre-Push Quality Gate

- [ ] `pnpm turbo run typecheck` → PASS
- [ ] 전체 테스트 PASS

### 📝 산출물 작성

- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-19-03): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-19-03-session-management-api`
- [ ] **PR 생성**: base `phase-19-account-authz` 대상
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 (백엔드 Green / 프론트 / Ship) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-12 |
