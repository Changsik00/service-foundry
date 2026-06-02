# Task List: spec-04-04 web-vite-scaffold

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new web-vite-scaffold`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (sdd 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout -b spec-04-04-web-vite-scaffold` (시작: `phase-04-frontend-foundation`)
- [ ] Commit 없음

---

## Task 2: catalog 갱신 + apps/web-vite scaffold

### 2-1
- [ ] catalog 추가: `vite ^7`, `@tanstack/react-router ^1`, `@tanstack/router-plugin ^1`, `@tanstack/react-query ^5`
- [ ] `apps/web-vite/` 박음 (package.json/vite.config.ts/tsconfig/vitest/.gitignore/env.example/index.html/src/styles.css/src/main.tsx stub/src/lib/http-client.ts stub/README.md)
- [ ] `pnpm install` → 27 → 28 workspace projects
- [ ] Commit: `feat(spec-04-04): apps/web-vite 패키지 scaffold (Vite 7 + tanstack-router + tanstack-query)`

본 commit 에 spec-04-04 문서 (spec/plan/task) + backlog auto-update 포함.

---

## Task 3: router (file-based) + Query provider

### 3-1
- [ ] `src/routes/{__root.tsx, index.tsx}` (stub)
- [ ] `src/main.tsx` 본체 (createRoot + QueryClientProvider + RouterProvider + import styles)
- [ ] `pnpm --filter @apps/web-vite dev` 한 번 실행해 `routeTree.gen.ts` 자동 생성 확인 (gitignore)
- [ ] Commit: `feat(spec-04-04): tanstack-router file-based + QueryClient provider`

---

## Task 4: useHealthQuery + HealthCard (TDD)

### 4-1. test 작성 (Red)
- [ ] `src/lib/queries.ts` stub (useHealthQuery throw)
- [ ] `src/lib/queries.test.tsx` — renderHook + QueryClient wrapper + fetch mock (3 시나리오: loading→success / error / loading 상태)
- [ ] `src/components/health-card.tsx` stub (loading 분기 추가 — props)
- [ ] `src/components/health-card.test.tsx` — 3 test (loading / data / error)
- [ ] typecheck PASS + test 6 Red
- [ ] Commit: `test(spec-04-04): useHealthQuery + HealthCard test (Red)`

### 4-2. 구현 (Green)
- [ ] `queries.ts` 구현 — useHealthQuery 본체 (useQuery + queryFn → httpClient.get + HealthSchema)
- [ ] `health-card.tsx` 본체 (loading / data / error 3 분기)
- [ ] `routes/index.tsx` 본체 — useHealthQuery 호출 + HealthCard 분기 전달
- [ ] 테스트 PASS
- [ ] Commit: `feat(spec-04-04): useHealthQuery hook + HealthCard (loading/data/error) + index route`

---

## Task 5: 통합 검증

### 5-1
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체)
- [ ] `pnpm --filter @apps/web-vite build` → 성공 (dist/)
- [ ] `pnpm exec depcruise` → 0 violations
- [ ] 수동 검증: api + web-vite 부트 → `http://localhost:3002` 브라우저 또는 curl → Card 표시
- [ ] `sdd test passed`
- [ ] Commit: 없음 (검증만, 필요시 정정 1)

---

## Task 6: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push + PR 생성
- [ ] 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 6 |
| **예상 commit 수** | 5 (T2 scaffold + T3 router/Query + T4 Red/Green + T6 ship; T1/T5 commit 없음) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-20 |
