# Task List: spec-04-01 frontend-ui

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new frontend-ui`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 phase-04.md spec 표 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-04-01-frontend-ui` (시작: `phase-04-frontend-foundation`)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: catalog 갱신 (tailwind v4 + shadcn deps + RHF + sonner + jsdom)

### 2-1. catalog 추가
- [ ] `pnpm-workspace.yaml` catalog 에 deps 일괄 추가 (plan §catalog 갱신 참고)
- [ ] `pnpm install`
- [ ] Commit: `chore(spec-04-01): catalog 에 tailwind v4 + shadcn + react-hook-form + sonner 추가`

---

## Task 3: `@repo/tailwind-config` (shared preset) 신설

### 3-1. 패키지 scaffold + globals.css
- [ ] `packages/config/tailwind-config/{package.json, src/globals.css, src/preset.ts}` 박음
- [ ] shadcn 표준 CSS variables (`@theme` directive — light/dark)
- [ ] `pnpm install`
- [ ] Commit: `feat(spec-04-01): @repo/tailwind-config (shared preset, tailwind v4 @theme)`

---

## Task 4: `@repo/vitest-config/react` 확장

### 4-1. React vitest preset 박음
- [ ] `packages/config/vitest-config/react.ts` 박음 (jsdom + react plugin + setup)
- [ ] `packages/config/vitest-config/package.json` exports 갱신
- [ ] Commit: `feat(spec-04-01): @repo/vitest-config 에 react preset 추가 (jsdom)`

---

## Task 5: `@repo/frontend-ui` 패키지 scaffold

### 5-1. 패키지 메타 + 디렉토리
- [ ] `packages/frontend/ui/{package.json, tsconfig.json, vitest.config.ts, vitest.setup.ts, components.json}`
- [ ] `packages/frontend/ui/src/{lib/utils.ts, styles.css, index.ts}` (stub)
- [ ] `pnpm install` → workspace 인식
- [ ] Commit: `feat(spec-04-01): @repo/frontend-ui 패키지 scaffold (cn util + components.json)`

---

## Task 6: Button 컴포넌트 (TDD)

### 6-1. test 작성 (Red)
- [ ] `src/components/button.test.tsx` — render / variant / asChild
- [ ] stub `button.tsx` (throw or empty export) → typecheck 통과 + test Red
- [ ] Commit: `test(spec-04-01): Button component test (Red)`

### 6-2. 구현 (Green)
- [ ] `src/components/button.tsx` — CVA + Slot 박음
- [ ] index barrel export 갱신
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-01): Button component (CVA + variants + asChild)`

---

## Task 7: Input + Label + Card

### 7-1. 3 components 박음
- [ ] `src/components/{input.tsx, label.tsx, card.tsx}`
- [ ] index barrel export 갱신
- [ ] (선택) 간단 render test 1-2 개
- [ ] Commit: `feat(spec-04-01): Input + Label + Card components`

---

## Task 8: Form + react-hook-form 통합 (TDD)

### 8-1. test 작성 (Red)
- [ ] `src/components/form.test.tsx` — useForm + zodResolver + submit valid/invalid
- [ ] stub `form.tsx` (export 빈 객체) → typecheck PASS + test Red
- [ ] Commit: `test(spec-04-01): Form component test (Red)`

### 8-2. 구현 (Green)
- [ ] `src/components/form.tsx` — Form / FormField / FormItem / FormLabel / FormControl / FormDescription / FormMessage
- [ ] index barrel export 갱신
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-01): Form component (react-hook-form + zodResolver 통합)`

---

## Task 9: Toaster (sonner) + cn util test

### 9-1. Toaster 박음
- [ ] `src/components/toaster.tsx` — sonner `Toaster` wrap + `toast` re-export
- [ ] `src/components/toaster.test.tsx` — render smoke + toast 호출 검증
- [ ] `src/lib/utils.test.ts` — `cn` 병합 동작
- [ ] index barrel export 갱신
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-01): Toaster (sonner) + cn util test`

---

## Task 10: 통합 검증 (lint / typecheck / test / depcruise)

### 10-1. 전체 품질 점검
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체)
- [ ] `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .` → 0 violations (frontend-no-react 룰 조정 필요시 별 task commit)
- [ ] `sdd test passed`
- [ ] Commit: 없음 (검증만, depcruise 룰 정정 시 1)

---

## Task 11: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push: `git push -u origin spec-04-01-frontend-ui`
- [ ] PR 생성: `gh pr create --base phase-04-frontend-foundation --head spec-04-01-frontend-ui ...`
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 11 |
| **예상 commit 수** | 10~11 (catalog + tailwind-config + vitest-react + ui-scaffold + Button Red/Green + Input/Label/Card + Form Red/Green + Toaster + ship; depcruise 정정 1 가능) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-20 |
