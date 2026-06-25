# Task List: spec-26-01

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 안전: 신규 순수 패키지 — 런타임 참조 0, 회귀 위험 최소.

---

## Task 1: `@repo/backend-id` 패키지 + 유틸 (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-01-id-util-and-audit` (base: `phase-26-id-scheme-public-id`)

### 1-2. 패키지 스캐폴드 (Red 선결)
- [x] `packages/backend/id/{package.json,tsconfig.json,src/index.ts}` 생성 (dep 0). `@repo/backend-id` workspace alias 등록
- [x] 스텁 export 로 turbo typecheck 통과 보장 (`feedback_tdd_red_typecheck_gate`)

### 1-3. 테스트 작성 (TDD Red)
- [x] `src/public-id.test.ts` — 형식·Crockford 문자집합·고유성·prefix 반영·불투명성(정렬 무관)
- [x] `src/prefix.test.ts` — `ID_PREFIX` 4종(usr/org/ses/key) + 타입
- [x] `src/uuidv7.test.ts` — v7 레이아웃(version=7·variant)·timestamp 인코딩
- [x] 실행 → Fail 확인 (8 fail / 2 pass)
- [x] Commit: `test(spec-26-01): add failing tests for id util (public_id/prefix/uuidv7)`

### 1-4. 구현 (TDD Green)
- [x] `src/prefix.ts` — `ID_PREFIX` + `IdPrefix` 타입
- [x] `src/public-id.ts` — Crockford base32 인코더 + `publicId(prefix)`
- [x] `src/uuidv7.ts` — `uuidv7()` (RFC 9562)
- [x] `src/index.ts` 배럴
- [x] 실행 → 단위 10/10 PASS, `turbo typecheck` PASS
- [x] Commit: `feat(spec-26-01): add @repo/backend-id (public_id/prefix/uuidv7)`

---

## Task 2: 감사 결과 고정 (문서)

### 2-1. 확정 root 표
- [x] spec.md 의 감사 표가 후속 spec 범위와 일치 (users/org/sessions/api-keys + memberships/invitations 상속·불요)

---

## Task 3: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` → 회귀 0 (fresh DB, apps/api 341/341, 신규 패키지 포함)

### 📝 산출물 작성
- [x] **walkthrough.md** (결정·감사 결과 요약)
- [x] **pr_description.md**
- [x] Commit: `docs(spec-26-01): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-01-id-util-and-audit`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
