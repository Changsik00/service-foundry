# service-foundry — Design Language

> **정본**: 디자인의 "무엇"과 "왜"는 이 문서가 단일 출처.
> 토큰 구현 매핑 → [TOKEN.md](./TOKEN.md) / 스택 패턴 → [../frontend/FRONT.md](../frontend/FRONT.md) / 앱 구조 → [../frontend/ARCHITECTURE.md](../frontend/ARCHITECTURE.md)
> 대상 앱: `apps/web` — 멀티테넌트 SaaS 콘솔 (어드민 성격, ADR-0025). 도메인 중립.
>
> **계보**: 미학 = Notion-warm light 단일. 방법론 = 합성 — 3-tier 토큰·Anti-AI Guardrails(next-academy 골격), opacity-driven grayscale(Lovable), ring-shadow border(Cal.com·Vercel), 테넌트 슬롯(HashiCorp), Audit Checklist(PlayStation). 미학을 섞지 않는 이유: 미학은 배타적이다 — 섞으면 정체성이 죽는다.

---

## 목차

0. [Quick Reference — 에이전트 필수](#0-quick-reference)
1. [토큰 아키텍처](#1-토큰-아키텍처)
2. [컬러](#2-컬러)
3. [타이포그래피](#3-타이포그래피)
4. [스페이싱 · 라디우스 · 깊이](#4-스페이싱--라디우스--깊이)
5. [컴포넌트](#5-컴포넌트)
6. [Auth 화면 스펙](#6-auth-화면-스펙)
7. [Anti-AI Guardrails](#7-anti-ai-guardrails)
8. [Audit Checklist — 생성 후 자가검증](#8-audit-checklist)
9. [Voice & Tone](#9-voice--tone)
10. [Agent Prompt Guide](#10-agent-prompt-guide)

---

## 0. Quick Reference

> 전체를 읽을 시간이 없으면 이 섹션만으로 작업한다.

```
Ink(유일한 회색 hue): #1c1c1c — 모든 회색은 이것의 opacity
  text:    100% primary / 70% secondary / 50% tertiary / 35% disabled
  border:  8% default / 12% strong (ring-shadow 로, CSS border 아님)
Canvas:    page=#ffffff, sidebar·보조면=#f6f5f4 (warm gray)
Brand:     #2383e2 (기능적 블루 — CTA·포커스·링크·선택 상태에만)
  hover=#1b6fc7 / active=#155a9e / soft bg=rgba(35,131,226,0.08)
Tenant:    --color-tenant (기본값=brand, 테넌트별 오버라이드 슬롯)
Status:    success=#18794e / warning=#b45309 / error=#b3261e (전부 텍스트 AA)
Radius:    input 8 / card 12 / modal 16 / pill 999 — 위계는 의도
Depth:     ring(0 0 0 1px ink8%) + 낮은 그림자. dramatic shadow 금지
Font:      Pretendard. UI 기본 14px/500/LH 1.5/LS -0.1px
숫자:       tabular-nums 전수 / 통화 풀표기 ₩1,200,000
한글:       word-break: keep-all 전역
금지:       이모지 / 감탄사 / 그라디언트 배경 / Primary 버튼 화면당 2개+
```

---

## 1. 토큰 아키텍처

### 1.1 3-tier

```
Primitive  →  Semantic  →  Component
  (값)         (의미)        (사용처)
```

| 단계 | 역할 | 예시 |
|---|---|---|
| Primitive | 원시값. **코드에서 직접 사용 금지** | `ink = #1c1c1c`, `blue-600 = #2383e2` |
| Semantic | 의미 부여. 작업의 기본 참조 단위 | `--color-text-secondary`, `--color-border` |
| Component | 컴포넌트 전용 분기 | `--color-button-primary-hover` |

- 참조 방향: Component → Semantic → Primitive. 역방향·건너뛰기 금지.
- 하드코딩 hex 금지. 예외는 §2.6 소셜 로그인 브랜드 컬러뿐.

### 1.2 opacity-driven — 이 시스템의 1번 규칙

회색 hex 를 늘리지 않는다. **회색은 `#1c1c1c` 하나**고, 단계는 opacity 로만 만든다.

```css
--ink: 28 28 28;                                  /* #1c1c1c, RGB 채널 */
--color-text-primary:   rgb(var(--ink) / 1);
--color-text-secondary: rgb(var(--ink) / 0.7);
--color-text-tertiary:  rgb(var(--ink) / 0.5);
--color-text-disabled:  rgb(var(--ink) / 0.35);
--color-border:         rgb(var(--ink) / 0.08);
--color-border-strong:  rgb(var(--ink) / 0.12);
--color-overlay:        rgb(var(--ink) / 0.4);    /* 모달 backdrop */
```

**왜**: 토큰 수가 줄면 AI 가 틀릴 표면이 줄고, 어떤 배경 위에서도 회색조가 자동으로 조화된다. `#8a8a8a` 같은 임의 회색이 PR 에 등장하면 그것 자체가 위반이다.

### 1.3 테넌트 브랜딩 슬롯

멀티테넌트 콘솔의 테넌트 식별 색은 **단 하나의 semantic 슬롯**으로 수용한다.

```css
--color-tenant: var(--color-brand);   /* 기본값 = brand. 런타임에 테넌트별 오버라이드 */
```

- 사용처 (한정): 조직 아바타 배경, active 테넌트 인디케이터, 테넌트 전환 메뉴의 점 표시.
- **CTA·포커스·링크에는 절대 사용 금지** — 행동 신호는 항상 brand. 테넌트 색은 식별 신호다.
- 오버라이드는 org 설정값 → 루트 인라인 스타일 한 줄(`style="--color-tenant: #b54708"`)로 끝나야 한다.

---

## 2. 컬러

### 2.1 Canvas & Surface

| Semantic | 값 | 용도 |
|---|---|---|
| `surface-page` | `#ffffff` | 메인 콘텐츠 캔버스. 순백 유지 — 회색·크림 배경 금지 |
| `surface-sunken` | `#f6f5f4` | 사이드바, 보조 패널, filled input. **warm gray — 차가운 `#f5f5f5` 아님** |
| `surface-card` | `#ffffff` | 카드·모달·팝오버 (깊이는 §4.3 ring+shadow 로) |
| `surface-hover` | `rgb(var(--ink) / 0.04)` | 리스트 행·메뉴 항목 hover |
| `surface-selected` | `rgb(var(--ink) / 0.06)` | 선택된 행·active 메뉴 |

**구성 원리**: 흰 캔버스 위 콘텐츠가 주인공. 사이드바만 `#f6f5f4` 로 한 톤 가라앉혀 영역을 정의한다 — next-academy 의 진검정 사이드바는 채택하지 않는다 (warm light 와 충돌).

### 2.2 Text (opacity 단계 — §1.2)

| Semantic | 값 | 용도 |
|---|---|---|
| `text-primary` | ink 100% | 본문, 헤딩, 테이블 데이터 |
| `text-secondary` | ink 70% | 보조 설명, 필드 라벨 |
| `text-tertiary` | ink 50% | placeholder, 메타데이터, 테이블 헤더 |
| `text-disabled` | ink 35% | 비활성 컨트롤 전용 |
| `text-inverse` | `#ffffff` | 컬러 배경 위 (Primary 버튼 등) |

### 2.3 Brand — 기능적 블루

블루는 **행동이 필요한 자리에만**. 장식·분위기 사용 금지. 본문 텍스트는 절대 블루가 아니다.

| Semantic | 값 | 용도 |
|---|---|---|
| `brand` | `#2383e2` | Primary CTA, 포커스 링, 링크, 체크박스 ON, active 탭 |
| `brand-hover` | `#1b6fc7` | 버튼·링크 hover (어두워짐) |
| `brand-active` | `#155a9e` | 프레스 |
| `brand-soft` | `rgba(35,131,226,0.08)` | 선택 chip 배경, soft 강조 |

### 2.4 Status — 상태가 있을 때만

장식·강조용 사용 금지. 색 단독으로 의미 전달 금지 (아이콘/텍스트 병행).

| 상태 | 아이콘·보더 | 배경 | 텍스트 (WCAG AA) |
|---|---|---|---|
| Success | `#18794e` | `#e9f5ee` | `#18794e` |
| Warning | `#d97706` | `#fbf0e0` | `#b45309` |
| Error | `#d44c47` | `#fbecea` | `#b3261e` |
| Info | `#2383e2` | `rgba(35,131,226,0.08)` | `#155a9e` |

> 에러 **텍스트**는 `#b3261e`. `#d44c47` 은 보더·아이콘 전용 (흰 배경 텍스트 대비 AA 미달).

### 2.5 차트

블루 family 안에서 톤만 다르게: `#2383e2` → `#7eb3ec` → `#c4dcf6`. 빨강·초록·노랑 시리즈 혼합 금지 — 상태 컬러는 차트 장식이 아니다.

### 2.6 소셜 로그인 브랜드 컬러 (하드코딩 허용 유일 예외)

| 서비스 | BG | 텍스트 | 비고 |
|---|---|---|---|
| Google | `#ffffff` | ink 100% | + border ring |
| GitHub | `#1c1c1c` | `#ffffff` | |
| 카카오 | `#FEE500` | ink 100% | |
| Apple | `#000000` | `#ffffff` | |

공통: height 44px, radius 8px, 전체 너비.

---

## 3. 타이포그래피

**Font**: Pretendard
**폴백**: `"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif`
가중치별 변형명(`Pretendard-Bold`) 사용 금지 — `font-weight` 로만 제어.

### 3.1 Type Scale

| 스타일 | Size/Weight | LH | LS | 용도 |
|---|---|---|---|---|
| `display` | 28px/600 | 1.3 | -0.6px | 페이지 타이틀 (auth 카드 제목 포함) |
| `heading-1` | 20px/600 | 1.35 | -0.4px | 섹션 헤딩 |
| `heading-2` | 16px/600 | 1.4 | -0.2px | 카드 헤딩, 그룹 제목 |
| **`body`** ⭐ | **14px/500** | **1.5** | **-0.1px** | **콘솔 UI 기본** (메뉴·셀·라벨·버튼) |
| `body-reading` | 16px/400 | 1.6 | -0.1px | 긴 설명문, 도움말 본문 |
| `caption` | 12px/500 | 1.4 | 0 | 타임스탬프, 배지, 헬퍼 텍스트 |

- **12px 미만 금지.**
- **폼 인풋 텍스트는 16px** — iOS 자동 줌 방지 (UI 기본 14px 의 명시적 예외).
- 한글 LS 는 -0.6px 이 하한. 라틴식 aggressive tracking(-2px+)은 한글 자모가 겹친다.

### 3.2 숫자 — tabular-nums 전수

```css
font-variant-numeric: tabular-nums;
```

적용: 모든 금액·수치 컬럼·날짜(2026.06.10)·카운트(MM:SS)·차트 축. 통화는 풀표기 `₩1,200,000` — `₩1.2M` 축약 금지. 변동률은 `▲ 12%`(success) / `▼ 3%`(error text) — 색 + 화살표 병행.

### 3.3 한글 줄바꿈

```css
word-break: keep-all;   /* 전역 적용 — 단어 중간 끊김 방지 */
```

---

## 4. 스페이싱 · 라디우스 · 깊이

### 4.1 스페이싱 — 4px 그리드

| 토큰 | px | 용도 |
|---|---|---|
| `space-1` | 4 | 아이콘-텍스트 갭 |
| `space-2` | 8 | 라벨↔인풋, 인라인 요소 간 |
| `space-3` | 12 | 컴팩트 패딩, chip |
| `space-4` | 16 | 기본 패딩, 폼 필드 간 세로 갭 |
| `space-6` | 24 | 카드 패딩, 인풋 그룹↔CTA |
| `space-8` | 32 | 페이지 좌우 패딩 |
| `space-12` | 48 | 섹션 분리 |
| `space-16` | 64 | 대섹션 분리 |

폼 내부: 라벨↔인풋 8 / 인풋↔헬퍼 6 / 필드 간 16 / 필드 그룹↔CTA 24.

### 4.2 라디우스 — 위계는 의도

| 토큰 | 값 | 컴포넌트 |
|---|---|---|
| `radius-sm` | 6px | chip, 배지, 인라인 코드 |
| `radius-md` | 8px | **Input, Button** |
| `radius-lg` | 12px | **Card**, 팝오버 |
| `radius-xl` | 16px | **Modal**, Sheet |
| `radius-full` | 999px | Avatar, pill 배지, status dot |

모두 같으면 위계가 죽는다. 버튼은 8px — **pill CTA 는 이 시스템에 없다** (Notion-warm 의 조용한 톤 유지).

### 4.3 깊이 — ring + 낮은 그림자

경계는 CSS border 가 아니라 **ring-shadow** 로 — 두께 변화에도 layout shift 0.

```css
--ring:        0 0 0 1px rgb(var(--ink) / 0.08);
--elevation-1: var(--ring), 0 1px 2px rgb(var(--ink) / 0.04);             /* 인풋, 리스트 */
--elevation-2: var(--ring), 0 1px 2px rgb(var(--ink) / 0.04),
               0 4px 8px rgb(var(--ink) / 0.04);                           /* 카드 기본 ⭐ */
--elevation-3: var(--ring), 0 4px 12px rgb(var(--ink) / 0.08);             /* 드롭다운, hover 카드 */
--elevation-4: var(--ring), 0 12px 32px rgb(var(--ink) / 0.12);            /* 모달 */
```

- 메타포: "책상 위에 놓인 종이". `0 20px 60px rgba(0,0,0,0.3)` 류 dramatic shadow 금지.
- 카드 hover: elevation-2 → 3, `translateY(-1px)` 최대. -2px 이상 금지.
- 모달 backdrop: `rgb(var(--ink) / 0.4)` — blur 없음 (warm light 에선 blur 가 탁해 보임).

### 4.4 모션

| 동작 | Duration / Easing | 비고 |
|---|---|---|
| hover 색 변화 | 100ms ease-out | 색만. scale 변화 금지 |
| 드롭다운·팝오버 | 150ms ease-out | opacity + 4px slide |
| 모달 진입/퇴장 | 200ms ease-out / 150ms ease-in | opacity + scale 0.98→1 |
| Toast | 200ms ease-out | 하단에서 슬라이드 업 |

바운스·오버슈트 easing 금지. 전체 화면 로딩 금지 — 데이터 영역만 Skeleton (200ms 페이드).

### 4.5 접근성 하한

| 항목 | 기준 |
|---|---|
| 터치/클릭 타깃 | ≥ 36×36px (데스크탑) / ≥ 44×44px (모바일). 시각 크기 < 타깃이면 padding 으로 확보 |
| 텍스트 대비 | ≥ 4.5:1 (AA). §2 의 텍스트 토큰은 전부 충족 |
| 포커스 | `:focus-visible { box-shadow: 0 0 0 2px var(--color-brand); }` — `outline: none` 단독 금지 |
| 색 단독 의미 전달 | 금지 — 아이콘·텍스트 병행 |

---

## 5. 컴포넌트

### 5.1 Button

| Size | Height | Pad-X | Font |
|---|---|---|---|
| sm | 28px | 10px | 13px/500 |
| **md** ⭐ | **36px** | **14px** | **14px/500** |
| lg | 44px | 16px | 14px/600 (auth CTA 전용) |

| Variant | 스펙 | hover |
|---|---|---|
| **Primary** | bg `brand`, text inverse, radius 8 | `brand-hover` (어두워짐) |
| Secondary | bg `#ffffff`, text primary, ring | bg `surface-hover` |
| Ghost | 투명, text secondary | bg `surface-hover`, text primary |
| Destructive | bg `#d44c47`, text inverse | `#b3261e` |

- **한 화면 Primary 1개.** Destructive 와 Primary 는 같은 모달에 공존 금지 (Destructive + Ghost 취소 조합).
- 텍스트 중앙 정렬. Loading 시 spinner + 텍스트 유지 (텍스트 사라지지 않음).
- icon-only 버튼은 `aria-label` 필수.

### 5.2 Input

| 속성 | 값 |
|---|---|
| Height | 36px (콘솔) / 44px (auth 화면) |
| Radius / 경계 | 8px / ring (CSS border 금지 — §4.3) |
| Font | **16px**/400 (iOS 줌 방지) |
| Padding-X | 12px |
| BG | `#ffffff` (filled 변형: `#f6f5f4`) |
| Focus | `box-shadow: var(--ring), 0 0 0 2px var(--color-brand)` |
| Error | ring 을 `#d44c47` 1.5px 로, 헬퍼 텍스트 `#b3261e` 12px (인풋 아래 6px) |

라벨: 14px/500 text-secondary, 인풋 위 8px. placeholder 는 라벨 대체가 아니다 — 라벨 항상 표시.

### 5.3 Card

| 속성 | 값 |
|---|---|
| BG / Radius / Depth | `#ffffff` / 12px / elevation-2 |
| Padding | 24px (기본) / 16px (compact) |
| Interactive hover | elevation-3 + translateY(-1px), 100ms |

데이터 없으면 비워둔다 — Quick Stats 류 filler 카드 자동 생성 금지.

### 5.4 Table

| 속성 | 값 |
|---|---|
| 행 높이 | 40px (기본) / 32px (compact) |
| 헤더 | 12px/500 text-tertiary, 대문자 변환 금지 |
| 셀 | 14px/500 text-primary |
| 구분선 | 행 사이 ink 8% 1px (ring 아닌 border-bottom 허용 — 테이블 내부만) |
| 정렬 | 텍스트 좌 / **숫자·날짜 우 + tabular-nums (필수)** / 상태 배지 좌 / 행 액션 우 |
| 행 hover | `surface-hover` |

### 5.5 Modal

| 속성 | 값 |
|---|---|
| 너비 | 400px (confirm) / 560px (폼) / 720px (대형) |
| Radius / Depth | 16px / elevation-4 |
| Backdrop | ink 40% |
| 내부 폼 | 수직 단일 컬럼 |
| 닫기 | 상단 X **또는** 하단 취소 중 하나만 |

2단 모달 금지 (모달이 모달을 부르지 않는다). 되돌릴 수 없는 작업만 confirm 모달.

### 5.6 Toast

위치 우측 하단. bg `#ffffff`, radius 8, elevation-3, 좌측 3px 상태 바. auto-dismiss 4초(info)/6초(error). 완료 사실만 통지 — "비밀번호가 변경되었습니다". 축하·이모지 금지.

### 5.7 Badge / Status

- Badge: height 20px, pad 2px 8px, radius 999, 12px/500. §2.4 상태 배경+텍스트 조합.
- Status dot: 8×8 정원 + **텍스트 라벨 병행 필수**.

### 5.8 Sidebar (콘솔 골격)

```
┌──────────────┬──────────────────────────────┐
│ #f6f5f4      │  #ffffff                     │
│ 240px 고정   │  콘텐츠 max-width 1200px      │
│              │  페이지 패딩 32px             │
│ 테넌트 스위처 │                              │
│ 메뉴 (14px)  │                              │
│ 하단: 유저    │                              │
└──────────────┴──────────────────────────────┘
```

- 메뉴 항목: 32px 높이, radius 6, text-secondary → active 시 `surface-selected` + text-primary. **active 에 blue 사용 금지** — 사이드바는 무채색, blue 는 행동 신호로 아껴둔다.
- 테넌트 스위처: 상단 고정. 아바타(`--color-tenant` bg) + 조직명 + chevron. 클릭 → 드롭다운(조직 목록 + "새 조직 만들기").

---

## 6. Auth 화면 스펙

> spec-x-auth-screens 의 구현 기준. 4개 화면 모두 같은 골격.

### 6.0 공통 골격

```
canvas: #f6f5f4 전체 화면
카드:   400px, #ffffff, radius 12, elevation-2, padding 32px
로고:   카드 위 중앙, 카드와 24px 간격
구성:   display(28px) 제목 → body-reading 부제(선택) → 폼 → CTA(lg 44px, 전체 너비)
        → 보조 링크(14px, brand)
```

### 6.1 로그인 `/login`

```
제목: "로그인"
필드: 이메일 (type=email, autocomplete=email)
      비밀번호 (type=password, autocomplete=current-password, 우측 표시 토글)
CTA:  "로그인" (Primary lg)
보조: "비밀번호를 잊으셨나요?" (우측 정렬, 비밀번호 라벨 행)
      구분선 "또는" → 소셜 로그인 (§2.6, 세로 스택 8px 갭)
      하단: "계정이 없으신가요? 회원가입" (카드 밖, text-secondary + brand 링크)
에러: 401 → 비밀번호 필드 아래 인라인 "이메일 또는 비밀번호가 올바르지 않습니다"
      (어느 쪽이 틀렸는지 노출 금지 — enumeration-safe)
```

### 6.2 회원가입 `/signup`

```
필드: 이름 / 이메일 / 비밀번호 (8자+, 규칙은 헬퍼 텍스트로 사전 고지 — 입력 후 깜짝 에러 금지)
CTA:  "계정 만들기"
409:  이메일 필드 인라인 "이미 사용 중인 이메일입니다"
성공: 개인 워크스페이스 자동 생성(ADR-0022) → 콘솔 직행. 중간 환영 화면 없음
```

### 6.3 테넌트 선택 `/orgs`

복수 조직 보유 시에만 경유 (단일 조직 = 자동 진입).

```
카드 내 조직 리스트: 행 48px — 아바타(32px, --color-tenant bg) + 조직명 + 역할 배지(caption)
hover: surface-hover / 클릭: active_org 전환 → 콘솔
하단: Ghost "새 조직 만들기"
```

### 6.4 초대 수락 `/invite/[token]`

```
부제: "{조직명}에 {역할}로 초대되었습니다"
로그인 상태:   CTA "초대 수락" → 멤버십 생성 → 해당 org 콘솔
비로그인:      "로그인하고 수락" + "계정 만들고 수락" (후자가 Primary)
만료/무효 토큰: 카드 내 에러 상태 — "초대가 만료되었습니다. 초대한 분께 다시 요청해주세요"
              (일러스트 없음, 텍스트만)
```

---

## 7. Anti-AI Guardrails

> AI 가 관성적으로 생성하지만 이 시스템에선 위반인 패턴. **모든 생성물에서 체크.**

| # | 금지 | 이유 |
|---|---|---|
| 1 | 임의 회색 hex (`#888`, `#f0f0f0`...) | 회색은 ink opacity 로만 (§1.2) |
| 2 | CSS `border` 로 경계 (테이블 내부 제외) | ring-shadow 가 정본 (§4.3) |
| 3 | filler 카드·통계 자동 추가 | 데이터 없으면 비워둠 |
| 4 | 그라디언트 배경·텍스트 | 캔버스는 순백, 장식 금지 |
| 5 | 이모지·감탄사 (😊 / 앗! / 환영합니다!) | 콘솔 톤 위반 (§9) |
| 6 | Primary 버튼 화면당 2개+ | 행동 우선순위 모호 |
| 7 | pill CTA (`rounded-full` 버튼) | 버튼 radius 는 8px (§4.2) |
| 8 | 사이드바 active 에 blue | 사이드바는 무채색 (§5.8) |
| 9 | hover `translateY(-2px)` 이상 / scale 변화 | 떠다니는 카드 금지 |
| 10 | dramatic shadow | "놓인 종이" 메타포 (§4.3) |
| 11 | 통화 축약 (₩1.2M) | 풀표기 (§3.2) |
| 12 | 2단 모달 | 인지 부담 (§5.5) |
| 13 | empty state 일러스트 | 텍스트만으로 충분 |
| 14 | 전체 화면 로딩 | 데이터 영역 Skeleton 만 |
| 15 | 본문 텍스트에 blue | blue 는 행동 신호 (§2.3) |
| 16 | shadcn 컴포넌트에 aria/role 중복 추가 | Radix 가 이미 처리 — 이중 aria 는 해악 (FRONT.md §a11y) |

| # | 필수 |
|---|---|
| 1 | 모든 숫자 tabular-nums |
| 2 | word-break: keep-all 전역 |
| 3 | 에러 메시지 = 사실 + 다음 행동 (+ 형식 예시) |
| 4 | 상태 = 색 + 아이콘/텍스트 병행 |
| 5 | icon-only 버튼 aria-label |
| 6 | 폼 인풋 16px (iOS 줌 방지) |

---

## 8. Audit Checklist

> 화면 생성·수정 직후 에이전트가 스스로 7개를 점검하고, 위반이 있으면 보고 전에 고친다.

1. **회색 감사** — 생성물에 ink-opacity 외의 회색 hex 가 있는가?
2. **블루 감사** — blue 가 행동 신호(CTA·포커스·링크·선택) 밖에서 쓰였는가? 화면에 Primary 가 2개인가?
3. **경계 감사** — ring 대신 CSS border 를 쓴 곳이 있는가? (테이블 내부 제외)
4. **라디우스 감사** — input 8 / card 12 / modal 16 위계가 지켜졌는가? pill 버튼이 생겼는가?
5. **숫자·한글 감사** — tabular-nums 누락 컬럼, keep-all 누락 컨테이너, 통화 축약이 있는가?
6. **톤 감사** — 이모지·감탄사·축하 문구·일러스트 empty state 가 있는가?
7. **a11y 감사** — icon-only 버튼 aria-label, DialogTitle, focus-visible 스타일이 빠졌는가? 중복 aria 를 더했는가?

---

## 9. Voice & Tone

**조용한 안내자. 친구·코치·치어리더 아님.** 사실과 다음 행동만.

| 상황 | ❌ | ✅ |
|---|---|---|
| 완료 | "축하합니다! 🎉" | "조직이 생성되었습니다" |
| 환영 | "환영합니다, OO님!" | (헤더 없음 또는) "안녕하세요" |
| CTA | "확인" / "다음" | "로그인" / "초대 수락" / "결제하기" — 동사형 |
| 에러(형식) | "올바르지 않습니다!" | "올바른 이메일 형식을 입력해주세요 (예: user@example.com)" |
| 에러(서버) | "앗! 문제가 발생했어요 😢" | "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요" |
| 빈 상태 | 일러스트 + "텅 비었어요!" | "아직 표시할 멤버가 없습니다" + (가능하면) "멤버 초대" 액션 |

금지어: `환영합니다!` `축하합니다!` `~해보세요!` `지금 바로` 및 모든 이모지.

---

## 10. Agent Prompt Guide

> 화면 요청 시 이 형식의 프롬프트면 본 문서 수치만으로 결정론적 구현이 가능하다.

**로그인 화면**
> "#f6f5f4 캔버스 중앙에 400px 카드(radius 12, elevation-2, padding 32). display 28px '로그인', 이메일+비밀번호 인풋(h 44, radius 8, ring, font 16px), Primary lg CTA '로그인' 전체 너비. 401 은 비밀번호 아래 인라인 #b3261e. 소셜 로그인 §2.6."

**멤버 테이블**
> "카드(radius 12, elevation-2) 안 테이블: 행 40px, 헤더 12px text-tertiary, 셀 14px. 이름 좌 / 가입일 우+tabular-nums / 역할 배지(§5.7). 행 hover surface-hover. 데이터 0건이면 '아직 표시할 멤버가 없습니다' + '멤버 초대' Ghost 버튼."

**테넌트 스위처**
> "사이드바 상단: 아바타 32px(bg --color-tenant) + 조직명 14px/500 + chevron. 클릭 → elevation-3 드롭다운, 조직 행 48px(아바타+이름+역할 caption), 하단 Ghost '새 조직 만들기'. active 조직에 좌측 2px brand 인디케이터."

**확인 모달**
> "400px 모달(radius 16, elevation-4, backdrop ink 40%). heading-1 제목 + body-reading 설명 + Destructive '삭제' + Ghost '취소'. X 버튼 없음(하단 취소가 닫기). 진입 200ms ease-out scale 0.98→1."
