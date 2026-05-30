# Task List: spec-10-03

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 번들 spec — 작업 그룹 A(manifest) / B(startup-report) / C(config-graph) / D(security 결정).

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 백로그 업데이트 (phase-10.md 번들 재조정 + spec 표)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + manifest validator (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-10-03-tooling-scripts` (from `phase-10-ops-tooling`)

### 1-2. validateManifests 테스트 (Red)
- [x] `tooling/scripts/manifest/lib/validate.test.ts` — 정상 / 포트중복 / depends 미참조 / 스키마 위반 / name 중복
- [x] 실행 → Fail
- [x] Commit: `test(spec-10-03): add failing tests for validateManifests`

### 1-3. validateManifests 구현 (Green)
- [x] `tooling/scripts/manifest/lib/validate.ts` (zod 스키마 + 교차검증) + root `zod` devDep
- [x] 테스트 → Pass (5/5)
- [x] Commit: `feat(spec-10-03): implement service manifest validator`

---

## Task 2: service.yaml + manifest runner + yaml 의존

### 2-1. service.yaml 3종 + runner
- [x] `yaml` devDep + catalog 추가
- [x] `apps/{api,web-next,web-vite}/service.yaml` (앱 간 depends 만; 인프라는 compose)
- [x] `tooling/scripts/manifest/run.ts` (readdir 로드 → validate → exit). console.info (noConsole 컨벤션)
- [x] `pnpm tooling:manifest` 동작 확인 (3건 0 error)
- [x] Commit: `feat(spec-10-03): add app service.yaml and manifest runner`

---

## Task 3: startup-report (마스킹)

### 3-1. maskConfig 테스트 (Red)
- [x] 위치 교정: tooling/scripts → **`@repo/backend-settings`** (apps/api 가 import 하므로 boundary 정합). `packages/backend/settings/src/mask.test.ts`
- [x] Fail → Commit: `test(spec-10-03): add failing tests for maskConfig`

### 3-2. maskConfig 구현 + apps/api wiring (Green)
- [x] `packages/backend/settings/src/mask.ts` + index export
- [x] `apps/api/src/main.ts` 부트 시 masked dump 1회 로그
- [x] 테스트 Pass (11/11) + apps/api·settings typecheck
- [x] Commit: `feat(spec-10-03): add masked startup config report`

---

## Task 4: config-graph (mermaid)

### 4-1. toMermaid 테스트 (Red)
- [x] `tooling/scripts/config-graph/lib/to-mermaid.test.ts`
- [x] Fail → Commit: `test(spec-10-03): add failing tests for config-graph toMermaid`

### 4-2. toMermaid 구현 + runner (Green)
- [x] `tooling/scripts/config-graph/lib/to-mermaid.ts` + `run.ts` (introspectEnvSchema → groups)
- [x] `pnpm tooling:config-graph` mermaid 출력 확인 (BaseBackendSchema)
- [x] Commit: `feat(spec-10-03): add config schema mermaid graph export`

---

## Task 5: security-linter 결정 (Research)

### 5-1. 3안 비교 + Go/No-Go
- [x] semgrep / socket.dev / 없음 비교 (설치비용·CI·노이즈·가치)
- [x] `docs/adr/0019-security-linter.md` — **No-Go** (phase-11 CI 재평가) + queue/phase 결정표 반영
- [x] Commit: `docs(spec-10-03): record security linter go/no-go decision (ADR-0019)`

---

## Task 6: root 스크립트 + 통합 스모크

### 6-1. tooling 스크립트 + smoke
- [x] `package.json` `tooling:manifest` / `tooling:config-graph` (Task 2/4 에서 추가됨)
- [x] `tooling/scripts/smoke-test.sh` — manifest 0 error + config-graph mermaid 출력
- [x] `bash tooling/scripts/smoke-test.sh` → PASS
- [x] Commit: `feat(spec-10-03): add tooling scripts smoke test`

---

## Task 7: Ship

- [x] 코드 품질: lint + typecheck (커밋 훅)
- [x] 단위: `pnpm exec vitest run tooling/scripts` (10) + backend-settings (11) PASS
- [x] 통합: `bash tooling/scripts/smoke-test.sh` PASS
- [x] **walkthrough.md** / **pr_description.md**
- [x] **Ship Commit**: `docs(spec-10-03): ship walkthrough and pr description`
- [x] **Push** + **PR** (PR #65, base = `phase-10-ops-tooling`)
- [x] **사용자 알림**: PR URL

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 7 (작업 6 + Ship) |
| **예상 commit 수** | ~9 (test 3 + feat 5 + docs 1) + ship 1 |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-30 |
