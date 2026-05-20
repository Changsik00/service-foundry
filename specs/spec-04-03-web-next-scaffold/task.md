# Task List: spec-04-03 web-next-scaffold

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new web-next-scaffold`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (sdd 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-04-03-web-next-scaffold` (시작: `phase-04-frontend-foundation`)
- [ ] Commit 없음

---

## Task 2: catalog next + apps/web-next scaffold

### 2-1
- [ ] `pnpm-workspace.yaml` catalog 에 `next: ^16.2.6` 추가
- [ ] `apps/web-next/{package.json, tsconfig.json, next.config.ts, postcss.config.mjs, vitest.config.ts, vitest.setup.ts, .gitignore, env.example, README.md}` 박음
- [ ] `apps/web-next/src/env.ts` (zod 검증)
- [ ] `apps/web-next/src/app/{layout.tsx, page.tsx, globals.css}` stub
- [ ] `apps/web-next/src/components/health-card.tsx` stub
- [ ] `pnpm install` → 26 → 27 workspace projects
- [ ] Commit: `feat(spec-04-03): apps/web-next 패키지 scaffold (Next.js 16 App Router + tailwind v4)`

본 commit 에 spec-04-03 문서 (spec/plan/task) + backlog auto-update 포함.

---

## Task 3: HealthCard component (TDD)

### 3-1. test 작성 (Red)
- [ ] `health-card.test.tsx` 2 test:
  - 200 응답 데이터 → status/uptime/version 표시
  - error prop → error message 표시
- [ ] stub `<HealthCard>` (throw "not implemented") → typecheck PASS + test Red
- [ ] Commit: `test(spec-04-03): HealthCard component test (Red)`

### 3-2. 구현 (Green)
- [ ] `health-card.tsx` 본체 (presentation only — `@repo/frontend-ui` Card 사용)
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-03): HealthCard component (presentation)`

---

## Task 4: layout + page (RSC `/health` fetch 시연)

### 4-1
- [ ] `layout.tsx` 본체 (root layout + html/body + metadata + globals.css import)
- [ ] `page.tsx` 본체 (async server component — createHttpClient + .get + try/catch → HealthCard)
- [ ] `globals.css` (`@import "@repo/frontend-ui/styles.css"`)
- [ ] Commit: `feat(spec-04-03): layout + page (RSC /health 호출 + HealthCard 표시)`

---

## Task 5: 통합 검증

### 5-1
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체)
- [ ] `pnpm --filter @apps/web-next build` → 성공 (Next build)
- [ ] `pnpm exec depcruise` → 0 violations
- [ ] 수동 검증: api + web-next 부트 → `http://localhost:3001` 페이지 Card 표시 + curl
- [ ] `sdd test passed`
- [ ] Commit: 없음 (검증만, build 실패 시 정정 1)

---

## Task 6: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push: `git push -u origin spec-04-03-web-next-scaffold`
- [ ] PR 생성: `gh pr create --base phase-04-frontend-foundation --head spec-04-03-web-next-scaffold ...`
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 |
| **예상 commit 수** | 5 (T2 scaffold + T3 Red/Green + T4 layout/page + T6 ship; T1/T5 commit 없음) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-20 |
