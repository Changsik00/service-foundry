# Implementation Plan: spec-x-web-consolidation

## 📋 Branch Strategy

- 브랜치: `spec-x-web-consolidation` (생성 완료, base: `main`)

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [x] "Next+Vite 둘 다" 확정 스택 결정 번복 — 2026-06-10 대화에서 dennis 승인 ("web 은 그냥 1개면 되지 않을까 함", "진행하자")
> - [x] framework-agnostic 검증을 살아있는 앱 대신 depcruise 정적 룰로 대체

> [!WARNING]
> - [x] `dev:web-vite` 스크립트를 참조하는 외부 도구/습관이 있다면 삭제 후 동작 안 함 (root package.json 정리 포함)

## 🎯 핵심 전략 (Core Strategy)

### 주요 결정

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| **가드 대체** | depcruise `frontend-no-next-imports` 룰 (error) | web-vite의 검증 범위(3개 패키지)보다 정적 룰이 전 패키지를 커버하고 유지 비용 0 |
| **룰 위치** | `packages/config/depcruise-config/base.cjs` | 루트 `.dependency-cruiser.cjs`가 base 프리셋을 그대로 소비 — 기존 ADR-0015 룰들과 같은 자리 |
| **룰 검증** | 임시 위반 코드로 룰 발화 확인 후 제거 (수동 Red→Green) | config 룰은 단위 테스트 부재 — "추가했는데 안 잡는" 침묵 실패 방지 |
| **이력 문서** | 불변 유지, 기존 ADR 3건에만 참조 노트 1줄 | ADR 은 point-in-time 기록 — 번복은 새 ADR(0025)이 담당 |
| **삭제 순서** | 가드 먼저 → 삭제 나중 | 가드 없는 공백 구간 제거 |

### 📑 ADR 후보

- [x] `frontend-app-consolidation` (type: decision) — 본 spec Task 1 에서 ADR-0025 로 작성

## 📂 Proposed Changes

### Task 1 — ADR-0025

#### [NEW] `docs/adr/0025-frontend-app-consolidation.md`
결정: frontend 데모/검증 앱을 web-next 단일로 통합. 컨텍스트(검증 실효성·이중 유지 비용), 번복 대상(ADR-0004/0006/0021 의 web-vite 전제), 대체 가드(depcruise), 트레이드오프(Vite 소비자 관점 smoke 상실) 기록.

#### [MODIFY] `docs/adr/0004-*.md` / `0006-*.md` / `0021-*.md`
상단에 한 줄 노트: "web-vite 관련 전제는 ADR-0025 로 대체됨".

### Task 2 — depcruise 가드 (Red→Green)

#### [MODIFY] `packages/config/depcruise-config/base.cjs`
```js
{
  name: "frontend-no-next-imports",
  severity: "error",
  comment: "packages/frontend|react/* must stay Next-free — Next adapter goes in packages/next/<name> (ADR-0025).",
  from: { path: "^packages/(frontend|react)/" },
  to: { path: "^node_modules/next(/|$)" },
}
```
검증: 임시로 `packages/frontend/http-client/src`에 `import "next/navigation"` 추가 → `pnpm depcruise` 실패 확인 → 제거 → 그린 확인.

### Task 3 — web-vite 삭제 + 참조 정리

#### [DELETE] `apps/web-vite/` 전체, `docs/reference/apps/web-vite.md`

#### [MODIFY] 현행 참조 9곳
- `README.md` — 앱 표/dev 명령/디렉토리 트리
- `docs/index.md` — web-vite 링크 제거
- `docs/reference/stack.md`, `docs/reference/architecture.md` — 현행 서술 갱신
- `env.sample` — 공통 주석에서 web-vite 제거
- `package.json` — `dev:web-vite` 스크립트 제거
- `packages/config/knip-config/base.json` — `apps/web-vite` workspace 블록 제거
- `packages/config/typescript-config/react-app.json` — display 문자열 갱신
- `ARCHITECTURE.md` — web-vite 언급 갱신
- `apps/web-next/src/{components/health-card-client.tsx, lib/queries.ts}` — "web-vite 패턴 답습" 주석 2곳 재서술
- `docs/explainers/platform/ci-verify-gate.md` — 현행 설명이면 갱신 (구현 시 판단)

`pnpm install` 로 lockfile 재생성.

## 🧪 검증 계획 (Verification Plan)

### 단위 테스트 (필수)
```bash
pnpm install                          # lockfile 정합
pnpm depcruise                        # 가드 그린 (Task 2 에서 Red 선행)
pnpm turbo run lint typecheck test build
pnpm knip                             # web-vite 잔재 미참조 확인
```

### 수동 검증 시나리오
1. Task 2 중간: 임시 위반 import → depcruise **실패** (룰 발화 증명)
2. 전체 그린 후 `grep -rn "web-vite"` — 이력 문서(specs/backlog/ADR본문/review) 외 0건

## 🔁 Rollback Plan

- 단일 브랜치 작업 — PR 미머지 상태에서는 브랜치 폐기로 원복
- 머지 후 문제 시: web-vite 복원은 `git revert` 로 가능 (삭제 commit 단독 revert 가능하도록 Task 3 을 한 commit 에 응집)

## 📦 Deliverables 체크

- [x] task.md 작성
- [x] 사용자 Plan Accept (2026-06-10 대화 — "진행하자")
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
