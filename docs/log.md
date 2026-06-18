---
type: index
aliases: [변경 로그, docs log, changelog]
tags: [service-foundry, index, meta]
---

# Log — 지식베이스 변경 로그

> append-only. 최신 항목을 **맨 위**에 추가한다.

### 2026-06-18 — 문서↔코드 drift 정정 (spec-x-docs-code-drift)
- **대상**: `index.md`, `reference/architecture.md`, `reference/packages/*`(신규 4), `turborepo-rules.md`, `reference/packages/config-typescript-config.md`
- **추가**: reference note 4개 — `backend-authz`, `nestjs-auth-firebase`, `nestjs-auth-supabase`, `frontend-auth-store` (코드에 실존하나 카탈로그 누락분)
- **정정**: 패키지 카운트(backend 22→23·nestjs 6→8·frontend 7→8), turborepo-rules 실제 설정 동기화(Node 24·`typecheck`·루트 tsconfig 일탈·biome 루트태스크), stale `apps/admin` 예시 제거, `review/*` 카탈로그 등재
- **요약**: 코드레벨 감사 결과 코드는 정답이고 문서가 뒤처진 drift 를 코드 현실에 맞춰 동기화.

### 2026-05-31 — 전체 카탈로그 + reference/explainer 저술 (spec-14-07)
- **대상**: docs/ 전 영역
- **추가**: `index.md`(전수 MOC), `reference/architecture.md` + `reference/packages/*`(48) + `reference/apps/*`(4) + `reference/stack.md`, `explainers/{auth,backend,frontend,platform}/*`(37), 패키지/앱 README 52, `glossary.md` 채움
- **요약**: 69 spec + 20 ADR + 코드 마이닝을 합성해 "무엇을/왜/어떻게" 3층 지식 그래프 구축.

### 2026-05-31 — 지식베이스 부트스트랩 (spec-14-07)
- **대상**: docs/ Obsidian vault 신설
- **추가**: `CONVENTIONS.md`, `glossary.md`(골격), `log.md`
- **요약**: 3층 모델(reference/decision/explainer) + 4층 태그 + 노트 스켈레톤 규약 확정. 이후 reference·explainer·README 대량 저술 예정.
