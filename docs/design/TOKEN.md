# Token Reference — service-foundry

> **역할**: [DESIGN.md](./DESIGN.md) 의 semantic 토큰을 CSS 변수 · shadcn 예약 변수 · Tailwind 유틸로 매핑하는 구현 레퍼런스.
> 구현 위치(예정): `packages/frontend/ui` 의 `@theme inline` + `:root` (spec-x-ui-tokens).
> 값의 정본은 DESIGN.md — 이 문서는 **이름 매핑**만 담당한다. 값이 바뀌면 DESIGN.md 먼저.

---

## 1. 원리

### 1.1 ink 채널 변수

opacity-driven grayscale(DESIGN §1.2)을 위해 ink 는 **RGB 채널**로 선언한다:

```css
:root {
  --ink: 28 28 28;   /* #1c1c1c */
}
```

모든 회색 토큰은 `rgb(var(--ink) / <opacity>)` 파생. 새 회색 hex 추가 금지.

### 1.2 Tailwind v4 `@theme inline`

`@theme inline` 으로 선언해야 CSS 변수 참조가 유지되어 테넌트 슬롯·다크모드(후속) 런타임 오버라이드가 가능하다 (`@theme` 은 빌드 시 값이 인라인됨).

---

## 2. 컬러 매핑

### 2.1 shadcn 예약 변수 ↔ DESIGN semantic

| shadcn 변수 | 값 | DESIGN semantic | Tailwind 유틸 |
|---|---|---|---|
| `--background` | `#ffffff` | surface-page | `bg-background` |
| `--foreground` | `rgb(var(--ink))` | text-primary | `text-foreground` |
| `--card` | `#ffffff` | surface-card | `bg-card` |
| `--card-foreground` | `rgb(var(--ink))` | text-primary | `text-card-foreground` |
| `--popover` / `--popover-foreground` | card 와 동일 | surface-card | `bg-popover` |
| `--primary` | `#2383e2` | brand | `bg-primary` |
| `--primary-foreground` | `#ffffff` | text-inverse | `text-primary-foreground` |
| `--secondary` | `#f6f5f4` | surface-sunken | `bg-secondary` |
| `--secondary-foreground` | `rgb(var(--ink) / 0.7)` | text-secondary | `text-secondary-foreground` |
| `--muted` | `#f6f5f4` | surface-sunken | `bg-muted` |
| `--muted-foreground` | `rgb(var(--ink) / 0.5)` | text-tertiary | `text-muted-foreground` |
| `--accent` | `rgb(var(--ink) / 0.04)` | surface-hover | `bg-accent` |
| `--accent-foreground` | `rgb(var(--ink))` | text-primary | `text-accent-foreground` |
| `--destructive` | `#d44c47` | error (보더·아이콘) | `bg-destructive` |
| `--border` | `rgb(var(--ink) / 0.08)` | border | `border-border` |
| `--input` | `rgb(var(--ink) / 0.08)` | border | `border-input` |
| `--ring` | `#2383e2` | brand (포커스) | `ring-ring` |

### 2.2 service-foundry 전용 토큰

`@theme inline` 추가 선언 → 커스텀 유틸 생성.

| CSS 변수 | 값 | Tailwind 유틸 | 용도 |
|---|---|---|---|
| `--color-brand-hover` | `#1b6fc7` | `bg-brand-hover` | 버튼·링크 hover |
| `--color-brand-active` | `#155a9e` | `bg-brand-active` | 프레스 |
| `--color-brand-soft` | `rgba(35,131,226,0.08)` | `bg-brand-soft` | 선택 chip, info 배경 |
| `--color-tenant` | `var(--color-primary)` | `bg-tenant` | 테넌트 식별 슬롯 (DESIGN §1.3) |
| `--color-surface-selected` | `rgb(var(--ink) / 0.06)` | `bg-surface-selected` | 선택 행·active 메뉴 |
| `--color-text-disabled` | `rgb(var(--ink) / 0.35)` | `text-disabled` | 비활성 |
| `--color-overlay` | `rgb(var(--ink) / 0.4)` | — (모달 backdrop) | |
| `--color-success` / `-bg` / `-text` | `#18794e` / `#e9f5ee` / `#18794e` | `text-success` 등 | |
| `--color-warning` / `-bg` / `-text` | `#d97706` / `#fbf0e0` / `#b45309` | `text-warning` 등 | |
| `--color-error` / `-bg` / `-text` | `#d44c47` / `#fbecea` / `#b3261e` | `text-error` 등 | |
| `--color-chart-1/2/3` | `#2383e2` / `#7eb3ec` / `#c4dcf6` | — | 차트 (블루 family 만) |

