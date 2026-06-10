# Task List: spec-x-web-consolidation

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] plan.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept (2026-06-10 대화 — "진행하자")

---

## Task 1: ADR-0025 frontend 앱 단일화

### 1-1. ADR 작성
- [x] `docs/adr/0025-frontend-app-consolidation.md` 작성
- [x] ADR-0004/0006/0021 상단에 ADR-0025 참조 노트 1줄
- [x] Commit: `docs(spec-x-web-consolidation): adr-0025 frontend 앱 단일화`

---

## Task 2: depcruise next-금지 가드 (Red→Green)

### 2-1. 룰 추가 + 발화 검증
- [x] `packages/config/depcruise-config/base.cjs` 에 `frontend-no-next-imports` 룰 추가
- [x] 임시 위반 import 로 `pnpm depcruise` **실패** 확인 (Red) → 위반 제거 → 그린 (Green)
- [x] Commit: `feat(spec-x-web-consolidation): depcruise next-금지 가드 추가`

---

## Task 3: web-vite 삭제 + 참조 정리

### 3-1. 삭제 및 정리 (단일 commit — revert 응집성)
- [x] `apps/web-vite/`, `docs/reference/apps/web-vite.md` 삭제
- [x] 현행 참조 정리: README / docs/index / docs/reference/{stack,architecture} / env.sample / package.json / knip-config / typescript-config / ARCHITECTURE.md / web-next 주석 2곳 / ci-verify-gate explainer(현행이면)
- [x] `pnpm install` lockfile 재생성
- [x] Commit: `chore(spec-x-web-consolidation): web-vite 삭제 및 참조 정리`

---

## Task 4: Ship (필수)

### 🚦 Pre-Push Quality Gate (push 전 필수)

- [x] `pnpm depcruise` GREEN
- [x] `pnpm turbo run lint typecheck test build` GREEN
- [x] `pnpm knip` GREEN
- [x] `grep -rn "web-vite"` — 이력 문서 외 0건

### 📝 산출물 작성

- [x] **walkthrough.md 작성** (증거 로그)
- [x] **pr_description.md 작성**
- [ ] **Ship Commit**: `docs(spec-x-web-consolidation): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] **Push**: `git push -u origin spec-x-web-consolidation`
- [ ] **PR 생성** + 사용자 알림

---

## 진행 요약

| 항목 | 값 |
|---|---|
| **총 Task 수** | 4 |
| **예상 commit 수** | 4 |
| **현재 단계** | Execution |
| **마지막 업데이트** | 2026-06-10 |
