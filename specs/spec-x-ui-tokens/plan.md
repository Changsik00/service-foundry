# Implementation Plan: spec-x-ui-tokens

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] 토큰 값 전체 = DESIGN.md/TOKEN.md (#133 에서 사용자 승인 완료)
> - [x] fill-forward 원칙 (#133 추가 커밋) — 미존재 컴포넌트는 만들지 않음

> [!WARNING]
> - [ ] 기존 ThemeToggle 다크모드가 시각적 no-op 이 됨 (다크 토큰 미정의 — DESIGN.md 후속)

## 🎯 핵심 전략

| 결정 | 선택 | 이유 |
|---|---|---|
| 토큰 위치 | `frontend-ui/src/styles.css` (자급) | 디자인 토큰은 design system 소유물. config 카테고리는 도구 preset (ADR-0003 의미론) |
| tailwind-config | 잔존 (범용 shadcn preset) | 미래 vanilla 앱용. frontend-ui 의존만 제거 |
| 오버라이드 범위 | 현존 6개 컴포넌트만 | fill-forward — dialog/table/badge 선제 생성 = filler |
| 검증 | build + 기존 단위테스트 + CI e2e | CSS 는 단위테스트 비대상. e2e (로그인 화면 렌더) 가 회귀 가드 |

## 📂 Proposed Changes

- [REWRITE] `packages/frontend/ui/src/styles.css` — Task 1
- [MODIFY] `button.tsx` `input.tsx` `card.tsx` (+ label/form/toaster 점검) — Task 2
- [MODIFY] `frontend-ui/package.json` (tailwind-config dep 제거), apps/web 잔존 dep 점검 — Task 2

## 🔁 Rollback — PR revert 단독 가능
