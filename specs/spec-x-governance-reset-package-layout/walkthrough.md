# Walkthrough: spec-x-governance-reset-package-layout

> phase-bound 아닌 *governance* spec. framework adapter 카테고리 + 명명 룰을 ADR-0015로 명문화. 코드 변경 0. 본 spec ship 후 별도 spec (재구성 spec) 에서 실제 코드 이동.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 어댑터 카테고리 위치 | (A) backend/ 안에 suffix / (B1) backend/ 안에 prefix / (B2) backend/ 안에 prefix + backend- 생략 / (B3) 별 카테고리 (nestjs/) | **B3** | dir-pkg 일관 + NPM 표준 (`@nestjs/config` 패턴) + framework 카테고리로 묶음 |
| 명명 어순 | suffix (`-nestjs`) / prefix (`nestjs-`) | **prefix** | 영문법 (adj+noun: "NestJS logger") + NPM dominant (`@nestjs/config` / `react-query` / `express-session` / `koa-bodyparser`) |
| pure 카테고리 명명 | tier prefix 유지 (`backend-`) / 생략 | **유지** | pure는 framework agnostic → tier 정보가 *명시* 필요 (어디 붙을지 모름) |
| adapter 카테고리 명명 | framework prefix만 (`nestjs-`) / 이중 (`backend-nestjs-`) | **framework prefix만** | framework가 tier 함의 (NestJS=backend / React=frontend) — backend- 중복 |
| 의존 방향 | 양방향 / 어댑터 → pure 단방향 | **단방향** | platform-agnostic 정적 보장 + cycle 방지 |
| ADR 분리 | ADR-0003 갱신만 / ADR-0015 신규 + ADR-0003 갱신 | **둘 다** | ADR-0003은 *기존 룰 절*, ADR-0015는 *framework adapter 결정* — 책임 분리 |
| 기존 박힌 패키지 처리 | 본 spec에서 함께 정정 / 별 spec으로 분리 | **별 spec** | 본 spec scope 최소화. 룰 박는 작업과 코드 변경 작업 분리 |
| depcruise 임시 예외 | 룰 + allowList / 룰만 (위반 인정) | **룰만** | 위반이 *드러나야* 후속 spec 진입 motivation |
| `shared/` 도입 (utils/errors 등 이동) | 본 spec 포함 / 제외 | **제외** | scope 최소화. 별 spec-x 추후 검토 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → 작성됨: `docs/adr/0015-framework-adapter-naming-and-layout.md` (type: convention)

## 💬 사용자 협의

본 spec은 spec-03-02 PR #10 review 시점부터 시작된 *5 round-trip 논의* 의 결과:

- **주제 1 (2026-05-19 시점, spec-03-02 review)**: 사용자 발화 — *"+ NestJS adapter 이건 무슨 의미지? packages 에서는 어느 플렛폼에 붙을지는 몰라.. 따라서 이런 연관성은 배제 해야 해"*. spec-03-01 / spec-03-02 양쪽에서 NestJS 어휘가 `packages/backend/` 안에 박힌 platform-agnostic 위반 catch.
- **주제 2 (1차 해법)**: spec-03-02 안에서 `@repo/backend-logger-nestjs` 어댑터 패키지 분리 → memory `feedback_platform_agnostic_packages` 박음. 사용자 합의 *"A로 진행, spec-03-01 정정도 본 phase 안에서"*.
- **주제 3 (재제기, 본 spec 트리거)**: 사용자 발화 — *"nestjs-logger, nestjs-settings 이렇게 가는게 좀 더 낫지 않을까? 아니면 뭔가 동사 명사 기타등등으로 인해서 어색한가?"*. 영문법 + NPM 컨벤션 재조사 → framework-first prefix가 정답 확인. suffix 패턴 (1차 해법) 은 컨벤션 위반이었음.
- **주제 4 (재정의 결정)**: 사용자 발화 — *"아직 프로젝트 초기이고 룰이 없어서 그랬더라서 지금 재정의 하고 최적의 환경으로 반영하고.. 앞으로 그렇게 할 수 있게 룰정의 해야 함.. 지금까지 한게 아까워서 진행한다면 점점 괴물로 변해 갈거임"*. sunk cost trap 거부 + 룰 명문화 합의.
- **주제 5 (옵션 분기)**: B1/B2/B3 옵션 제시 → B3 채택 (별 카테고리 + framework prefix). 사용자 *"좋아 그러면 지금 바로 진행하면 딜까?"* → 본 spec 진입.

