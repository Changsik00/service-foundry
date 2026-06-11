# Implementation Plan: spec-x-design-md

## 📋 Branch Strategy

- 브랜치: `spec-x-design-md` (생성 완료, base: `main`)

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [x] 베이스 미학 = Notion-warm light (2026-06-09 선택지 4종 중 사용자 선택)
> - [x] 문서 4종 구성 + FRONT.md 범용/ARCHITECTURE.md 특화 분리 (2026-06-09 합의)
> - [x] web = 콘솔(어드민 성격) 단일 타깃 (ADR-0025)

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 미학 | Notion-warm light 1개 고정 | 미학 혼합 = 정체성 사망. 66개 평가에서 가장 구체적 + 실제 SaaS 출신 + 한국어 UI 궁합 |
| 골격 | next-academy DESIGN.md 구조 차용 | Quick Reference·Anti-AI Guardrails 가 검증된 에이전트 제어 장치 |
| 컬러 | #1c1c1c 단일 hue + opacity 단계 (Lovable) | 토큰 수 격감 → AI 실수 표면 격감 |
| 보더/깊이 | ring-shadow 1px + subtle 2-layer (Cal.com·Vercel·Notion) | layout shift 0 + "놓인 종이" 메타포 |
| 테넌트 슬롯 | `--color-tenant` semantic 토큰 (HashiCorp 전용) | 멀티테넌트 브랜딩을 토큰 1개로 수용 |
| 검증 루프 | Audit Checklist 7단계 (PlayStation) | 생성 후 자가검증 — 가드레일의 실행 장치 |
| 문서 분리 | FRONT=범용 / ARCHITECTURE=특화 | 보일러플레이트 목적 (다른 프로젝트로 가져갈 문서 구분) |

## 📂 Proposed Changes

- [NEW] `docs/design/DESIGN.md` — Task 1
- [NEW] `docs/design/TOKEN.md` — Task 2
- [NEW] `docs/frontend/FRONT.md` — Task 3
- [NEW] `docs/frontend/ARCHITECTURE.md` — Task 4
- [MODIFY] `docs/index.md` — 4종 등록 (Task 4 에 포함)

## 🧪 검증 계획

- 문서 spec 이므로 코드 게이트는 lint(md 무관)·기존 그린 유지 확인만
- 내용 검증: spec.md 요구사항 체크리스트 대조 (walkthrough 에 기록)
- Agent Prompt Guide 의 예시 프롬프트가 DESIGN.md 수치만으로 실행 가능한지 self-check

## 🔁 Rollback Plan

- 순수 신규 문서 — PR revert 로 완전 원복

## 📦 Deliverables 체크

- [x] task.md 작성
- [x] 사용자 Plan Accept (로드맵 합의 2026-06-09 + "진행하자"/"다음")
- [ ] 모든 task 완료
- [ ] walkthrough / pr_description ship
