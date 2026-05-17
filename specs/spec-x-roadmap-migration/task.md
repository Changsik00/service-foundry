# Task List: spec-x-roadmap-migration

> 모든 task는 한 commit에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성 (`specs/spec-x-roadmap-migration/`)
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

### 1-1. 작업 브랜치 생성
- [x] `git checkout -b spec-x-roadmap-migration`
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: backlog/phase-01.md 작성 (모노레포 골격)

- [x] `.harness-kit/agent/templates/phase.md` 읽고 구조 준수.
- [x] ROADMAP §2 Phase 1 본문(Root files / config 6종 / Acceptance 7개 / 스텁 패키지 / Note) → phase-01.md로 1:1 매핑.
- [x] 메타: 상태 = `In Progress`, 시작일 = 2026-05-17, 소유자 = dennis, Base Branch = 없음.
- [x] 성공 기준 = ROADMAP의 Acceptance 7개.
- [x] SPEC 표 마커 (`<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->`)는 빈 상태.
- [x] SPEC 요점 섹션(spec-01-01 ~ spec-01-08) 작성 — plan.md §Proposed Changes 참고.
- [x] 연관 ADR: 0001/0002/0003/0004.
- [x] 현재 진행 메모(d3894b4 / 2e3469c 커밋 일부 반영) 본문 노트로 추가.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-01.md for monorepo skeleton`

---

## Task 3: backlog/phase-02.md 작성 (shared primitives)

- [x] ROADMAP §2 Phase 2 본문 매핑.
- [x] SPEC 요점(spec-02-01 ~ spec-02-05) 작성.
- [x] 성공 기준: FE/BE 양측 import 가능 검증.
- [x] 의존성: phase-01.
- [x] 연관 ADR: 0003 / 0006.
- [x] §3 "lat.md Phase 2 평가" 본문 노트 포함.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-02.md for shared primitives`

---

## Task 4: backlog/phase-03.md 작성 (backend)

- [x] ROADMAP §2 Phase 3 본문 매핑.
- [x] 상태 = `Planning` (블로커 표기).
- [x] 블로커 3건(ADR-0005 spike / ADR-0006 결정 / `docs/conventions/backend-module-layout.md`)을 "선행 결정" 섹션에 명시.
- [x] SPEC 요점(spec-03-01 ~ spec-03-10) 10개 backend 패키지.
- [x] 연관 ADR: 0005 / 0006.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-03.md for backend`

---

## Task 5: backlog/phase-04.md 작성 (apps)

- [x] ROADMAP §2 Phase 4 본문 매핑.
- [x] SPEC 요점(api / worker / frontend/ui / frontend/sdk / frontend/auth / web-next / web-vite / admin / edge-api).
- [x] 성공 기준: vertical-slice acceptance(FE → API → DB → JWT → protected → logout).
- [x] 의존성: phase-02 + phase-03.
- [x] 연관 ADR: 0003 / 0005 / 0006.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-04.md for apps`

---

## Task 6: backlog/phase-05.md 작성 (운영 / 도구)

- [x] ROADMAP §2 Phase 5 + §3 차별화 포인트의 "예정(Phase 5)" 항목(service manifest / startup report / typed config graph) 흡수.
- [x] SPEC 요점(tooling/docker / generators / scripts).
- [x] 의존성: phase-04 일부.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-05.md for ops and tooling`

---

## Task 7: backlog/phase-06.md 작성 (CI / CD)

- [x] ROADMAP §2 Phase 6 본문 매핑.
- [x] SPEC 요점(GitHub Actions / changesets release / docker publish / k8s 예제).
- [x] 의존성: phase-04 + phase-05.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/phase-06.md for ci-cd`

---

## Task 8: backlog/queue.md 작성 + phase-01 활성화