**합의 (최종)**:
- ADR-0015 신규 작성 + ADR-0003 갱신
- 카테고리 `packages/<framework>/<name>` + 명명 `@repo/<framework>-<name>`
- 의존 방향: `<framework>/<X>` → `<tier>/<X>` 단방향
- `shared/` 도입은 본 spec 제외 (별 spec-x 추후)
- 기존 박힌 코드 정정은 후속 spec (재구성 spec)

## 🔁 진행 과정

### T1 — 브랜치 생성

- `phase-03-backend-foundation`에 carry-over 변경 (queue.md auto-update) 있음 → `git stash push backlog/queue.md`
- `git checkout main && git pull --ff-only` (main 최신)
- `git checkout -b spec-x-governance-reset-package-layout`
- `git stash pop` → queue.md 충돌 발생 (main의 `(active phase 없음)` vs phase-03의 `phase-03 — Backend Foundation...`)
- 충돌 resolution: main 버전 유지 (`(active phase 없음)` — phase-03이 main에 머지 안 됨) + specx 섹션은 staged 그대로

### T2 — ADR-0015 신규 작성

- `docs/adr/0015-framework-adapter-naming-and-layout.md` 작성:
  - frontmatter (id: ADR-0015, type: convention, status: accepted, date: 2026-05-19)
  - Context: spec-03-01 / spec-03-02 위반 발견 경위 + 사용자 catch
  - Decision: 카테고리 / 명명 / 의존 방향 / 미래 확장 4절
  - Alternatives: A suffix / B1 / B2 / B3 (채택)
  - Consequences: 장점 + 단점 (기존 패키지 임시 위반 인정)
  - Revisit Triggers: 4 시나리오
- Commit `3049f37` (ADR-0015 + spec-x 문서 4개 + queue.md 진입 갱신)

### T3 — ADR-0003 갱신 + cross-link

- 상단 IMPORTANT note: 2026-05-19 갱신 + ADR-0015 트리거 명시
- §2 카테고리 트리에 `nestjs/` + `react/` 추가 + framework-agnostic NOTE
- §4-bis (신규 절): framework-first prefix 명명 + 카테고리별 네이밍 표 + 의존 방향
- §6 갱신: 카테고리 배치 규칙 + 의사결정 표 + 잠긴 예외에 `backend/logger`의 NestJS 어댑터 위치 명시
- 관련 문서: ADR-0015 + memory `feedback_platform_agnostic_packages` cross-link
- Commit `7c98a5b`

### T4 — ARCHITECTURE.md 갱신

- §3.2 의존성 규칙에 *Framework adapter 룰* 절 추가:
  - `backend/*` / `frontend/*` 는 framework-agnostic
  - `nestjs/*` / `react/*` 는 어댑터 카테고리 — 단방향 의존
  - 의존 방향 표 (허용/금지 매트릭스)
  - 현재 임시 위반 명시 (`@repo/backend-logger-nestjs` + `BackendSettingsModule`)
- §1 (legacy 폴더 구조) / §2 (legacy 패키지 목록) 는 *Phase 3에서 재작성 예정* 으로 이미 표시 — 본 commit은 §3.2만 갱신
- Commit `4999d00`

### T5 — depcruise config 갱신

- `packages/config/depcruise-config/base.cjs` 에 4 forbidden 룰 추가:
  - `backend-no-nestjs-imports` — `backend/* → nestjs/*` 금지
  - `frontend-no-react-adapter-imports` — `frontend/* → react/*` 금지
  - `nestjs-no-frontend-imports` — `nestjs/* → frontend/react/*` 금지
  - `react-no-backend-imports` — `react/* → backend/nestjs/*` 금지
- 룰 syntax 검증: `pnpm exec depcruise --config ... packages/` → **0 violations** (26 modules / 33 deps, main 시점 상태 — `nestjs/` 카테고리 디렉토리 아직 없음)
- Commit `48223dc`

### T6 — memory 2개 갱신 (git 외부)

- `project_boilerplate_package_layout.md`: 카테고리 5 → 7+ (`nestjs/` `react/`) + 카테고리별 dir↔pkg 매핑 표 + framework-first prefix 사유 + Why 절 갱신
- `feedback_platform_agnostic_packages.md`: Naming convention 절 추가 (suffix 금지 / prefix 사용) + 금지 패턴 / 허용 패턴 명시 + ADR-0015 cross-link
- `MEMORY.md` index 2개 entry 갱신 (description 정정)
- **Commit 없음** — memory 디렉토리는 `/Users/dennis/.claude/projects/.../memory/` (git tree 밖)

### T7 — Ship (본 commit)

- 전체 검증:
  - `pnpm lint` ✓ / `pnpm typecheck` ✓ / `pnpm test` ✓
  - `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` → 0 violations
