# Task List: spec-10-02

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-10.md SPEC 표 — `sdd spec new` 자동 갱신)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + 매핑 헬퍼 테스트 (TDD Red)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-10-02-tooling-generators` (from `phase-10-ops-tooling`)
- [x] Commit: 없음

### 1-2. resolvePackageTarget 테스트 작성 (Red)
- [x] `turbo/generators/lib/resolve-target.test.ts` — 5 카테고리 매핑 + 오류 입력
- [x] 실행 → Fail 확인 (모듈 없음)
- [x] Commit: `test(spec-10-02): add failing tests for resolvePackageTarget`

---

## Task 2: resolvePackageTarget 구현 (TDD Green)

### 2-1. 순수 매핑 함수
- [x] `turbo/generators/lib/resolve-target.ts` — category→{dir,pkgName,tsconfigExtends,vitestPreset,isConfig}
- [x] 테스트 → Pass (8/8)
- [x] Commit: `feat(spec-10-02): implement resolvePackageTarget mapping`

---

## Task 3: turbo gen config + handlebars 템플릿

### 3-1. 생성기 정의 + 템플릿
- [x] `@turbo/gen` devDependency 추가 (+ workspace catalog)
- [x] `turbo/generators/config.ts` — package 생성기 (prompt + resolveTarget + fs write + biome 포맷)
- [x] 템플릿: handlebars *.hbs 대신 `lib/templates.ts` 순수 빌더 + config inline write (구현 선택 — walkthrough 기록). 생성 직후 `biome check --write` 로 lint-clean 보장
- [x] `turbo gen package --args shared gendemo` 동작 확인 → lint/typecheck/test 0 error → 정리
- [x] Commit: `feat(spec-10-02): add turbo gen package generator and templates`

---

## Task 4: root 스크립트 + 통합 스모크 테스트

### 4-1. new 스크립트 + smoke
- [x] `package.json` 에 `"new": "turbo gen"` 추가
- [x] `turbo/generators/smoke-test.sh` — 생성→install→lint/typecheck/test→정리(생성물 삭제 + install 복구)
- [x] `bash turbo/generators/smoke-test.sh` → PASS (생성 패키지 0 error)
- [x] Commit: `feat(spec-10-02): add pnpm new script and generator smoke test`

---

## Task 5: Ship (필수)

- [x] 코드 품질 점검: biome(커밋 훅) + typecheck 통과
- [x] 단위 테스트: `resolvePackageTarget` PASS (8)
- [x] 통합 테스트: `bash turbo/generators/smoke-test.sh` → PASS
- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] **Ship Commit**: `docs(spec-10-02): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-10-02-tooling-generators`
- [ ] **PR 생성**: base = `phase-10-ops-tooling`
- [ ] **사용자 알림**: PR URL 보고

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (작업 4 + Ship) |
| **예상 commit 수** | 4 (test 1 + feat 3) + ship 1 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-30 |
