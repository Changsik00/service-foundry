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

- [ ] `LICENSE` 파일 작성 — 표준 SPDX MIT 본문 (`Copyright (c) 2026 dennis`).
- [ ] `package.json`의 `"license": "MIT"`와 일치 확인.
- [ ] Commit: `chore(spec-01-01): add MIT LICENSE file`

---

## Task 3: 루트 파일 ADR 정합성 점검 + Acceptance 1/2/3/5 실측

- [ ] **점검**: `package.json` / `pnpm-workspace.yaml` / `turbo.json` / `lefthook.yml` / `.editorconfig` / `.nvmrc` / `.changeset/config.json` / `biome.json` / `README.md`를 ADR-0001/0002/0003/0004와 1:1 대조. 결과 표를 walkthrough.md `🔍 발견 사항`에 기록.
- [ ] 불일치 발견 시 *최소 변경*. 본 task 안에서 별도 sub-commit으로 분리 (예: `fix(spec-01-01): align <file> with ADR-XXXX`). 변경 없으면 skip.
- [ ] **Acceptance 1** — `pnpm install` 실행 → 출력 캡처 → `engines warning` 외 0 warning 확인. 해석을 walkthrough에 명시.
- [ ] **Acceptance 2** — `pnpm lint` → 그린 + 출력 캡처.
- [ ] **Acceptance 3** — `pnpm typecheck` → 그린 + 출력 캡처.
- [ ] **Acceptance 5** — `pnpm exec turbo run lint --force` 후 `pnpm lint` → 두 번째 출력에 `>>> FULL TURBO` + `cache hit, replaying logs` 확인.
- [ ] walkthrough.md `🧪 검증 결과`에 acceptance 1/2/3/5 로그 누적.
- [ ] Commit: `docs(spec-01-01): record acceptance 1/2/3/5 evidence`

---

## Task 4: Acceptance 6 (lefthook pre-commit) 실측

- [ ] `lefthook run pre-commit` 실행 → 출력 캡처.
- [ ] biome (no files for inspection 또는 PASS) + typecheck (PASS) 확인.
- [ ] walkthrough.md `🧪 검증 결과`에 acceptance 6 로그 추가.
- [ ] Commit: `docs(spec-01-01): record acceptance 6 (lefthook) evidence`

---

## Task 5: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [ ] `pnpm lint` + `pnpm typecheck` + `pnpm test` 최종 그린 재확인.
- [ ] `bash .harness-kit/bin/sdd test passed` — lastTestPass 갱신.
- [ ] **walkthrough.md 최종 정리**: 결정 기록 + 사용자 협의 + 5개 acceptance 로그 + 발견 사항 + 메타.
- [ ] **pr_description.md 작성** (템플릿 준수).
- [ ] `bash .harness-kit/bin/sdd ship --check` 통과.
- [ ] `bash .harness-kit/bin/sdd ship` — Ship commit 자동 생성: `docs(spec-01-01): ship walkthrough and pr description`.
- [ ] **Push**: `git push -u origin spec-01-01-root-files-and-lefthook-acceptance`.
- [ ] **PR 생성**: `gh pr create --base main --head <branch> --title ... --body-file pr_description.md`.
- [ ] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (T1 브랜치 + T2 LICENSE + T3 점검+검증1235 + T4 검증6 + T5 ship) |
| **예상 commit 수** | 4 (T1은 brach 생성만) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-17 |
