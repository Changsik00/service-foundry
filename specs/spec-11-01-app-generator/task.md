# Task List: spec-11-01

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-11.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + resolveAppTarget (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-11-01-app-generator` (from main — 첫 spec, ship 시 base JIT)

### 1-2. resolveAppTarget 테스트 (Red)
- [x] `turbo/generators/lib/resolve-app-target.test.ts` — api/next/vite 매핑 + 타입/이름/포트 throw
- [x] Fail → Commit: `test(spec-11-01): add failing tests for resolveAppTarget`

### 1-3. resolveAppTarget 구현 (Green)
- [x] `turbo/generators/lib/resolve-app-target.ts`
- [x] Pass (7/7) → Commit: `feat(spec-11-01): implement resolveAppTarget mapping`

---

## Task 2: app 템플릿 + 생성기

### 2-1. 템플릿 빌더 + config 확장
- [x] `turbo/generators/lib/app-templates.ts` (api/next/vite 파일 빌더)
- [x] `turbo/generators/config.ts` 에 `app` 생성기 추가 (+ 공통 writeAndFormat 헬퍼 + biome 포맷)
- [x] api/next/vite 3종 수동 생성 → **lint/typecheck/test 전부 0 error** 확인 → 정리
- [x] Commit: `feat(spec-11-01): add turbo gen app generator and templates`

---

## Task 3: 통합 스모크 테스트

### 3-1. app 스모크
- [x] `turbo/generators/app-smoke-test.sh` — api 생성→install→typecheck/lint/test→정리
- [x] `bash turbo/generators/app-smoke-test.sh` → PASS
- [x] Commit: `feat(spec-11-01): add app generator smoke test`

---

## Task 4: Ship
- [x] 단위 PASS (7)
- [x] 통합 `app-smoke-test.sh` PASS (api 0 error)
- [x] walkthrough.md / pr_description.md
- [x] Ship Commit: `docs(spec-11-01): ship walkthrough and pr description`
- [ ] Push + PR (base `phase-11-observability` — JIT 생성)
- [ ] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (작업 3 + Ship) |
| 예상 commit | test 1 + feat 3 + ship 1 |
| 현재 단계 | Planning |
