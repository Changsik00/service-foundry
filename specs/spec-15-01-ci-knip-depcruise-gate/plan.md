# Implementation Plan: spec-15-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-15-01-ci-knip-depcruise-gate` (= spec 디렉토리명)
- 시작 지점: `phase-15-security-wiring` (phase base)
- PR base = `phase-15-security-wiring`

## 🛑 사용자 검토 필요 (User Review Required)

> [!IMPORTANT]
> - [ ] knip 오탐(현재 unused 74 등)은 **config 교정**으로 줄인다 — 코드 삭제가 아니라 entry/project/ignore 정렬 우선.
> - [ ] 의도적 미배선 기능(보일러플레이트 UI/hook)은 **삭제 금지**, knip ignore 에 사유와 함께 등록.
> - [ ] 진짜 dead(audit ⚪)만 제거 대상 — 제거 시 각각 근거 확인.

## 🎯 핵심 전략 (Core Strategy)

### 접근
"config 교정 → 위반 분류 → 진짜 dead 처리 → CI 배선 → 위반 주입 검증" 순. 핵심 난이도는 **오탐과 진짜 위반의 분리** — config 가 워크스페이스(entry: index.ts, test 파일, catalog dep)와 안 맞아 대량 오탐이 나므로, 먼저 config 를 실측에 맞춘다.

### 주요 결정
| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| knip 실행 | root `knip.json`(또는 preset extends) + `pnpm knip` | 단일 진입점, preset 재사용 |
| depcruise 실행 | root `.dependency-cruiser.cjs`(preset require) + `pnpm depcruise` | v17 require 로딩 |
| CI | verify.yml 에 step 추가 (turbo task 경유) | 기존 게이트와 일관 |
| dead 처리 | 진짜 dead 제거 / 의도적 ignore | 보일러플레이트 보존 |
| 점진 | 초기 warn 허용 → 종료 시 error | 위반 많으면 단계적 |

### 📑 ADR 후보
- [x] 없음

## 📂 Proposed Changes
- `[NEW] knip.json` (또는 `knip.config.ts`) — root, `@repo/knip-config` 기반 교정.
- `[NEW] .dependency-cruiser.cjs` — root, `@repo/depcruise-config` require.
- `[MODIFY] package.json` — `knip`, `depcruise` scripts.
- `[MODIFY] turbo.json` — `knip`, `depcruise` tasks.
- `[MODIFY] .github/workflows/verify.yml` — 게이트 step.
- `[MODIFY/DELETE]` audit ⚪ dead exports (확인 후) 또는 knip ignore.
- `[MODIFY] packages/shared/factory/tsconfig.json` — lib 불일치 정리(작으면 동반).

## 🧪 검증 계획 (Verification Plan)

### 게이트 실행 (단위 테스트 대체)
```bash
pnpm knip        # 위반 0 (또는 의도적 ignore 만)
pnpm depcruise   # 경계 위반 0
pnpm turbo run lint typecheck test build  # 회귀 없음
```
### 위반 주입 검증 (통합 시나리오 3)
1. 의도적 unused export 추가 → `pnpm knip` red 확인 → 제거.
2. frontend 에서 backend import 추가 → `pnpm depcruise` red 확인 → 제거.

## 🔁 Rollback Plan
- config/CI 추가가 주라 revert 안전. dead 제거분은 별 커밋이라 선택 revert 가능.

## 📦 Deliverables 체크
- [ ] task.md 작성
- [ ] 사용자 Plan Accept
- [ ] (실행 후) 모든 task 완료
- [ ] (실행 후) walkthrough / pr_description ship