- [x] `.harness-kit/agent/templates/queue.md` 기반 `backlog/queue.md` 작성.
- [x] `active` / `specx` / `done` 마커 영역은 빈 상태 유지 (sdd 관리).
- [x] **Icebox 섹션**: ROADMAP §4.2 항목 9개 한 줄씩.
- [x] **대기 Phase 섹션**: phase-02 ~ phase-06 한 줄씩.
- [x] `bash .harness-kit/bin/sdd phase activate phase-01` 실행 — queue.md의 `active` 마커 채워짐 확인.
- [x] **부작용 발견 및 복원**: `sdd phase activate`가 state.json의 `spec` / `planAccepted`를 리셋함. 진행 중인 spec-x 컨텍스트가 sdd 추적에서 사라짐. 사용자 임시 권한 받아 state.json 수기 복원 (`phase=phase-01`, `spec=spec-x-roadmap-migration`, `planAccepted=true`). specx 마커도 수기 채움. 학습: spec-x 실행 중 phase activate는 *동시 active* 가능 하지만 sdd가 그 의도를 알 수 없어 reset 발생 — Ship 시 sdd가 정상 흐름 회복. 자세한 기록은 walkthrough.md.
- [x] `bash .harness-kit/bin/sdd status` — Active Phase=phase-01, Active Spec=spec-x-roadmap-migration, Plan Accept=yes 확인.
- [x] Commit: `docs(spec-x-roadmap-migration): add backlog/queue.md and activate phase-01`

---

## Task 9: 외부 참조 7개 위치 갱신

- [ ] `README.md` line 13 — ROADMAP.md → backlog/queue.md.
- [ ] `ARCHITECTURE.md` line 14 — ROADMAP.md → backlog/queue.md.
- [ ] `ARCHITECTURE.md` line 174 — "ROADMAP §4.2" → "backlog/queue.md Icebox".
- [ ] `docs/adr/0007-polyglot-strategy.md` line 16 — ROADMAP Phase 1–6 → backlog/phase-01~06.md.
- [ ] `docs/adr/0007-polyglot-strategy.md` line 184 — ROADMAP.md → backlog/queue.md.
- [ ] `docs/adr/0005-backend-framework-and-orm-strategy.md` line 5 — ROADMAP Phase 3 → backlog/phase-03.md.
- [ ] `docs/adr/0005-backend-framework-and-orm-strategy.md` line 43 — ROADMAP Phase 3 → backlog/phase-03.md.
- [ ] 검증: `grep -rn "ROADMAP" --include="*.md" . | grep -v node_modules | grep -v .git | grep -v specs/spec-x-roadmap-migration` 출력 0건 확인.
- [ ] Commit: `docs(spec-x-roadmap-migration): retarget ROADMAP references to backlog/`

---

## Task 10: ROADMAP.md 삭제

- [ ] `git rm ROADMAP.md`.
- [ ] 검증: `ls ROADMAP.md` → `No such file or directory`.
- [ ] 검증: 외부 참조 0건 (Task 9 grep 재실행).
- [ ] Commit: `docs(spec-x-roadmap-migration): remove ROADMAP.md`

---

## Task 11: Ship (필수)

> walkthrough.md / pr_description.md 작성 후 push + PR.

- [ ] `pnpm lint` PASS 확인 (turbo).
- [ ] `pnpm typecheck` PASS 확인.
- [ ] `pnpm test` PASS 확인.
- [ ] `bash .harness-kit/bin/sdd status` 출력 캡처 (walkthrough 증거용).
- [ ] **walkthrough.md 작성**: ROADMAP 의미 단위 1:1 매핑 표 + sdd 출력 + 결정 기록.
- [ ] **pr_description.md 작성** (템플릿 준수).
- [ ] `bash .harness-kit/bin/sdd ship --check` 통과 확인 후 `sdd ship`.
- [ ] **Ship Commit**: `docs(spec-x-roadmap-migration): ship walkthrough and pr description`
- [ ] **Push**: `git push -u origin spec-x-roadmap-migration`
- [ ] **PR 생성**: `/hk-pr-gh` 또는 `gh pr create` (사용자 승인 후, no-confirm flow).
- [ ] **사용자 알림**: push 완료 + PR URL 보고.

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 11 (Task 1 브랜치 생성 포함, Task 11 ship 포함) |
| **예상 commit 수** | 10 (Task 1은 브랜치 생성만 — commit 없음) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-17 |
