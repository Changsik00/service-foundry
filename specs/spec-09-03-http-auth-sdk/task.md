# Task List: spec-09-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new http-auth-sdk`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-09.md SPEC 표 갱신)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + auth-http 패키지 스캐폴드 + TDD Red

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-09-03-http-auth-sdk` (from `phase-09-login-admin`)

### 1-2. auth-http 패키지 스캐폴드 + 테스트 작성 (TDD Red)
- [x] `packages/frontend/auth-http/` 패키지 생성 (package.json, tsconfig.json, biome.jsonc, src/index.ts 스텁)
- [x] `packages/frontend/auth-http/src/index.test.ts` 작성 (8 테스트 케이스)
- [x] `pnpm --filter @repo/frontend-auth-http test` → Fail 확인
- [x] Commit: `test(spec-09-03): auth-http TDD Red`

---

## Task 2: createHttpAuthSDK 구현 + web-next auth.ts 교체 (TDD Green)

### 2-1. 구현 + 교체
- [x] `packages/frontend/auth-http/src/index.ts` 구현
- [x] `apps/web-next/src/lib/auth.ts` → `createHttpAuthSDK("http://localhost:3001")`
- [x] `pnpm install` (workspace 연결)
- [x] `pnpm --filter @repo/frontend-auth-http test` → PASS
- [x] `pnpm -r typecheck` → PASS
- [x] Commit: `feat(spec-09-03): createHttpAuthSDK 구현 + web-next auth.ts 교체`

---

## Task 3: Ship

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-09-03): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-09-03-http-auth-sdk`
- [ ] **PR 생성** (base: `phase-09-login-admin`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
