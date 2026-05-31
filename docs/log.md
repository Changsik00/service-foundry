---
type: index
aliases: [변경 로그, docs log, changelog]
tags: [service-foundry, index, meta]
---

# Log — 지식베이스 변경 로그

> append-only. 최신 항목을 **맨 위**에 추가한다.

### 2026-05-31 — 전체 카탈로그 + reference/explainer 저술 (spec-14-07)
- **대상**: docs/ 전 영역
- **추가**: `index.md`(전수 MOC), `reference/architecture.md` + `reference/packages/*`(48) + `reference/apps/*`(4) + `reference/stack.md`, `explainers/{auth,backend,frontend,platform}/*`(37), 패키지/앱 README 52, `glossary.md` 채움
- **요약**: 69 spec + 20 ADR + 코드 마이닝을 합성해 "무엇을/왜/어떻게" 3층 지식 그래프 구축.

### 2026-05-31 — 지식베이스 부트스트랩 (spec-14-07)
- **대상**: docs/ Obsidian vault 신설
- **추가**: `CONVENTIONS.md`, `glossary.md`(골격), `log.md`
- **요약**: 3층 모델(reference/decision/explainer) + 4층 태그 + 노트 스켈레톤 규약 확정. 이후 reference·explainer·README 대량 저술 예정.
