# Task List: spec-26-07

> One Task = One Commit. 불변식 안전망 — 실 HTTP 응답 스캔.

---

## Task 1: 누출 감사 스캔 e2e (TDD)

### 1-1. 브랜치 생성
- [x] `git checkout -b spec-26-07-leak-audit-snapshot` (base: `phase-26-id-scheme-public-id`)

### 1-2. 테스트 작성
- [x] `apps/api/src/auth/public-id-leak-audit.e2e.test.ts` — 주요 인증 엔드포인트(signup/signin/refresh/me/orgs/org-members/api-keys/sessions/admin) 응답 body uuid 0 스캔 + prefix sanity
- [x] 실행 → GREEN 기대(누출 없음); RED 면 누출 발견
- [x] Commit: `test(spec-26-07): assert no internal uuid leaks in API responses`

### 1-3. (누출 발견 시) 수정
- [~] 누출 0건 — 수정 불필요(생략)
- [~] (생략)

---

## Task 2: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [x] `turbo run lint typecheck test` (fresh 5434 DB) → 회귀 0

### 📝 산출물
- [x] walkthrough.md / pr_description.md
- [x] Commit: `docs(spec-26-07): ship walkthrough and pr description`

### 🚀 Push & PR
- [x] `git push -u origin spec-26-07-leak-audit-snapshot`
- [x] PR 생성 (base: `phase-26-id-scheme-public-id`)
