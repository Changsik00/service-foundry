# Task List: spec-x-docs-code-drift

> 모든 task 는 한 commit 에 대응합니다 (One Task = One Commit).
> 매 commit 직후 본 파일의 체크박스를 갱신해야 합니다.
> 문서 전용 spec — TDD Red 대신 "검증 명령(grep/ls/count)"으로 확인.

---

## Task 0: 브랜치 생성
- [x] `git checkout -b spec-x-docs-code-drift` (완료)

---

## Task 1: 패키지 카탈로그 카운트/누락 정정 (index.md + architecture.md)
- [ ] `docs/index.md`: backend(22→23)·nestjs(6→8)·frontend(7→8) 카운트 + 누락 4개 링크 등재
- [ ] `docs/reference/architecture.md` §6 + mermaid(§2/§3): authz·nestjs auth-firebase/auth-supabase 반영
- [ ] 검증: `ls packages/backend|grep -vc node_modules`=23, `ls packages/nestjs|wc -l`=8, `ls packages/frontend|wc -l`=8 ↔ 문서
- [ ] Commit: `docs(spec-x-docs-code-drift): sync package catalog counts + missing 4 packages`

---

## Task 2: 누락 패키지 reference note 4개 신규 작성
- [ ] 실제 src/export 확인 후 작성 (CONVENTIONS §9.1 스켈레톤):
  - `docs/reference/packages/backend-authz.md`
  - `docs/reference/packages/nestjs-auth-firebase.md`
  - `docs/reference/packages/nestjs-auth-supabase.md`
  - `docs/reference/packages/frontend-auth-store.md`
- [ ] `docs/log.md` 항목 추가
- [ ] 검증: 4개 파일 존재 + index 링크 연결(고립 노트 0)
- [ ] Commit: `docs(spec-x-docs-code-drift): add reference notes for authz/nestjs-firebase/supabase/auth-store`

---

## Task 3: turborepo-rules.md drift 정정
- [ ] Node 22→24 (§1.5 engines, §8.1 CI node-version)
- [ ] `check-types`→`typecheck` (§3.5)
- [ ] 루트 tsconfig.json: "없음"→"존재(NestJS 데코레이터용 **의도적 일탈**)" + `tsconfig.base.json` 제거 (§2.4/§3.5)
- [ ] biome `//#format-and-lint`→실제 `//#knip`·`//#depcruise` + lint per-package/직접 (§3.5/§6.1)
- [ ] apps/admin §370 stale 일반화
- [ ] 검증: `grep -n "node-version\|typecheck\|check-types" docs/turborepo-rules.md`
- [ ] Commit: `docs(spec-x-docs-code-drift): fix turborepo-rules drift (node24/typecheck/tsconfig/biome)`

---

## Task 4: stale 예시 + review/ 카탈로그 등재
- [ ] `config-typescript-config.md` 의 `apps/admin` stale 예시 정리
- [ ] `docs/index.md` 에 `docs/review/*.md` 2건 등재 (기타 문서 섹션)
- [ ] 검증: `grep -rn "apps/admin" docs/reference docs/turborepo-rules.md | grep -v "신설 시\|제외\|ADR-0025"` → 0
- [ ] Commit: `docs(spec-x-docs-code-drift): drop stale apps/admin examples + catalog review notes`

---

## Task 5: Ship (필수)

### 🚦 Pre-Push Quality Gate
- [ ] spec.md §검증 명령 전부 통과 (stale 0 / note 4개 / 카운트 일치)

### 📝 산출물 작성
- [ ] **walkthrough.md 작성**
- [ ] **pr_description.md 작성**
- [ ] Commit: `docs(spec-x-docs-code-drift): ship walkthrough and pr description`

### 🚀 Push & PR
- [ ] `git push -u origin spec-x-docs-code-drift`
- [ ] PR 생성 (base main)
