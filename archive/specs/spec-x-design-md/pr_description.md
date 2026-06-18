# spec-x: 프런트 디자인 시스템 문서 4종 (DESIGN/TOKEN/FRONT/ARCHITECTURE)

## 목적

AI 에이전트가 결정론적으로 따를 프런트 기준 문서가 없어 생성물마다 미학·구조가 표류
→ "AI 친화 + 제어 가능" 의 선행 조건인 정본 4종을 작성.

**합성 원칙**: 미학은 1개 고정(Notion-warm light), 방법론만 합성 —
66개 브랜드 design.md + next-academy 4종 전수 평가 결과 (2026-06-09).

## 산출물

| 문서 | 역할 | 핵심 |
|---|---|---|
| `docs/design/DESIGN.md` | 디자인 언어 **정본** | ink #1c1c1c opacity-driven 단일 회색 hue · 기능적 블루 #2383e2 · ring-shadow 경계 · `--color-tenant` 슬롯 · **Auth 4화면 스펙** · Anti-AI Guardrails 16금지+6필수 · Audit Checklist 7 · Voice&Tone · Agent Prompt Guide |
| `docs/design/TOKEN.md` | 구현 매핑 | CSS 변수 ↔ shadcn 예약 변수 ↔ Tailwind 유틸 + shadcn 오버라이드 작업 목록 (= spec-x-ui-tokens 입력) |
| `docs/frontend/FRONT.md` | **범용** 스택 패턴집 | RSC/client env 분리 함정 · queryOptions · RHF+Zod 에러 분기표 · **a11y "shadcn 에 맡기고 빈틈 6규칙만"** (과잉 aria 방지) |
| `docs/frontend/ARCHITECTURE.md` | apps/web **특화** | 레이어 모델 · features/ 폴더 규칙 (lib/ 평면 정리 기준) · 불변규칙 8 · auth 실배선 도식 · 쿡북 |

+ `docs/index.md` 에 "Design & Frontend (정본)" 섹션 등록.

## 설계 포인트

- **opacity-driven grayscale**: 회색 hex 1개(`--ink`) — 토큰 수 격감 = AI 실수 표면 격감
- **테넌트 브랜딩 슬롯**: `--color-tenant` semantic 1개로 멀티테넌트 식별색 수용, CTA·포커스 사용 금지 계약
- **a11y**: "접근성 신경 써라" 일반 지시는 무효과/과잉 aria 역효과 → "Radix 에 맡기고 손대지 마라" + icon-only aria-label·DialogTitle 등 빈틈 6규칙만
- 도메인 중립화: next-academy 의 50대 페르소나·학원 도메인·진검정 사이드바 제거

## 검증

- 코드 변경 없음 (문서 전용) — 기존 게이트 그린 유지
- spec.md 요구사항 전 항목 대조 ✅ (walkthrough)
- Agent Prompt Guide 4종 예시가 문서 내 수치만으로 해소되는지 self-check ✅

## 후속

- spec-x-ui-tokens — TOKEN.md 를 `packages/frontend/ui` 에 구현
- spec-x-auth-screens — DESIGN.md §6 Auth 4화면 구현 + features/ 개편
