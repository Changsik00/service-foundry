# Task List: spec-01-01

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`specs/spec-01-01-root-files-and-lefthook-acceptance/`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] phase-01.md SPEC 표 자동 갱신 (sdd spec new 시점)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 작업 브랜치 생성
- [x] `git checkout -b spec-01-01-root-files-and-lefthook-acceptance`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: LICENSE (MIT) 추가

- [x] `LICENSE` 파일 작성 — 표준 SPDX MIT 본문 (`Copyright (c) 2026 dennis`).
- [x] `package.json`의 `"license": "MIT"`와 일치 확인.
- [x] Commit: `chore(spec-01-01): add MIT LICENSE file`

---

## Task 3: 루트 파일 ADR 정합성 점검 + Acceptance 1/2/3/5 실측

- [x] **점검**: 9개 루트 파일 ADR 1:1 대조 → **변경 없음** (walkthrough.md §발견 사항 표).
- [x] 불일치 발견 없음 — sub-commit skip.
- [x] **Acceptance 1** — `pnpm install` → `engines warning` 1건 외 0 warning, exit 0. 해석 walkthrough에 명시.
- [x] **Acceptance 2** — `pnpm lint` → 1 task PASS, FULL TURBO.
- [x] **Acceptance 3** — `pnpm typecheck` → 1 task PASS, FULL TURBO.
- [x] **Acceptance 5** — `--force` 후 일반 lint → 2회째 `>>> FULL TURBO` + `1 cached, 1 total` (303ms → 16ms).
- [x] walkthrough.md `🧪 검증 결과`에 acceptance 1/2/3/5 로그 누적.
- [x] Commit: `docs(spec-01-01): record acceptance 1/2/3/5 evidence`

---

## Task 4: Acceptance 6 (lefthook pre-commit) 실측

- [x] `pnpm exec lefthook run pre-commit` 실행 → 출력 캡처 (staged 없음, biome/typecheck 모두 skip, exit 0).
- [x] 실 commit 흐름에서 hook 동작 검증 — 본 spec 11 commit + spec-x 12 commit 전체에서 biome + typecheck 통과.
- [x] walkthrough.md `🧪 검증 결과`에 acceptance 6 로그 추가 (직접 실행 + 실 commit 케이스 둘 다).
- [x] Commit: `docs(spec-01-01): record acceptance 6 (lefthook) evidence`

---

## Task 5: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [x] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린 재확인 (FULL TURBO cache hit).
- [x] `bash .harness-kit/bin/sdd test passed` — lastTestPass=2026-05-17T13:12:28Z.
- [x] **walkthrough.md 최종 정리** (acceptance 1/2/3/5/6 로그 + 정합성 점검 표 + 결정 기록).
- [x] **pr_description.md 작성**.
- [x] `bash .harness-kit/bin/sdd ship --check` 통과.
- [x] **Ship Commit**: `docs(spec-01-01): ship walkthrough and pr description` (sdd ship 자동).
- [x] **Push**: `git push -u origin spec-01-01-root-files-and-lefthook-acceptance`.
- [x] **PR 생성**: `gh pr create`.
- [x] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (T1 브랜치 + T2 LICENSE + T3 점검+검증1235 + T4 검증6 + T5 ship) |
| **예상 commit 수** | 4 (T1은 brach 생성만) |
| **현재 단계** | Ship (push + PR 직전) |
| **마지막 업데이트** | 2026-05-17 |
