# Walkthrough: spec-x-ui-tokens

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 토큰 위치 | tailwind-config (기존) / frontend-ui | **frontend-ui/src/styles.css 자급** | 디자인 토큰은 design system 소유물 — config 카테고리는 도구 preset (ADR-0003 의미론). tailwind-config 는 범용 shadcn preset 으로 잔존 |
| 오버라이드 범위 | TOKEN.md §6 전체 7종 / 현존만 | **현존 6종만** (button/input/card/label/form/toaster) | fill-forward (TOKEN.md §8) — dialog/table/badge 는 미존재, 선제 생성 = filler |
| 포커스 링 | 컴포넌트별 ring 클래스 | **전역 `:focus-visible` 1곳** | 중복 ring 충돌 방지, DESIGN §4.5 단일 규칙 |
| 다크모드 | 기존 .dark 블록 이식 | **미정의 (제거)** | DESIGN.md 가 다크 값을 정의하지 않음 — 추측 값 금지. ThemeToggle 은 시각적 no-op (후속 spec) |
| Destructive hover | 새 component 토큰 | **기존 `--color-error-text`(#b3261e) 재사용** | DESIGN §5.1 hover 값 = error-text 와 동일 — 새 토큰 불필요 (파생 우선) |

## 🧪 검증 결과 (증거)

```
pnpm turbo lint typecheck build test (api 제외)   137/137 PASS
pnpm turbo lint typecheck build (api)             29/29 PASS
pnpm knip                                          exit 0 (tailwind-config ignore 정리 포함)
pnpm depcruise                                     ✔ no violations (442 modules)
pnpm --filter @apps/web test:e2e                   7/7 PASS (full-stack, 새 토큰 렌더 회귀 확인)
```

> e2e 1차 실패: Turbopack "Next.js package not found" panic — pnpm install(dep 제거) 이전에 뜬
> dev 서버를 reuseExistingServer 가 재사용하며 깨진 모듈 그래프 참조. 서버 kill + `.next` 클리어로
> 해소 (코드 문제 아님). **교훈: dep 변경 후 e2e 는 dev 서버 재기동 필수.**

## 📦 변경 요약

- `frontend-ui/src/styles.css` — 전면 재작성: `:root --ink` 채널 + `--color-tenant` 슬롯, `@theme inline` (shadcn 매핑 + 전용 토큰 + radius 6/8/12/16 + ring 그림자 5종 + Pretendard), base(14px/500·keep-all·input 16px·전역 focus-visible), `.tnum` 유틸
- `button.tsx` — variants 재정의 (Primary hover 어두워짐 / Secondary=흰배경+ring / Destructive), sizes 28/36/44, outline variant 제거 (Secondary 로 통합)
- `input.tsx` — border 제거 → `shadow-ring`, `text-base`(16px), `aria-invalid` 에러 ring
- `card.tsx` — `rounded-lg shadow-md` (radius 12 + elevation-2), border 제거
- `toaster.tsx` — bottom-right (DESIGN §5.6)
- dep 정리: frontend-ui·apps/web 의 `@repo/tailwind-config` 의존 제거 + knip ignore 정리

## 📦 Commits

1. feat: 디자인 토큰 스타일시트 (token.md 구현)
2. feat: shadcn 컴포넌트 디자인 시스템 오버라이드
3. docs: ship walkthrough and pr description
