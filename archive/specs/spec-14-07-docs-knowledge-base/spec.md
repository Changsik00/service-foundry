---
id: spec-14-07
status: Draft
phase: phase-14
title: Obsidian 친화 설계·운영 지식베이스 구축 (docs vault + 패키지/앱 README + README 현행화)
created: 2026-05-31
integrationTestRequired: false
---

# spec-14-07: Obsidian 친화 설계·운영 지식베이스 구축

> 상위 Phase: [[phase-14]] · 본 문서는 phase 파일의 spec-14-07 항목을 구체화한다.

## 1. 배경 / 문제 (Why)

이 레포는 **앱 4개**(`api`/`web-next`/`web-vite`/`worker`)와 **패키지 48개**(backend 22 · config 7 · frontend 7 · nestjs 6 · shared 6), **ADR 20개**, **spec 69개**가 누적된 풀 구현 모노레포다. 그러나 지식이 spec/walkthrough/코드/ADR에 흩어져 있고 **단일 진입점과 탐색 가능한 지식 그래프가 없다**.

특히 최상위 `README.md`가 "Phase 1 진행 중"으로 멈춰 있어 (실제는 phase-14) 현실과 심각하게 괴리되어 있다. 사용자(오너)가 "packages/apps의 내용과 설치된 의존성의 도입 이유를 못 따라가겠다"고 명시했다.

목표는 상위 디렉토리 `../design-vault`가 검증한 **Obsidian 친화 지식베이스 패턴**(단일 카탈로그 `index.md` + Diátaxis 3층 `reference`/`decisions`/`explainers` + frontmatter·태그·`[[wikilink]]`·mermaid)을 이 레포에 이식해, **"무엇을(reference) / 왜(decisions) / 어떻게 동작(explainers)"** 를 한 그래프로 묶는 것이다.

## 2. 목표 / 비목표 (What)

### 목표 (Goals)
- `docs/`를 **Obsidian vault 루트**로 구성: 단일 `index.md`(MOC) + `CONVENTIONS.md`/`glossary.md`/`log.md` 메타.
- **reference 층**: `reference/architecture.md`(시스템 구조 + 패키지 의존 mermaid 그래프), `reference/packages/<cat>-<pkg>.md`(48개 패키지 레퍼런스), `reference/apps/<app>.md`(4개 앱), `reference/stack.md`(주요 의존성 ~80개 "왜 도입했나" — ADR 연결).
- **explainers 층** (= 기술 메커니즘/동작 원리): `explainers/{auth,backend,frontend,platform}/` 도메인별 핵심 메커니즘 설명 노트.
- **decisions 층**: 기존 `docs/adr/` 20개를 **재활용**(중복 생성 금지) — `index.md`에서 카탈로그로 링크.
- 각 패키지에 짧은 **`packages/<cat>/<pkg>/README.md`** (표면: 책임 + 사용법 + docs 심화 링크) — 48개. 앱 4개 README도 동일 (api는 기존 갱신).
- 최상위 **`README.md` 현행화** — phase-14 현실 반영 + `docs/` 진입점.
- 모든 노트 **Obsidian 규약 준수**: frontmatter(type/tags/aliases), 4층 태그(`service-foundry` 루트 + type + domain + concept), `[[wikilink]]`, mermaid, `> 💡`/`> ⚠️` 콜아웃.
- **지식 그래프 연결성**: 모든 노트가 상위(`architecture`)로 링크 + 횡적 2~5개 peer 링크 + `index.md` 전수 카탈로그(별-허브 구조).

### 비목표 (Non-Goals)
- **코드 변경 금지** — 순수 문서 작업. 패키지/앱 동작·API를 바꾸지 않는다.
- 새 **아키텍처 결정(ADR) 생성 금지** — 기존 결정 재활용·정리만.
- 의존성 **전수 1:1 문서화 아님** — 주요/카테고리 단위로 묶어 근거 기술 (사소한 transitive 제외).
- Obsidian 커뮤니티 플러그인 도입 아님 (design-vault처럼 core 플러그인만 전제).
- spec/walkthrough 원문 이관/삭제 아님 — 합성·인용만.

## 3. 상세 설계 / 요구사항 (How)

### 3.1 디렉토리 구조
```
README.md                         # 최상위 현행화 + docs 진입점
docs/
├─ index.md                       # 단일 카탈로그/MOC (type: index)
├─ CONVENTIONS.md                 # 문서 시스템 규약 (frontmatter/tags/wikilink/naming)
├─ glossary.md                    # 약어/용어 + authoritative 링크
├─ log.md                         # append-only 변경 로그 (최신 우선)
├─ reference/
│  ├─ architecture.md             # 시스템 구조 + 패키지 의존 그래프(mermaid)
│  ├─ packages/<cat>-<pkg>.md     # 48개
│  ├─ apps/<app>.md               # 4개
│  └─ stack.md                    # 의존성 도입 근거 (ADR 연결)
├─ adr/                           # 기존 docs/adr 유지 — index에서 링크
└─ explainers/
   ├─ auth/        # session-rotation, jwt-verify, oauth-flow, mfa-totp, passkey, password-reset, rate-limit, audit …
   ├─ backend/     # outbox, idempotency, queue-worker, cache, graceful-shutdown, observability(otel/metrics), database(drizzle), secrets …
   ├─ frontend/    # auth-react-hook, http-client(ky), ui, provider-sdk-prop-contract …
   └─ platform/    # monorepo-build(turbo/tsup), config-packages, ci-cd, release(changesets/docker) …
packages/<cat>/<pkg>/README.md    # 48개 짧은 표면 README
apps/<app>/README.md              # 4개 (api 갱신)
```
> 기존 `docs/adr`, `docs/notes`, `docs/rca`, `docs/turborepo-rules.md`는 유지하고 `index.md`에서 흡수 링크. `docs/notes/*`는 explainers로 승격 후보.