### 2.3 테넌트 슬롯 오버라이드 (사용 계약)

```tsx
// 조직 루트 레이아웃 — 이 한 줄이 전부여야 한다
<div style={{ "--color-tenant": org.brandColor } as React.CSSProperties}>
```

소비처는 `bg-tenant` 류 유틸만 사용. CTA·포커스·링크에 tenant 사용 금지 (DESIGN §1.3).

---

## 3. Radius

| CSS 변수 | 값 | Tailwind | 컴포넌트 |
|---|---|---|---|
| `--radius-sm` | 6px | `rounded-sm` | chip, 배지 |
| `--radius-md` | 8px | `rounded-md` | **Input, Button** |
| `--radius-lg` | 12px | `rounded-lg` | **Card**, 팝오버 |
| `--radius-xl` | 16px | `rounded-xl` | **Modal**, Sheet |
| `--radius-full` | 999px | `rounded-full` | Avatar, dot — **버튼 금지** |

> shadcn 의 `--radius` 단일 변수 관습 대신 단계별 명시 — 라디우스 위계가 이 시스템의 의도이기 때문 (DESIGN §4.2).

---

## 4. Depth (ring + shadow)

| CSS 변수 | 값 | Tailwind | 용도 |
|---|---|---|---|
| `--shadow-ring` | `0 0 0 1px rgb(var(--ink) / 0.08)` | `shadow-ring` | 경계 단독 |
| `--shadow-sm` | ring + `0 1px 2px rgb(var(--ink)/0.04)` | `shadow-sm` | 인풋, 리스트 (elevation-1) |
| `--shadow-md` | ring + `0 1px 2px …, 0 4px 8px rgb(var(--ink)/0.04)` | `shadow-md` | **카드 (elevation-2)** ⭐ |
| `--shadow-lg` | ring + `0 4px 12px rgb(var(--ink)/0.08)` | `shadow-lg` | 드롭다운 (elevation-3) |
| `--shadow-xl` | ring + `0 12px 32px rgb(var(--ink)/0.12)` | `shadow-xl` | 모달 (elevation-4) |

> 경계가 필요한 곳에 `border` 유틸 대신 `shadow-ring` — layout shift 0 (DESIGN §4.3). 예외: 테이블 내부 행 구분선.

---

## 5. Typography

| CSS 변수 | 값 |
|---|---|
| `--font-sans` | `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif` |
| `--font-mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` |

전역 base (`@layer base`):

```css
body {
  font-family: var(--font-sans);
  font-size: 14px;            /* DESIGN §3.1 body ⭐ */
  font-weight: 500;
  line-height: 1.5;
  letter-spacing: -0.1px;
  word-break: keep-all;        /* 필수 — DESIGN §3.3 */
}
.tnum, table td[data-numeric] {
  font-variant-numeric: tabular-nums;
}
input, textarea, select { font-size: 16px; }   /* iOS 줌 방지 — DESIGN §5.2 */
```

---

## 6. shadcn 컴포넌트 오버라이드 (spec-x-ui-tokens 작업 목록)

| 컴포넌트 | 오버라이드 |
|---|---|
| `button.tsx` | radius 8 고정 (`rounded-md`), size 표 §DESIGN 5.1, `rounded-full` variant 제거 |
| `input.tsx` | `h-9`(36px) + `text-base`(16px) + `shadow-ring` (border 클래스 제거) |
| `card.tsx` | `rounded-lg shadow-md` + padding 24px |
| `dialog.tsx` | `rounded-xl shadow-xl`, overlay `bg-[rgb(var(--ink)/0.4)]` (blur 제거) |
| `table.tsx` | 행 40px, 헤더 `text-xs text-muted-foreground`, 숫자 셀 `text-right tnum` |
| `badge.tsx` | §DESIGN 5.7 상태 조합 variant 추가 |
| `sonner`(toast) | 우측 하단, 좌측 3px 상태 바 |

---

## 7. 금지 목록 (구현 시)

- 새 회색 hex 추가 (`--ink` opacity 파생만)
- `--radius` 단일 변수로 회귀
- shadcn 기본 `border` 유지한 채 shadow 만 추가 (이중 경계)
- `@theme` (inline 아닌) 사용 — 테넌트 슬롯이 죽는다
