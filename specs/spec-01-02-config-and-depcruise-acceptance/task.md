# Task List: spec-01-02

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`specs/spec-01-02-config-and-depcruise-acceptance/`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] phase-01.md SPEC 표 자동 갱신 (sdd spec new 시점)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 작업 브랜치 생성
- [x] `git checkout -b spec-01-02-config-and-depcruise-acceptance`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: 6 config 패키지 전수 점검 + Acceptance 4 실측

- [x] **점검**: 6 config 패키지 본문 + `package.json` 전수 ADR 1:1 대조 → **변경 없음**. 결과 표 walkthrough.md에 기록.
- [x] 명백 불일치 없음 — sub-commit skip.
- [x] **Acceptance 4** — `pnpm test` → 1 task PASS, FULL TURBO cache hit (29ms).
- [x] preset round-trip 확인: `@repo/utils/vitest.config.ts` → `@repo/vitest-config/node` import → 실제 동작.
- [x] walkthrough.md `🧪 검증 결과`에 acceptance 4 로그 + 점검 표 누적.
- [x] Commit: `docs(spec-01-02): record config inspection + acceptance 4 evidence`

---

## Task 3: Acceptance 7 (depcruise violation 0건) 실측

- [ ] **호출 방식 결정**: 시도 순서 — (a) `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → (b) 실패 시 `--ts-config <path>` 추가 → (c) 실패 시 `--include-only` 등 escalate.
- [ ] **시범 실행**: 결정된 명령으로 실행 → 출력 캡처.
- [ ] **violation 판정**: error severity 0건 = 통과. warn (예: no-orphans)은 *해석* 명시 후 통과 판정.
- [ ] walkthrough.md `🧪 검증 결과`에 acceptance 7 로그 + 호출 방식 결정 이유 누적.
- [ ] Commit: `docs(spec-01-02): record acceptance 7 (depcruise) evidence`

---

## Task 4: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린 재확인.
- [ ] `bash .harness-kit/bin/sdd test passed` — lastTestPass 갱신.
- [ ] **walkthrough.md 최종 정리**: 결정 기록 + 사용자 협의 + acceptance 4/7 로그 + 발견 사항 + **phase-01 acceptance 7건 전수 통과 선언**.
- [ ] **pr_description.md 작성** (템플릿 준수).
- [ ] `bash .harness-kit/bin/sdd ship --check` 통과.
- [ ] `bash .harness-kit/bin/sdd ship` — Ship commit 자동 생성: `docs(spec-01-02): ship walkthrough and pr description`.
- [ ] **Push**: `git push -u origin spec-01-02-config-and-depcruise-acceptance`.
- [ ] **PR 생성**: `gh pr create`.
- [ ] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 (T1 브랜치 + T2 점검+A4 + T3 A7 + T4 ship) |
| **예상 commit 수** | 3 (T1은 brach 생성만) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-17 |
