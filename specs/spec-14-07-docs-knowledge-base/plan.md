---
id: spec-14-07
status: Draft
phase: phase-14
title: Obsidian 친화 설계·운영 지식베이스 구축
created: 2026-05-31
---

# Plan: spec-14-07

> 본 문서는 실행 계약 (execution contract) 이다. Plan Accept 후 이 계획에 따라서만 실행한다.

## 1. 접근 방법 (Approach)

순수 문서 작업이므로 TDD 대신 **"규약 우선 → 마이닝 → 대량 저술 → 조립/검증"** 4단계로 진행한다. 메인(Opus)이 오케스트레이터로서 공유 계약(`CONVENTIONS.md`, 노트 스켈레톤)과 허브 문서(`architecture`/`index`/최상위 `README`/링크패스)를 직접 작성하고, 기계적 대량 작업은 **Sonnet sub-agent 최대 3개 동시**에 위임한다.

핵심 원칙:
1. sub-agent는 항상 **동일한 스켈레톤·태그·명명 계약**을 받아 일관성 확보.
2. 마이닝(읽기) 결과를 구조화 다이제스트로 받아 메인이 검수 후 저술 배치 분배.
3. 병렬 sub-agent는 **서로 다른 디렉토리만** 써서 충돌 없음.
4. 커밋은 메인이 **task 단위로 직렬** 수행 (One Task = One Commit, 커밋 포맷·훅 통제).

분기: 현재 `phase-14-quality-cicd` 팁에서 `spec-14-07-docs-knowledge-base` 생성. PR base = `phase-14-quality-cicd`.

## 2. 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] `docs/adr` 위치 유지(권장) — `docs/decisions`로 개명하지 않음.
> - [ ] explainer는 **핵심 메커니즘 우선** (48개 전수 아님), reference는 전수.
> - [ ] kit 0.13.8 업데이트 잔재는 stash 보관 — 본 작업과 분리.

## 3. 작업 분해 (요약)

브랜치 → (T2)규약/메타 스켈레톤 → (T3)마이닝 3-agent 다이제스트 → (T4)architecture+의존그래프 → (T5~T7)reference packages/apps/stack → (T8~T10)explainers 도메인 → (T11)패키지·앱 README 48+4 → (T12)index/glossary/log → (T13)최상위 README → (T14)링크·태그 일관성 + 검증. 상세 task.md.

## 4. 리스크 / 롤백 (Risks)

- **스코프 과대(48 패키지)** → reference 표면 균질화, explainer 핵심만, sub-agent 3개 병렬.
- **sub-agent 산출 불일치** → T2에서 `CONVENTIONS.md`+스켈레톤 선확정, 모든 위임 프롬프트에 첨부.
- **`[[wikilink]]` 깨짐 / frontmatter 누락** → T14 검증 스크립트 게이트.
- **docs-only인데 `check-test-passed` 훅 차단 가능** → 헌법 §9.1 docs-only 정당화; 차단 시 검증 스크립트를 test 신호로 사용하거나 훅 우회(사용자 고지 후).
- **mermaid fence 불균형** → 검증 스크립트에 fence 균형 체크 포함.
- **롤백**: 전부 신규/문서 — git revert 안전, 코드 영향 0.

## 5. 검증 계획 (Verification Plan)

### 검증 스크립트 (단위 테스트 대체 — docs-only)
```bash
# 1) frontmatter type/tags 존재
# 2) [[wikilink]] 대상 해소 (broken 0)
# 3) ```mermaid fence 짝 균형
```
### 수동 검증
1. Obsidian graph 연결성 — 고립 노트 0 목표.
2. `docs/index.md` 전수성 — 모든 노트 카탈로그됨.

## 6. Deliverables 체크
- [ ] task.md 작성 완료
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough.md / pr_description.md ship
