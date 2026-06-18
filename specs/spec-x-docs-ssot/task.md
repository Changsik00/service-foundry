# Task List: spec-x-docs-ssot

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).

## Task 0: 브랜치 생성
- [ ] `git checkout -b spec-x-docs-ssot`

## Task 1: SSOT 정책 작성 (CONVENTIONS)
- [ ] `docs/CONVENTIONS.md` 에 "문서 위치 / SSOT" 섹션 — 루트↔docs 경계 + topic→canonical 표 + 중복 금지 규칙
- [ ] Commit: `docs(spec-x-docs-ssot): add document location / SSOT policy`

## Task 2: 루트 ARCHITECTURE.md 일원화
- [ ] unique 유효 내용(§0 TS-first·§3 의존성 룰)이 docs 에 있는지 확인 → 없으면 docs/reference 로 이관
- [ ] 루트 ARCHITECTURE.md → thin pointer (정본 안내), `docs/index.md` 참조 갱신
- [ ] Commit: `docs(spec-x-docs-ssot): collapse root ARCHITECTURE.md to canonical pointer`

## Task 3: 정본 architecture 최신화
- [ ] `docs/reference/architecture.md` 누락 축 보강 — 멀티테넌시/RLS·인증 모드·배포(k8s)·어댑터 + ADR 링크
- [ ] Commit: `docs(spec-x-docs-ssot): refresh architecture reference (rls/auth-modes/deploy)`

## Task 4: drift 정정
- [ ] README ADR(26)/패키지 카운트, stale grep(web-vite/web-next/fastify/구 config-*) 정정, index.md 신규 등재(ADR-0024~0026, RCA-002/003, k8s)
- [ ] `grep` stale 참조 0 확인
- [ ] Commit: `docs(spec-x-docs-ssot): fix doc drift (counts, stale refs, catalog)`

## Task 5: Ship
- [ ] walkthrough.md / pr_description.md 작성 + Commit
- [ ] push + PR (base main) → CI 그린 후 merge → `sdd specx done docs-ssot`