- walkthrough / pr_description 작성
- ship commit + push + PR (base = main)

## 🧪 검증 결과

### 자동화 테스트

본 spec은 *문서/룰만* — 단위 테스트 0. 검증은:

```bash
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
# ✔ no dependency violations found (26 modules, 33 dependencies cruised)
```

main 시점 상태 (phase-03 아직 머지 안 됨) → `nestjs/` 카테고리 디렉토리 없음 → 0 violations 기대대로.

### 수동 검증

1. ADR-0015 작성 — 결정/대안/재검토 기준 모두 명시 ✓
2. ADR-0003 갱신 — 기존 5 카테고리 룰 보존 + framework adapter 절 추가 (역호환) ✓
3. ARCHITECTURE.md §3.2 갱신 — 기존 룰과 일관 ✓
4. depcruise config syntax — `pnpm exec depcruise` 정상 실행 + 0 violations ✓
5. memory 갱신 — `MEMORY.md` index 자동 로드 시 새 description 반영 ✓

## 🔍 발견 사항

1. **sunk cost trap 인지 + 거부**: 사용자가 *"지금까지 한게 아까워서 진행한다면 점점 괴물로 변해 갈거임"* 으로 명시 — *boilerplate 단계의 룰 박기는 후속 비용을 0으로 만드는 투자*. 이미 박힌 spec-03-01 / spec-03-02 코드를 *유지하지 않고 정정*하는 결정이 맞음.
2. **NPM 컨벤션 ↔ 영문법 일관성**: 두 가지 독립 source가 같은 결론 (framework-first prefix) — 컨벤션이 *우연이 아니라 영문법에 기반* 한 것임 확인. suffix 패턴 (`logger-nestjs`) 은 명사+형용사 역어순 = 영어로 어색 = NPM도 피함.
3. **dir-pkg 매핑 일관성 = 인지 비용 절감**: B1/B2/B3 중 B3가 *유일하게 dir-pkg 1:1 매핑 일관*. dir 이름과 pkg 이름이 같으면 grep / IDE 검색 / mental model 모두 단일 — *컨벤션 박는 가치*.
4. **임시 위반 명시 → 후속 spec motivation**: `@repo/backend-logger-nestjs` + `BackendSettingsModule` 은 본 spec ship 후 *위반 상태* (드러내고 둠). depcruise allowList 박지 않은 이유 = 위반이 *통증*으로 보여야 정정 spec 진입 motivation 유지.
5. **5 round-trip 논의 → 1 ADR**: spec-03-02 PR review (1차) → 1차 해법 (suffix 채택) → 사용자 재제기 (2차) → 영문법/NPM 재조사 (3차) → 옵션 분기 (4차) → 합의 (5차). *논의가 ADR을 더 단단하게* — 첫 catch에서 ADR 박았다면 prefix 결정 누락했을 것.
6. **memory ↔ ADR 책임 분리**: memory는 *agent 운영 규칙* (코드 작성 시 즉시 적용), ADR은 *프로젝트 결정 기록* (장기 자산). 본 spec에서 둘 다 갱신 — memory는 *왜 + 어떻게 적용* 강조, ADR은 *결정 + 검토 대안 + 재검토 기준* 강조.

## 🚧 이월 항목

- **재구성 spec (즉시 후속)** → `spec-03-XX-nestjs-adapter-relocation` (또는 유사 슬러그):
  - `packages/backend/logger-nestjs/` → `packages/nestjs/logger/` 이동
  - `@repo/backend-logger-nestjs` → `@repo/nestjs-logger` rename + imports 일괄 grep
  - `packages/backend/settings/` 안 `BackendSettingsModule` / `BACKEND_SETTINGS` 제거 + `packages/nestjs/settings/` 신규
  - `@repo/backend-settings` 의 NestJS dep 제거
- **`shared/` 도입 검토 spec-x** (추후): `packages/utils/` `packages/errors/` 등을 `packages/shared/<name>/` 로 이동할지 결정.
- **frontend 패키지 룰 검증** (phase-04 진입 시): `@repo/frontend-*` pure + `@repo/react-*` 어댑터 패턴이 실전에서도 자연스러운지 확인.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 4 (T2 ADR-0015 / T3 ADR-0003 / T4 ARCHITECTURE / T5 depcruise) + T7 ship docs (본 commit) |
| **memory 갱신** | 2 (`project_boilerplate_package_layout` + `feedback_platform_agnostic_packages`) + MEMORY.md index |
| **이월 spec** | spec-03-XX-nestjs-adapter-relocation (즉시 후속) + spec-x-shared-restructure (추후) |
