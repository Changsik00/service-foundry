# Task List: spec-08-04

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new sdk-swap-validation`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 백로그 업데이트 (phase-08.md SPEC 표 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성 + AuthProvider prop 타입 수정

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-08-04-sdk-swap-validation` (from `phase-08-provider-adapters`)

### 1-2. auth-react AuthProvider prop 수정 (TDD)
- [ ] `packages/frontend/auth-react/src/provider.tsx` — `sdk: AuthSDK` → `sdk: CoreAuthSDK` 변경
- [ ] `pnpm --filter frontend-auth-react test` → PASS (기존 테스트 통과 확인)
- [ ] `pnpm -r typecheck` → PASS
- [ ] Commit: `feat(spec-08-04): AuthProvider sdk prop → CoreAuthSDK`

---

## Task 2: web-next AuthProvider 연결 + SDK swap 검증

### 2-1. 의존성 추가 + SDK 팩토리 생성 (TDD Red)
- [ ] `apps/web-next/package.json` — `@repo/frontend-auth-react`, `@repo/frontend-auth-testing` 추가
- [ ] `pnpm install --ignore-scripts`
- [ ] `apps/web-next/src/lib/auth.test.ts` 작성 — CoreAuthSDK 타입 검증 + 기본 동작 테스트
- [ ] `pnpm --filter @apps/web-next test` → Fail 확인

### 2-2. auth.ts + providers.tsx 구현 (TDD Green)
- [ ] `apps/web-next/src/lib/auth.ts` — `authSDK = createMockAuthSDK()` (교체 예시 주석 포함)
- [ ] `apps/web-next/src/components/providers.tsx` — `AuthProvider` 추가
- [ ] `pnpm --filter @apps/web-next test` → PASS
- [ ] `pnpm -r typecheck` → PASS (39 packages)
- [ ] Commit: `feat(spec-08-04): web-next AuthProvider 연결 + SDK swap 검증`

---

## Task 3: Ship

- [ ] `pnpm --filter @apps/web-next test` → 전체 PASS
- [ ] `pnpm -r typecheck` → PASS
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-08-04): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-08-04-sdk-swap-validation`
- [ ] **PR 생성** (base: `phase-08-provider-adapters`)
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 3 |
| **예상 commit 수** | 3 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-22 |
