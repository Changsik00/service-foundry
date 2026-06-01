# spec-14-08: 지식베이스 문서 환각 전수 검증

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-14-08` |
| **Phase** | `phase-14` |
| **Branch** | `spec-14-08-docs-verification` |
| **상태** | Planning |
| **타입** | Refactor (문서 정확성 보정) |
| **Integration Test Required** | no |
| **작성일** | 2026-06-01 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
spec-14-07(#91, merged)에서 `docs/` Obsidian 지식베이스를 구축했다 — reference 48 + explainer 37 + 패키지/앱 README 52 + 최상위 README. 그러나 이 중 **대량 저술분은 Sonnet 서브에이전트 3개가 병렬 생성**했고, 그 과정에서 **소켓 중단 2건**(config 레퍼런스·backend explainer 재작성)과 **glob 누락**(stack/apps 1차 누락) 사고가 있었다.

### 문제점
LLM 대량 저술 문서는 **환각(hallucination) 위험**이 있다:
- 존재하지 않는 export/함수/타입을 "공개 API"로 기재.
- 동작 메커니즘(explainer)을 실제 코드와 다르게 설명.
- 잘못된 파일 경로·spec/ADR 인용.
- mermaid 흐름이 실제 호출 순서와 불일치.

spec-14-07 검증은 **구조적 검증**(깨진 wikilink/frontmatter/fence — docs-lint)에 그쳤고, **내용 정확성(소스 대조)** 은 검증되지 않았다. 미검증 문서가 main 에 올라가면 "권위 있어 보이는 틀린 문서"가 되어 오히려 해롭다(사용자가 "AI 의존이 우려된다"고 명시).

### 해결 방안 (요약)
모든 reference·explainer 노트를 **실제 소스(`packages/*/src`, `apps/*/src`, spec, ADR)와 1:1 대조**하여 환각을 탐지·수정하고, 핵심 주장에 **근거(file:line 또는 export 존재)** 를 확인한다. Sonnet 서브에이전트가 도메인별 대조 검증하고, **Opus(메인)가 grep 기반 스포트체크**로 서브에이전트 결과 자체를 재검증한다(AI 의존 우려 완화).

## 🎯 요구사항

### Functional Requirements
1. **reference 전수(48 패키지 + 4 앱 + architecture + stack)** — 각 노트의 "공개 API/export" 표가 실제 `src/index.ts` export 와 일치하는지 대조, 불일치 수정.
2. **explainer 전수(37)** — "어떻게 동작하나" 서술이 실제 소스 동작과 일치하는지 대조, 환각·과장 수정. 인용한 spec/경로 실재 확인.
3. **검증 리포트** — `specs/spec-14-08-docs-verification/verification-report.md` 에 노트별 (검증 상태 / 발견 환각 / 수정) 기록.
4. **Opus 스포트체크** — 서브에이전트가 "확인했다"고 한 export·경로를 메인이 grep 으로 표본 재검증(허위 검증 방지).
5. **docs-lint 회귀 없음** — 수정 후에도 깨진 링크/frontmatter/fence 0 유지.

### Non-Functional Requirements
1. 코드 변경 0 (순수 문서 정확성 보정). 소스가 틀린 게 아니라 문서가 틀린 것을 고친다.
2. 문서의 사실 주장은 **소스가 근거** — 추정·일반론으로 메우지 않는다. 불확실하면 "설계 수준" 으로 명시(과장 금지).

## 🚫 Out of Scope
- 소스 코드 수정 (문서가 소스를 따라가며, 그 반대 아님).
- 새 문서/패키지 추가, 새 explainer 작성 (검증·수정만).
- `docs/adr/*`·`docs/notes/*` 레거시 문서 (spec-14-07 산출 아님 — 대상 외).
- 스타일/표현 윤문 (사실 정확성에만 집중).

## 📑 ADR 후보 (Architecture Decision Records)
- [ ] ADR 가치 있는 결정 있음
- [x] 없음 (검증 작업 — 결정 아님)

## 🔗 관련 문서 (Related)
- 관련 spec: [[spec-14-07]] (검증 대상 산출)
- 관련 RCA: [[RCA-002-check-secrets-false-positive]] (커밋 시 secrets 훅 warn 우회 재적용)
- 규약: `docs/CONVENTIONS.md` (노트 스켈레톤 기준)

## ✅ Definition of Done
- [ ] reference 52(패키지48+앱4) + architecture + stack export/내용 대조 완료
- [ ] explainer 37 동작 서술 대조 완료
- [ ] `verification-report.md` 노트별 결과 기록
- [ ] Opus 스포트체크 표본 통과 (서브에이전트 허위검증 0)
- [ ] docs-lint PASS (회귀 0)
- [ ] `walkthrough.md` / `pr_description.md` ship
- [ ] 브랜치 push + PR (base: `phase-14-quality-cicd`)
