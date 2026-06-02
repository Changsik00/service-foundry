# Implementation Plan: spec-14-08

## 📋 Branch Strategy
- 신규 브랜치: `spec-14-08-docs-verification` (= spec 디렉토리명, prefix 없음)
- 시작 지점: `phase-14-quality-cicd` (phase base)
- 첫 task 가 브랜치 생성. PR base = `phase-14-quality-cicd`.

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] 검증은 **문서를 소스에 맞춘다** (소스 코드는 안 고침). 문서-소스 불일치 발견 시 문서 수정.
> - [ ] 환각이 아니라 **소스가 실제로 틀린/위험한** 경우 발견 시 → 즉시 멈추고 보고(별도 fix spec 후보). 본 spec 에서 코드 수정 안 함.
> - [ ] 서브에이전트(Sonnet) 검증 + **Opus 스포트체크 표본 재검증** 으로 AI 허위검증 방지.

## 🎯 핵심 전략 (Core Strategy)

### 접근
검증 대상이 ~91 노트로 많아 **"대조 검증(Sonnet) → 수정(Sonnet) → 스포트체크(Opus)"** 파이프라인. 각 서브에이전트는 담당 노트마다 **실제 소스를 열어** export/동작을 대조하고, 노트를 직접 수정한 뒤 **구조화 리포트**(노트 / 발견 / 수정 / 근거경로)를 반환한다. 메인(Opus)은 리포트의 주장을 **grep 으로 표본 재검증**한다.

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 분담 | 도메인 3분할(Sonnet ×3 병렬) | 디렉토리 비충돌 + spec-14-07 과 동일 분담 |
| 검증 깊이 | reference=export 대조, explainer=동작 대조 | reference 환각은 export 표가 핵심, explainer 는 흐름 |
| 신뢰 | Opus grep 스포트체크 | 서브에이전트 "확인함" 의 허위 차단 (사용자 AI 의존 우려) |
| 커밋 | 도메인 묶음 단위 + 리포트 | One-Task-One-Commit, secrets 훅 warn 우회 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes
- `docs/reference/packages/*.md`, `docs/reference/apps/*.md`, `architecture.md`, `stack.md` — 환각/불일치 수정.
- `docs/explainers/**/*.md` — 동작 서술 수정.
- `packages/**/README.md`, `apps/**/README.md` — export/사용 예 오류 수정(필요 시).
- `specs/spec-14-08-docs-verification/verification-report.md` — [NEW] 검증 리포트.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (해당 없음 — docs-only)
실제 게이트:
```bash
bash tooling/scripts/docs-lint.sh        # 구조 회귀 0
```

### Opus 스포트체크 (서브에이전트 재검증)
```bash
# 리포트가 "export X 존재" 라 한 것을 표본으로:
grep -rn "export .* X" packages/<...>/src
# 리포트가 "경로 P 인용 정확" 이라 한 것을 표본으로:
test -e <P>
```

### 수동 검증 시나리오
1. 무작위 reference 노트 3개 → export 표 vs `src/index.ts` 육안 일치 — 기대: 일치.
2. 무작위 explainer 3개 → 핵심 동작 주장 vs 소스 — 기대: 일치 또는 "설계 수준" 명시.

## 🔁 Rollback Plan
- 전부 문서 수정 — git revert 안전. 코드 영향 0.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
