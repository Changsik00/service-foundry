# Task List: spec-x-docs-refresh

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 문서/하우스키핑 전용 spec — 코드 테스트 없음(§9.1 문서 전용 예외).

## Pre-flight (Plan 작성 단계)

- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md 작성
- [x] task.md 작성 (이 파일)
- [x] 사용자 Plan Accept

---

## Task 1: 브랜치 생성

- [x] `git checkout -b spec-x-docs-refresh` (main 에서 분기)
- [x] Commit: 없음 (브랜치 생성만)

---

## Task 2: README 최신화

### 2-1. 구현

- [x] `README.md` "앱 4개" → "앱 3개" 정정
- [x] 패키지 카테고리별 개수 정정 (`packages/<category>/*` 실측치: backend/nestjs/frontend)
- [x] "핵심 역량" 절에 멀티테넌시(조직/초대)·RBAC/인가·데이터 UX·어드민+빌링·k8s 배포·public_id 항목 추가

### 2-2. 검증

- [x] README 전체 재검토 — 앱/패키지 개수 표기 내부 모순 없음 확인
- [x] Commit: `docs(spec-x-docs-refresh): README 앱/패키지 수치 정정 + 핵심 역량 갱신`

---

## Task 3: docs/index.md 패키지 reference drift 정리

### 3-1. 구현

- [x] `docs/index.md` backend 섹션에 `@repo/backend-tenant`, `@repo/backend-schema` 1줄 항목 추가
- [x] `docs/index.md` nestjs 섹션에 `@repo/nestjs-tenant` 1줄 항목 추가
- [x] (범위 확장 발견) `@repo/backend-id` 도 누락 확인 — 동일하게 1줄 항목 추가 (uuidv7/public_id 유틸, spec.md 요구사항 4 취지에 포함)
- [x] backend/nestjs 카테고리 개수 표기(`core, 23`→26 / `adapter, 8`→9) 실측치로 정정

### 3-2. 검증

- [x] `grep -c "backend-tenant\|backend-schema\|backend-id\|nestjs-tenant" docs/index.md` → 4 이상
- [x] Commit: `docs(spec-x-docs-refresh): docs/index.md 누락 패키지 reference 추가`

---

## Task 4: spec/phase 아카이브

### 4-1. 구현

- [x] `bash .harness-kit/bin/sdd archive --dry-run` 으로 대상 확인
- [x] `bash .harness-kit/bin/sdd archive` 실행 (spec 30개 + spec-x 9개 + phase-23~26 backlog 5개 → `archive/`)

### 4-2. 검증

- [x] `bash .harness-kit/bin/sdd status` 재실행 — archive 진단 문구 소거 확인 (완료)
- [x] Commit: `chore(spec-x-docs-refresh): sdd archive 실행 — 완료 spec/phase 정리`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate

- [x] 문서 전용 변경 — 코드 테스트 대상 없음 (§9.1 예외 적용)
- [x] `pnpm exec biome check README.md docs/index.md` → "No files were processed"(biome.json에서 markdown 미대상) — 확인 완료, skip

### 📝 산출물 작성

- [x] **walkthrough.md 작성**
- [x] **pr_description.md 작성**
- [x] Commit: `docs(spec-x-docs-refresh): ship walkthrough and pr description`

### 🚀 Push & PR

- [ ] `git push -u origin spec-x-docs-refresh`
- [ ] PR 생성 (`gh pr create` 또는 `/hk-pr-gh`)
