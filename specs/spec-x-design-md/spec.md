# spec-x-design-md: 프런트 디자인 시스템 문서 4종 (DESIGN/TOKEN/FRONT/ARCHITECTURE)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-design-md` |
| **Phase** | `phase-x` |
| **Branch** | `spec-x-design-md` |
| **상태** | Plan Accepted |
| **타입** | Feature (docs) |
| **Integration Test Required** | no |
| **작성일** | 2026-06-10 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- `apps/web` (구 web-next) 가 유일한 frontend — 콘솔(어드민 성격) 역할 확정 (ADR-0025)
- 디자인 언어·토큰·프런트 아키텍처 규칙이 **문서로 존재하지 않음** — `apps/web/src/lib/` 에 auth 파일 6개가 평면으로 쌓이는 등 규칙 부재가 이미 드러남
- 외부 소스 평가 완료 (2026-06-09 대화):
  - `~/Project/Design/design-md-collection/` 66개 브랜드 design.md (동일 9-섹션 템플릿, 미학 캡처)
  - `~/Downloads/next-academy/docs/` 4종 (DESIGN/ARCHITECTURE/FRONT/TOKEN — 에이전트 운영 문서 골격)

### 문제점

AI 에이전트가 UI 를 만들 때 결정론적으로 따를 기준이 없음 → 생성물마다 미학·구조가 표류. "AI 친화적이면서 제어 가능"이라는 목표에 문서가 선행 조건.

### 해결 방안 (요약)

검증된 골격(next-academy) + 66개 컬렉션의 방법론적 강점을 합성한 문서 4종을 작성한다. **미학은 1개(Notion-warm light)로 고정, 방법론은 합성** — 미학을 섞으면 정체성이 죽는다는 원칙 (2026-06-09 합의).

## 🎯 요구사항

### Functional Requirements

1. **`docs/design/DESIGN.md`** — 디자인 언어 정본:
   - 미학: Notion-warm light (#1c1c1c opacity-driven grayscale, 기능적 블루 1색, radius 8/12/16, Pretendard 500 + tnum + keep-all)
   - 방법론: Quick Reference / 3-tier 토큰 / opacity-grayscale (Lovable) / ring-shadow border (Cal.com·Vercel) / 테넌트 브랜딩 슬롯 (HashiCorp) / Anti-AI Guardrails (next-academy) / Audit Checklist (PlayStation) / Voice&Tone / Agent Prompt Guide
   - **Auth 화면 스펙** 섹션 (로그인/회원가입/테넌트 선택·초대 — 다음 spec 직결)
   - 도메인 중립 (next-academy 의 50대 페르소나·학원 도메인 제거)
2. **`docs/design/TOKEN.md`** — CSS 변수 ↔ shadcn 예약 변수 ↔ Tailwind 유틸 매핑 레퍼런스 (구현 spec 의 SoT)
3. **`docs/frontend/FRONT.md`** — **범용** 스택 패턴집 (다른 프로젝트로 가져가는 문서): Next App Router + RSC/client 분리, TanStack Query queryOptions, RHF+Zod, 상태도구 선택 기준, 에러 분기표. 버전 API 디테일 최소화 (루트 ARCHITECTURE §0.1 "설치된 버전이 SoT" 준수)
4. **`docs/frontend/ARCHITECTURE.md`** — **이 레포 특화**: apps/web 레이어 모델, 폴더 구조 규칙 (features/ 구획), 불변규칙 표, Form/Query/Auth 패턴, 쿡북. "왜"는 ADR 참조로 위임 (중복 정본 금지)

### Non-Functional Requirements

1. 모든 수치는 결정론적 (모호한 형용사 금지 — AI 가 그대로 실행 가능해야 함)
2. 각 문서 상호 링크 + docs/index.md 등록
3. 기존 문서와 정본 충돌 없음 (스택 "왜" = ADR, 디자인 "무엇" = DESIGN.md)

## 🚫 Out of Scope

- 토큰 CSS 구현 (`packages/frontend/ui`) → spec-x-ui-tokens
- auth 화면 구현 → spec-x-auth-screens
- apps/web 폴더 구조 실제 개편 (문서에 규칙만 정의)

## 🔗 관련 문서 (Related)

- 관련 ADR: ADR-0025 (frontend 단일화), ADR-0015 (framework adapter)
- 관련 메모리: design.md 합성 프로젝트 (Notion-warm 결정, 2026-06-09)

## ✅ Definition of Done

- [ ] 문서 4종 작성 + docs/index.md 등록
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] 브랜치 push + PR + 사용자 검토 요청
