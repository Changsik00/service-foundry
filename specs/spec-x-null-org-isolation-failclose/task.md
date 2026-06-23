# Task List: spec-x-null-org-isolation-failclose

> One Task = One Commit. 보안 fix — 격리 e2e 회귀 0 이 필수.

---

## Task 1: 브랜치 생성
- [ ] `git checkout -b spec-x-null-org-isolation-failclose` (base: `main`)

## Task 2: fail-close 분기 (TDD)
### 2-1. 테스트 (Red)
- [ ] `packages/nestjs/tenant/src/index.test.ts`: "인증 + orgId null → tx 열고 nil-uuid SET LOCAL(fail-closed)" 케이스 추가 + "미인증(req.user 없음) → permissive(tx 미생성)" 케이스
- [ ] 실행 → Fail 확인
- [ ] Commit: `test(spec-x-null-org-isolation-failclose): add failing test for authenticated null-org fail-close`

### 2-2. 구현 (Green)
- [ ] `packages/nestjs/tenant/src/index.ts`: 인증(`req.user` 존재)+orgId null → nil-uuid 컨텍스트 tx+SET LOCAL. 미인증은 permissive 유지.
- [ ] 실행 → Pass, typecheck PASS
- [ ] Commit: `fix(spec-x-null-org-isolation-failclose): fail-close RLS for authenticated null-org tokens`

## Task 3: (선택) ADR-0024 보강
- [ ] 인증-null-org = fail-closed 불변식을 ADR-0024 에 추가
- [ ] Commit: `docs(spec-x-null-org-isolation-failclose): document null-org fail-close invariant in ADR-0024`

## Task 4: Ship
### 🚦 Pre-Push Quality Gate
- [ ] `turbo run lint typecheck test` + 격리 e2e (로컬 5434 DB) → 회귀 0
- [ ] (재현 검증) 인증-null 경로가 nil 컨텍스트로 0행
### 📝 산출물
- [ ] walkthrough.md / pr_description.md
- [ ] Commit: `docs(spec-x-null-org-isolation-failclose): ship walkthrough and pr description`
### 🚀 Push & PR
- [ ] `git push -u origin spec-x-null-org-isolation-failclose`
- [ ] PR 생성 (base: `main`)
