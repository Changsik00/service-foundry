# Task List: spec-03-08 apps-api-scaffold

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`sdd spec new apps-api-scaffold`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (`sdd spec new` 가 phase-03.md spec 표 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-03-08-apps-api-scaffold` (시작: `phase-03-backend-foundation`)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: catalog 갱신 (@nestjs/platform-express + supertest)

### 2-1. catalog 추가
- [x] `pnpm-workspace.yaml` catalog 에 `@nestjs/platform-express`, `supertest`, `@types/supertest` 추가
- [x] `pnpm install` 실행 (어느 패키지도 의존 안 함 — lockfile 변경 없음)
- [x] Commit: `chore(spec-03-08): catalog 에 @nestjs/platform-express + supertest 추가` (`3ea5ef8`)

---

## Task 3: `apps/api` 패키지 scaffold

### 3-1. 패키지 메타 + 디렉토리
- [x] `apps/api/package.json` (`@apps/api`, 5 어댑터 deps + supertest devDep)
- [x] `apps/api/tsconfig.json` (decorator 옵션 ON)
- [x] `apps/api/vitest.config.ts` (node preset)
- [x] `apps/api/env.example` (점 없는 파일명 — Claude Code 가 `.env*` Write 차단. README rename 가이드)
- [x] `apps/api/src/settings.ts` (defineSettings + BaseBackendSchema.extend)
- [x] `pnpm install` → 22 workspace projects 인식
- [x] Commit: `feat(spec-03-08): apps/api 패키지 scaffold (settings + 5 어댑터 deps)` (`544b9ec` amend env.example)

---

## Task 4: HealthController + AppModule (TDD)

### 4-1. test 작성 (Red)
- [x] `apps/api/src/health/health.e2e.test.ts` — supertest `GET /health` 200 + body shape 검증
- [x] stub `AppModule` (`@Module({})` 빈) → typecheck PASS + E2E test 404 Red
- [x] Commit: `test(spec-03-08): health endpoint E2E test (Red)` (`7bd75fa`)

### 4-2. 구현 (Green)
- [x] `apps/api/src/health/health.controller.ts` — `@Controller("health") + @SkipThrottle()` + `GET /` 핸들러
- [x] `apps/api/src/app.module.ts` — 5 어댑터 forRoot + HealthController 등록
- [x] e2e test 안 `process.env stub` (NODE_ENV/DATABASE_URL/HTTP_CLIENT_BASE_URL) + dynamic import
- [x] 테스트 실행 → 1/1 PASS
- [x] Commit: `feat(spec-03-08): HealthController + AppModule (5 어댑터 wire-up)` (`01349d1`)

---

## Task 5: `main.ts` + README

### 5-1. main.ts 박기
- [x] `apps/api/src/main.ts` — `reflect-metadata` import + loadSettings + NestFactory.create + useLogger + applySecurity + listen
- [x] `apps/api/README.md` — 부트 가이드 + env 변수 표 + 어댑터 wire-up + Repository 패턴 예고
- [x] Commit: `feat(spec-03-08): main.ts bootstrap + README 가이드` (`56d8aba`)

---

## Task 6: 통합 검증

### 6-1. 전체 품질 점검
- [x] `pnpm lint` → 15 tasks PASS
- [x] `pnpm typecheck` → 15 tasks FULL TURBO
- [x] `pnpm test` → 154 test PASS (apps/api E2E 1 신규 + 기존 153)
- [x] `pnpm exec depcruise` → 0 violations (76 modules / 126 deps)
- [x] 수동 검증: `tsx src/main.ts` 부트 + `curl http://localhost:3007/health` → `{"status":"ok","uptime":6.79,"version":"0.0.0"}` ✓
- [x] `sdd test passed` 호출 — `2026-05-20T01:24:58Z`
- [x] Commit: 없음 (검증만)

---

## Task 7: Ship

- [x] `walkthrough.md` 작성 (결정 12 / 협의 3 / 진행 7 / 검증 / 발견 8 / 이월 5)
- [x] `pr_description.md` 작성 (Summary + Key Review Points 10 + Verification + DoD)
- [x] Ship Commit (`sdd ship` — `38b51fb`)
- [x] Push: `git push -u origin spec-03-08-apps-api-scaffold`
- [x] PR 생성: [PR #22](https://github.com/Changsik00/service-foundry/pull/22) (base = `phase-03-backend-foundation`)
- [x] 사용자 알림 (본 응답)

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 |
| **실 commit 수** | 6 (T2 catalog + T3 scaffold + T4 Red/Green + T5 main + T7 ship) |
| **현재 단계** | Ship (PR 생성 직전) |
| **마지막 업데이트** | 2026-05-20 |
