# docs(spec-14-07): Obsidian 친화 설계·운영 지식베이스 구축

## 🎯 변경 요약

흩어진 설계 지식(spec 69 · ADR 20 · 패키지 48 · 앱 4)을 **Obsidian 친화 지식베이스**(`docs/`)로 합성했다. 단일 카탈로그 `docs/index.md` 아래 reference(무엇을)/adr(왜)/explainers(어떻게 동작) 3층 + 패키지·앱 README + 최상위 README 현행화. **순수 문서(코드 변경 0).**

## 📝 변경 내용 (Spec 대비)

- ✅ `docs/` Obsidian vault: `index.md`(MOC) + `CONVENTIONS.md`/`glossary.md`/`log.md`
- ✅ reference 전수: `architecture.md`(+의존 mermaid 그래프) · 패키지 48 · 앱 4 · `stack.md`(의존성 도입 근거, ADR 연결)
- ✅ explainers 37: auth(12)·backend(11)·frontend(6)·platform(8) — 동작 원리 + mermaid
- ✅ 기존 `docs/adr` 20개 링크 흡수(이동 없음)
- ✅ 패키지 README 48 + 앱 README 4 + 최상위 README 재작성(Phase1 → phase-14 현실, Node 24)
- ✅ Obsidian 규약: frontmatter + 4층 태그 + `[[wikilink]]` + mermaid + 콜아웃

## 🧪 테스트

`tooling/scripts/docs-lint.sh` — **PASS**: 깨진 wikilink 0(145 타깃) · frontmatter/tags 누락 0 · mermaid fence 불균형 0 · docs md 95.

## 📂 주요 파일

- `docs/index.md` — 진입점(전수 카탈로그)
- `docs/CONVENTIONS.md` — 문서 시스템 규약(SoT)
- `docs/reference/architecture.md` — 시스템 구조 + 의존 그래프
- `README.md` — 최상위 현행화
- `tooling/scripts/docs-lint.sh` — 검증 스크립트

## ✅ 체크리스트

- [x] docs-lint PASS (단위 테스트 대체, docs-only)
- [x] walkthrough.md / pr_description.md
- [x] 브랜치 push
- [x] 14 task 전부 커밋(One-Task-One-Commit)

## 🔗 관련

- Spec: `specs/spec-14-07-docs-knowledge-base/`
- Phase: phase-14 (base 브랜치 대상 PR)
- 참고: check-secrets 오탐으로 일부 문서 커밋에 `HARNESS_HOOK_MODE_SECRETS=warn` 적용 (walkthrough §발견사항)
