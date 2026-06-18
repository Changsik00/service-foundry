# spec-x-ui-tokens: 디자인 토큰 구현 (TOKEN.md → frontend-ui)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-ui-tokens` |
| **Branch** | `spec-x-ui-tokens` |
| **상태** | Plan Accepted |
| **타입** | Feature |
| **Integration Test Required** | no (CI e2e 로 회귀 확인) |
| **작성일** | 2026-06-11 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

- DESIGN.md/TOKEN.md (정본, #133 머지) 가 정의한 토큰이 코드에 없음
- 현재 토큰: `@repo/tailwind-config/globals.css` 의 shadcn 기본값 (hsl, `@theme` non-inline — 테넌트 슬롯 불가)
- `packages/frontend/ui` 컴포넌트(button/input/card 등)도 shadcn 기본 스타일

## 🎯 요구사항

1. **토큰 구현** — `packages/frontend/ui/src/styles.css` 를 디자인 시스템 정본 스타일시트로 전면 재작성:
   - `@theme inline` + `:root --ink` 채널 (TOKEN.md §1~5 전체)
   - 전역 base: body 14px/500, keep-all, input 16px, `.tnum` 유틸
2. **shadcn 오버라이드** — **현존 컴포넌트만** (button/input/card/label/form/toaster). dialog/table/badge 는 미존재 → fill-forward (TOKEN.md §8 — 미리 만들지 않음)
3. 토큰 위치 결정: 디자인 토큰은 design system 영역 → `frontend-ui` 소유. `@repo/tailwind-config` 는 범용 shadcn preset 으로 잔존 (frontend-ui 의존 제거)

## 🚫 Out of Scope

- dialog/table/badge/sonner 신규 생성 (auth-screens 에서 필요 시 fill-forward)
- 다크모드 값 정의 (DESIGN.md 미정의 — 후속. 기존 ThemeToggle 은 시각적 no-op 됨을 명시)
- Pretendard 웹폰트 로딩 (앱 관심사 — auth-screens)
- auth 화면 구현

## ✅ Definition of Done

- [ ] turbo lint/typecheck/build/test + knip + depcruise GREEN, CI e2e PASS
- [ ] walkthrough/pr_description ship + PR
