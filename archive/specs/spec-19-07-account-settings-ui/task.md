# Task List: spec-19-07 계정 설정 UI

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [ ] 사용자 Plan Accept

---

## Task 1: mutations.ts + queries.ts 확장 (TDD)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-19-07-account-settings-ui`

### 1-2. 테스트 작성 (Red)
- [ ] `apps/web/src/features/account/mutations.test.ts` 작성
  - `useUpdateProfile` — mutationFn 에서 PATCH 호출 확인
  - `useChangePassword` — mutationFn 에서 PATCH 호출 확인
  - `useDeleteAccount` — CSRF 취득 후 DELETE 호출 확인 (mock 2회 호출)
- [ ] throwing stub: `mutations.ts`
- [ ] Commit: `test(spec-19-07): account mutations 단위 테스트 (Red)`

### 1-3. 구현 (Green)
- [ ] `apps/web/src/features/account/mutations.ts` 완성
- [ ] `apps/web/src/features/account/queries.ts` — `MeSchema`에 `displayName` 추가
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-07): account mutations + queries displayName`

---

## Task 2: ProfileForm (TDD)

### 2-1. 테스트 작성 (Red)
- [ ] `apps/web/src/features/account/ProfileForm.test.tsx` 작성
  - displayName prefill 렌더링
  - submit 시 `useUpdateProfile` mutate 호출
  - 에러 시 인라인 메시지 표시
- [ ] throwing stub: `ProfileForm.tsx`
- [ ] Commit: `test(spec-19-07): ProfileForm 단위 테스트 (Red)`

### 2-2. 구현 (Green)
- [ ] `apps/web/src/features/account/ProfileForm.tsx` 완성
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-07): ProfileForm — 이름 변경`

---

## Task 3: PasswordForm (TDD)

### 3-1. 테스트 작성 (Red)
- [ ] `apps/web/src/features/account/PasswordForm.test.tsx` 작성
  - confirm 불일치 → 클라이언트 에러 표시
  - submit 시 `useChangePassword` mutate 호출
  - API 에러(401) → "현재 비밀번호가 틀렸습니다" 표시
- [ ] throwing stub: `PasswordForm.tsx`
- [ ] Commit: `test(spec-19-07): PasswordForm 단위 테스트 (Red)`

### 3-2. 구현 (Green)
- [ ] `apps/web/src/features/account/PasswordForm.tsx` 완성
- [ ] 테스트 → Pass
- [ ] Commit: `feat(spec-19-07): PasswordForm — 비밀번호 변경`

---

## Task 4: DeleteSection + account/page + sidebar

### 4-1. 구현
- [ ] `apps/web/src/features/account/DeleteSection.tsx`
  - "계정 삭제" 버튼 → 인라인 확인(두 번 클릭 패턴 또는 텍스트 입력)
  - 확인 후 `useDeleteAccount` → 성공 시 `auth.signOut()`
- [ ] `apps/web/src/app/(console)/account/page.tsx`
  - `"use client"` 탭 구조 (프로필 / 보안)
  - 프로필 탭: `ProfileForm`
  - 보안 탭: `PasswordForm` + `SessionsCard` + `DeleteSection`
- [ ] `apps/web/src/features/account/index.ts` — 신규 컴포넌트 export
- [ ] `apps/web/src/components/sidebar.tsx` — "계정 설정" 링크 추가
- [ ] Commit: `feat(spec-19-07): account/page + sidebar + DeleteSection`

---

## Task 5: Ship

### 🚦 Pre-Push Quality Gate
- [ ] `pnpm turbo typecheck --filter=@apps/web` → PASS
- [ ] `pnpm --filter @apps/web exec vitest run` → PASS (전체)
- [ ] 브라우저 수동 검증 — 이름 변경·비밀번호 변경·탈퇴 흐름

### 📝 산출물
- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Commit: `docs(spec-19-07): walkthrough·pr_description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-19-07-account-settings-ui`
- [ ] PR 생성 (base: `phase-19-account-authz`)

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 |
| **예상 commit 수** | 8 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-06-13 |
