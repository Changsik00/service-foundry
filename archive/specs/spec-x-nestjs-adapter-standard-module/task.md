# Task List: spec-x-nestjs-adapter-standard-module

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> **spec-x — phase-bound 아님**: PR base = `main`.
> 본 spec 은 *문서/룰만* — 코드 변경 0.

## Pre-flight

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [ ] `git checkout main && git pull --ff-only`
- [ ] `git checkout -b spec-x-nestjs-adapter-standard-module`
- [ ] Commit: 없음

---

## Task 2: ADR-0016 신규 작성

- [ ] `docs/adr/0016-nestjs-adapter-standard-module-pattern.md` 작성:
  - frontmatter (id / type: convention / status: accepted / date: 2026-05-19)
  - Context (ADR-0015 5회 반복 후 reviewer 의견 + NestJS-locked monorepo 인 점)
  - Decision (표준 `@Module` class + ultra-thin 예외 + symbol token 유지 + lifecycle 자연)
  - 검토한 대안 4 (객체 리터럴 강제 / @Module 강제 / 둘 다 허용 / 절충안 채택)
  - Consequences (장점: onboarding / lifecycle / ecosystem 친화 / 단점: decorator 의존 / framework dep 명시)
  - Revisit Triggers (NestJS major upgrade / 다른 framework adapter / decorator spec 변화)
  - 관련 문서 (ADR-0015 / memory)
- [ ] Commit: `docs(spec-x): add ADR-0016 NestJS adapter standard module pattern`

---

## Task 3: ADR-0015 갱신 + cross-link

- [ ] `docs/adr/0015-framework-adapter-naming-and-layout.md` 수정:
  - 상단 IMPORTANT note 추가 — 2026-05-19 갱신 / 모듈 패턴 ADR-0016 분리
  - §4-bis 끝에 *"모듈 구현 패턴은 [ADR-0016] 참조"* 박음
  - 관련 문서에 ADR-0016 cross-link
- [ ] Commit: `docs(spec-x): cross-link ADR-0015 ↔ ADR-0016 module pattern`

---

## Task 4: memory + ARCHITECTURE 갱신

- [ ] `/Users/dennis/.claude/projects/.../memory/feedback_platform_agnostic_packages.md`:
  - "core 패키지 framework-agnostic — 그대로 강조" 보강
  - "어댑터 패키지 *내부 구현* 은 framework 친화 OK (ADR-0016)" 신규 절
  - ADR-0016 cross-link 추가
- [ ] `MEMORY.md` index 갱신 (필요 시)
- [ ] `ARCHITECTURE.md §3.2` 한 줄 추가 — *"adapter 내부 module 패턴은 ADR-0016 답습"*
- [ ] Commit: `docs(spec-x): update memory + ARCHITECTURE for adapter module pattern` (memory 는 git 외부 — ARCHITECTURE.md 만 commit)

---

## Task 5: Ship (필수)

- [ ] **walkthrough.md 작성** (결정 + reviewer 의견 + 5 어댑터 임시 위반 인정 + 후속 spec 가이드)
- [ ] **pr_description.md 작성** (10 Key Review Points + 후속 재구성 spec 진입 안내)
- [ ] `bash .harness-kit/bin/sdd test passed` (테스트 없음 — manual)
- [ ] `sdd ship --check` 통과
- [ ] **Ship Commit**: sdd ship 자동
- [ ] **Push**: `git push -u origin spec-x-nestjs-adapter-standard-module`
- [ ] **PR 생성**: `gh pr create --base main`
- [ ] **사용자 알림**

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 5 (T1 브랜치 / T2 ADR-0016 / T3 ADR-0015 갱신 / T4 memory + ARCHITECTURE / T5 ship) |
| **예상 commit 수** | 4 (T1 commit 없음 — memory 는 git 외부) |
| **예상 test 수** | 0 (문서/룰만) |
| **현재 단계** | Planning |
| **마지막 업데이트** | 2026-05-19 |
