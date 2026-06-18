# Walkthrough: spec-x-design-md

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 베이스 미학 | Notion-warm / Linear dark / Vercel neutral / NEXTPAY 유지 | **Notion-warm light** | 66개 컬렉션 평가 후 사용자 선택 (2026-06-09). 가장 구체적 문서 + 실제 SaaS 출신 + 한국어 UI 궁합 |
| 미학 vs 방법론 | 66개 장점 혼합 | **미학 1개 고정, 방법론만 합성** | 미학은 배타적 — 섞으면 정체성 사망 |
| 사이드바 | next-academy 진검정 #111 | **#f6f5f4 warm gray** | 진검정은 warm light 와 충돌. active 무채색 규칙은 유지 |
| pill CTA | NEXTPAY pill 999px | **버튼 radius 8 고정, pill 금지** | Notion-warm 의 조용한 톤 — 가드레일 #7 로 명문화 |
| a11y 지시 방식 | "접근성 신경 써라" 일반 지시 | **"shadcn 에 맡기고 손대지 마라" + 빈틈 6규칙** | 막연한 지시는 무효과 or 과잉 aria 역효과 (사용자 문제 제기, 2026-06-10). FRONT.md §6.2 |
| FRONT vs ARCHITECTURE | 단일 문서 | **범용/특화 분리** | 보일러플레이트 목적 — FRONT 는 타 프로젝트 이식용 |
| 문서 위치 | 루트 / docs 하위 | `docs/design/` + `docs/frontend/` | 루트 ARCHITECTURE.md 와 이름 충돌 회피, docs/index 허브 등록 |

## 🤝 사용자 협의 기록

- 2026-06-09: 66개 design-md + next-academy 4종 전수 평가 → Notion-warm 선택, 4문서 구성 합의
- 2026-06-10: "design.md 등은 이번 스펙 아니지?" → 본 spec 이 그 작업임을 확인 / shadcn aria 질문 → FRONT.md §6.2 설계 반영
- Plan Accept: 로드맵 합의 + "진행하자"/"다음"

## 🧪 검증 결과

spec.md 요구사항 대조:

| 요구 | 충족 |
|---|---|
| DESIGN.md — Quick Ref / 3-tier / opacity-grayscale / ring-shadow / 테넌트 슬롯 / Guardrails(16금지+6필수) / Audit 7 / Voice&Tone / Prompt Guide | ✅ 전 섹션 |
| DESIGN.md — Auth 화면 스펙 (로그인/가입/테넌트 선택/초대) | ✅ §6 — spec-x-auth-screens 구현 기준 |
| 도메인 중립 (50대 페르소나·학원 제거) | ✅ |
| TOKEN.md — CSS 변수 ↔ shadcn ↔ Tailwind + 구현 금지 목록 | ✅ + shadcn 오버라이드 작업 목록(§6) = spec-x-ui-tokens 입력 |
| FRONT.md — 범용 + a11y 빈틈 6규칙 | ✅ 레포 특화 내용 없음 (이식 가능) |
| frontend ARCHITECTURE.md — 레이어/불변규칙 8/auth 실배선/쿡북 | ✅ "왜"는 ADR 위임 |
| 상호 링크 + index 등록 | ✅ |
| Agent Prompt 예시가 문서 수치만으로 실행 가능한지 self-check | ✅ §10 4종 — 모든 값이 §2~5 토큰으로 해소됨 |

코드 변경 없음 — 기존 게이트 그린 유지 (문서 전용 spec).

## 📦 Commits

1. docs: design.md 디자인 언어 정본
2. docs: token.md 토큰 매핑 레퍼런스
3. docs: front.md 범용 스택 패턴집
4. docs: frontend architecture.md + index 등록
5. docs: ship walkthrough and pr description