### 3.2 노트 스켈레톤 (sub-agent 공유 계약 — `CONVENTIONS.md`에 명문화)

**reference 패키지 노트**:
```yaml
---
type: reference
aliases: [<@repo/이름>, <한글 별칭>]
tags: [service-foundry, reference, <domain>, <concept>]
---
```
본문: 한 줄 책임 → 공개 API/export 표 → 의존(내부/외부) → 사용 예 → `> 소스` (spec/ADR/코드 경로) → `## 연결된 개념`([[explainer]]/[[adr]]).

**explainer 노트** (design-vault 패턴):
```yaml
---
difficulty: 초|중|고
tags: [service-foundry, explainer, <domain>, <concept>]
aliases: [...]
---
```
본문: `> 대상`/`> 연관 문서` 리드 → Q&A 또는 단계별 메커니즘 → mermaid 흐름도 → `## 용어 정리` → `## 동작/테스트 방법` → `## 마치며` → `## 연결된 개념`.

**패키지 README.md** (표면, 짧게): 한 줄 목적 → 설치/import → 핵심 API 1~2개 → `자세히: [[reference/packages/<…>]] · [[explainers/<…>]]` 링크.

### 3.3 태그 4층
1. 루트: `service-foundry` (전 노트) 2. type: `reference`/`decision`/`explainer`/`index` 3. domain: `auth`/`backend`/`frontend`/`platform`/`shared`/`config`/`nestjs` 4. concept: `session`/`jwt`/`outbox`/`otel`/`drizzle`/`turbo` 등.

### 3.4 명명
파일 `kebab-case-english.md`. reference 패키지는 `<category>-<pkg>.md`(예: `backend-auth-session.md`). 메타 파일만 대문자(`CONVENTIONS.md`). 단일 허브 `index.md`(디렉토리별 README 금지 — drift 방지).

### 3.5 오케스트레이션 (실행 시)
메인(Opus)이 조율 + `CONVENTIONS`/`architecture`/`index`/`README`/링크패스 직접 작성. **Sonnet sub-agent 최대 3개 동시**로 (1) spec/ADR/코드 마이닝 → 패키지·메커니즘 다이제스트, (2) reference·explainer·README 대량 저술. 상세는 plan.md/task.md.

## 4. 영향 범위 (Impact)

- **코드**: 없음 (순수 문서).
- **문서**: `docs/**` 신규 다수, `packages/*/*/README.md` 48, `apps/*/README.md` 4, 최상위 `README.md` 재작성. 기존 `docs/adr` 링크 흡수.
- **테스트**: 단위 테스트 없음(docs-only, 헌법 §9.1 정당화). 대신 경량 **검증 스크립트**(frontmatter 존재 + `[[wikilink]]` 해소 + mermaid fence 균형)로 대체.

## 5. 승인 기준 (Acceptance Criteria)

- [ ] `docs/index.md`가 모든 노트를 1줄씩 전수 카탈로그(별-허브).
- [ ] 패키지 48개 전부 `reference/packages/*` + `packages/*/*/README.md` 존재, 앱 4개 동일.
- [ ] `reference/stack.md`가 주요 의존성 도입 근거를 ADR과 연결.
- [ ] 핵심 메커니즘(auth/backend/frontend/platform) 도메인별 explainer 존재 (동작 원리 + mermaid).
- [ ] 최상위 `README.md`가 phase-14 현실 반영 + `docs/` 진입점.
- [ ] 전 노트 frontmatter(type/tags) 보유, 4층 태그 적용.
- [ ] 검증 스크립트: 깨진 `[[wikilink]]` 0, frontmatter 누락 0.
- [ ] 기존 `docs/adr` 20개가 `index.md`에서 링크되어 그래프에 포함.

## 6. 미해결 질문 (Open Questions)

- `docs/adr`를 현 위치 유지 vs `docs/decisions`로 개명? → **유지 + 링크** 권장(이동은 git 히스토리/링크 비용). 실행 중 확정.
- `docs/notes/*`(auth-foundation-architecture 등)를 explainers로 승격 vs 인용? → 승격 권장.
- explainer 커버리지 깊이: 전 패키지 vs 핵심 메커니즘만? → **핵심 메커니즘 우선**(48개 전수 explainer는 과함), reference는 전수.
- 패키지 README 48개의 분량 — 표면 최소(목적+링크)로 통일.
