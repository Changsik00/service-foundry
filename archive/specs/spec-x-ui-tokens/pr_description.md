# spec-x: 디자인 토큰 구현 (TOKEN.md → frontend-ui)

## 목적

#133 에서 확정한 DESIGN.md/TOKEN.md 를 코드로 구현 — `packages/frontend/ui` 가 디자인 시스템
정본 스타일시트를 소유하고, shadcn 컴포넌트를 Notion-warm 스펙으로 오버라이드.

## 변경 내용

### 1. 토큰 스타일시트 (`frontend-ui/src/styles.css` 전면 재작성)

- `:root` — `--ink: 28 28 28` 채널 (모든 회색의 유일한 hue) + `--color-tenant` 런타임 슬롯
- `@theme inline` — shadcn 예약 변수 매핑 + 전용 토큰 + radius 5단계 + ring 기반 그림자 + Pretendard
- base — body 14px/500/keep-all, 폼 컨트롤 16px(iOS 줌 방지), 전역 `:focus-visible` brand 링
- `.tnum` 유틸 (tabular-nums)

### 2. shadcn 오버라이드 (현존 컴포넌트만 — fill-forward)

| 컴포넌트 | 변경 |
|---|---|
| button | Primary(hover 어두워짐)·Secondary(흰배경+ring)·Ghost·Destructive, sizes 28/36/44, outline 제거 |
| input | border → `shadow-ring`, 16px, `aria-invalid` 에러 ring |
| card | radius 12 + elevation-2, border 제거 |
| toaster | bottom-right |

dialog/table/badge 는 **만들지 않음** — TOKEN.md §8 fill-forward (auth-screens 에서 필요 시 생성).

### 3. 의존 정리

- 디자인 토큰 소유권: `@repo/tailwind-config` → `frontend-ui` (config 카테고리는 도구 preset — ADR-0003 의미론)
- frontend-ui·apps/web 의 tailwind-config 의존 제거 (범용 preset 으로 잔존)
- 다크모드: DESIGN.md 미정의 → 추측 값 넣지 않음 (ThemeToggle 시각적 no-op, 후속)

## 검증

- turbo lint/typecheck/build/test — 전부 PASS / knip exit 0 / depcruise ✔
- **full-stack e2e 7/7 PASS** — 새 토큰으로 로그인 전 플로우 렌더 회귀 확인

## 후속

- spec-x-auth-screens — DESIGN.md §6 Auth 4화면 + features/ 구조 개편 + 다크모드/추가 컴포넌트 fill-forward
