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
- [ ] `git checkout -b spec-03-08-apps-api-scaffold` (시작: `phase-03-backend-foundation`)
- [ ] Commit: 없음 (브랜치 생성만)

---

## Task 2: catalog 갱신 (@nestjs/platform-express + supertest)

### 2-1. catalog 추가
- [ ] `pnpm-workspace.yaml` catalog 에 `@nestjs/platform-express`, `supertest`, `@types/supertest` 추가
- [ ] `pnpm install` 실행
- [ ] Commit: `chore(spec-03-08): catalog 에 @nestjs/platform-express + supertest 추가`

---

## Task 3: `apps/api` 패키지 scaffold

### 3-1. 패키지 메타 + 디렉토리
- [ ] `apps/api/package.json` (`@apps/api`, 5 어댑터 deps + supertest devDep)
- [ ] `apps/api/tsconfig.json` (decorator 옵션 ON)
- [ ] `apps/api/vitest.config.ts` (node preset)
- [ ] `apps/api/.env.example` (PORT/NODE_ENV/LOG_LEVEL/DATABASE_URL/HTTP_CLIENT_BASE_URL)
- [ ] `apps/api/src/settings.ts` (defineSettings + BaseBackendSchema.extend)
- [ ] `pnpm install` → workspace 인식
- [ ] Commit: `feat(spec-03-08): apps/api 패키지 scaffold (settings + env.example)`

---

## Task 4: HealthController + AppModule (TDD)

### 4-1. test 작성 (Red)
- [ ] `apps/api/src/health/health.e2e.test.ts` — `Test.createTestingModule({ imports: [AppModule] })` + supertest `GET /health` 200 검증
- [ ] 테스트 실행 → Fail (AppModule 없음)
- [ ] stub 박아 typecheck 통과 + test Red 유지
- [ ] Commit: `test(spec-03-08): health endpoint E2E test (Red)`

### 4-2. 구현 (Green)
- [ ] `apps/api/src/health/health.controller.ts` — `@Controller("health") + @SkipThrottle()` + `GET /` 핸들러
- [ ] `apps/api/src/app.module.ts` — 5 어댑터 forRoot + HealthController 등록
- [ ] 테스트 실행 → Pass
- [ ] Commit: `feat(spec-03-08): HealthController + AppModule (5 어댑터 wire-up)`

---

## Task 5: `main.ts` + README

### 5-1. main.ts 박기
- [ ] `apps/api/src/main.ts` — NestFactory.create + applySecurity + useLogger + listen
- [ ] `apps/api/README.md` — 부트 가이드 + Repository 패턴 예고
- [ ] Commit: `feat(spec-03-08): main.ts bootstrap + README 가이드`

---

## Task 6: 통합 검증

### 6-1. 전체 품질 점검
- [ ] `pnpm lint` → PASS
- [ ] `pnpm typecheck` → PASS
- [ ] `pnpm test` → PASS (전체 153 + 1 E2E)
- [ ] `pnpm exec depcruise` → 0 violations
- [ ] 수동 검증: `pnpm --filter @apps/api start` 부트 + `curl /health` 200
- [ ] Commit: 없음 (검증만, 필요시 미세 정정 1)

---

## Task 7: Ship

- [ ] `walkthrough.md` 작성
- [ ] `pr_description.md` 작성
- [ ] Ship Commit (`sdd ship`)
- [ ] Push: `git push -u origin spec-03-08-apps-api-scaffold`
- [ ] PR 생성: `gh pr create --base phase-03-backend-foundation --head spec-03-08-apps-api-scaffold ...`
- [ ] 사용자 알림: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 |
| **예상 commit 수** | 6 (T2 catalog + T3 scaffold + T4 Red/Green + T5 main + T7 ship) |
| **현재 단계** | Planning (Plan Accept 대기) |
| **마지막 업데이트** | 2026-05-19 |
