# Task List: spec-11-02

> One Task = One Commit.

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-11.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + 패키지 scaffold + resolveTracingConfig (TDD)

### 1-1. 브랜치 생성
- [ ] `git checkout -b spec-11-02-otel-tracing` (from `phase-11-observability`)

### 1-2. 패키지 scaffold + config 테스트 (Red)
- [x] `pnpm new package observability backend` (**생성기 dogfooding**) — `@repo/backend-observability`
- [x] OTEL 의존 6종 catalog + package 추가
- [x] `src/config.test.ts` — resolveTracingConfig 분기 + **throwing 스텁**(typecheck 게이트 하 Red 패턴)
- [x] 실행 → Fail (throw)
- [x] Commit: `test(spec-11-02): scaffold backend-observability + failing config tests`

### 1-3. resolveTracingConfig 구현 (Green)
- [x] `src/config.ts`
- [x] Pass (5/5) → Commit: `feat(spec-11-02): implement resolveTracingConfig`

---

## Task 2: createTracingSdk + index

### 2-1. SDK 구성
- [x] `src/tracing.ts` — NodeSDK + OTLPTraceExporter(proto) + auto-instrumentations + resource + `startTracing` opt-in
- [x] `src/index.ts` export
- [x] typecheck 통과 + tracing.test.ts (7/7)
- [x] Commit: `feat(spec-11-02): add createTracingSdk (OTLP + auto-instrumentation)`

---

## Task 3: apps/api init + compose OTLP 포트

### 3-1. apps/api tracing init + tempo 포트
- [ ] `apps/api/src/tracing.ts` (env-gated init) + `main.ts` 최상단 import
- [ ] `tooling/docker/compose.yaml` tempo 4317/4318 노출
- [ ] apps/api typecheck + endpoint 미설정 부트 불변 확인
- [ ] Commit: `feat(spec-11-02): wire apps/api otel init and expose tempo otlp ports`

---

## Task 4: 통합 스모크 (span → tempo)

### 4-1. trace 스모크
- [x] `smoke-trace.sh` + `emit-span.ts` — tempo 기동 → 패키지로 span 방출 → tempo query 재조회 → 확인 → 정리
- [x] `bash ...smoke-trace.sh` → PASS (export 경로 end-to-end)
- [x] Commit: `feat(spec-11-02): add trace export smoke test against tempo`

---

## Task 5: Ship
- [x] 단위 PASS (7)
- [x] 통합 smoke PASS
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-11-02): ship walkthrough and pr description`
- [x] Push + PR (PR #69, base `phase-11-observability`)
- [x] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 5 (작업 4 + Ship) |
| 예상 commit | test 1 + feat 4 + ship 1 |
| 현재 단계 | Planning |
