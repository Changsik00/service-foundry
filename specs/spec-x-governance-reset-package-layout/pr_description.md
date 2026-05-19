# docs(spec-x): governance reset — framework adapter naming & layout (ADR-0015)

> **phase-bound 아닌 governance spec**. framework adapter 카테고리 + 명명 룰을 ADR-0015로 명문화. 코드 변경 0. 후속 spec (재구성) 에서 실제 코드 이동.

## 📋 Summary

### 배경 및 목적

phase-03 진행 중 두 spec에서 *platform-agnostic 위반* 발견:

1. **spec-03-01 (backend-settings, 머지됨)**: `BackendSettingsModule.forRoot()` + `BACKEND_SETTINGS` symbol + `@nestjs/common` dep을 `packages/backend/settings/` 안에 박음.
2. **spec-03-02 (backend-logger, 머지됨)**: 같은 패턴으로 `PinoLoggerService` + `BackendLoggerModule` 박음. PR #10 review에서 사용자 catch → 1차 해법 `packages/backend/logger-nestjs/` (suffix 패턴) 으로 분리.

사용자 재제기 — *"nestjs-logger, nestjs-settings 이렇게 가는게 좀 더 낫지 않을까?"* — **영문법 (adj+noun) + NPM dominant (`@nestjs/config` / `react-query` / `express-session`) 모두 framework-first prefix가 정답** 확인. 1차 해법 (suffix) 은 컨벤션 위반이었음.

사용자 발화 — *"아직 프로젝트 초기이고 룰이 없어서 그랬더라서 지금 재정의 하고 최적의 환경으로 반영하고.. 앞으로 그렇게 할 수 있게 룰정의 해야 함.. 지금까지 한게 아까워서 진행한다면 점점 괴물로 변해 갈거임"* → sunk cost trap 거부 + 룰 명문화 합의.

본 PR은 **룰만** 박음. 실제 코드 재구성 (이미 머지된 spec-03-01 / spec-03-02 정정) 은 후속 spec (재구성 spec) 에서.

### 주요 변경 사항

- [x] **ADR-0015 신규** (`docs/adr/0015-framework-adapter-naming-and-layout.md`):
  - 카테고리: `packages/<framework>/<name>` (예: `nestjs/`, `react/`, 미래 `fastify/` / `vue/` 등)
  - 명명: `@repo/<framework>-<name>` (framework-first prefix, NPM 표준 패턴)
  - 의존 방향: 어댑터 → pure 단방향
  - 검토한 대안 4개 (A suffix / B1 / B2 / B3) — B3 채택
  - 재검토 기준 (adapter끼리 의존 빈번 / framework dep 2개+ / `shared/` 도입 등)

- [x] **ADR-0003 갱신** (`docs/adr/0003-package-layout-and-naming.md`):
  - §2 카테고리 트리에 `nestjs/` `react/` 추가 + framework-agnostic NOTE
  - §4-bis (신규 절) Framework adapter naming — 카테고리별 dir↔pkg 매핑 표 + 의존 방향
  - §6 카테고리 배치 규칙 갱신 + framework adapter 의사결정 표
  - 관련 문서에 ADR-0015 + memory `feedback_platform_agnostic_packages` cross-link

- [x] **ARCHITECTURE.md §3.2 갱신** — framework adapter 룰 절 추가 + 의존 방향 표 + 현재 임시 위반 명시

- [x] **depcruise config** (`packages/config/depcruise-config/base.cjs`) — 4 forbidden 룰 추가:
  - `backend-no-nestjs-imports` / `frontend-no-react-adapter-imports`
  - `nestjs-no-frontend-imports` / `react-no-backend-imports`

- [x] **memory 2개 갱신** (git 외부):
  - `project_boilerplate_package_layout` — 카테고리 7+ 명문화 + 카테고리별 명명 표
  - `feedback_platform_agnostic_packages` — naming convention 절 추가 (suffix 금지) + 금지/허용 패턴 명시

## 🎯 Key Review Points

1. **🚨 sunk cost trap 거부 — 룰 명문화 결정의 핵심**: 이미 머지된 spec-03-01 / spec-03-02 의 framework-coupled 코드를 *유지하지 않고 정정*. 사용자 발화 *"지금까지 한게 아까워서 진행한다면 점점 괴물로 변해 갈거임"*. boilerplate 단계의 룰 박기는 *후속 모든 spec의 비용을 0으로 만드는 투자*.

2. **명명: framework-first prefix (B3 채택)**: 검토한 4 옵션 중 *영문법 (adj+noun: "NestJS logger") + NPM dominant (`@nestjs/config` / `react-query` / `express-session`) + dir-pkg 일관성* 모두 만족하는 유일 옵션. suffix (1차 해법) 는 영문법 어색 + NPM 비표준이었음.

3. **카테고리: `packages/<framework>/<name>` 별 카테고리**: pure 카테고리 (`backend/` `frontend/`) 와 분리. framework가 *implicit tier* 함의 (NestJS=backend, React=frontend) — 카테고리만으로 tier 추론 가능.

4. **의존 방향 단방향**: depcruise 룰 4개로 *정적 보장* — pure → framework 의존은 *컴파일 시점에 차단*. 후속 spec에서 어댑터 패키지 생성 시 자동 검증.

5. **현재 임시 위반 인정 — depcruise allowList 박지 않음**: `@repo/backend-logger-nestjs` (PR #10 머지) + `@repo/backend-settings`의 `BackendSettingsModule` (PR #9 머지) 는 본 PR 머지 후 *위반 상태*. 위반이 *통증으로 보여야* 후속 spec 진입 motivation 유지 — *의도된 압박*.

6. **scope 최소화 — `shared/` 도입 제외**: `packages/utils` `packages/errors` 등을 `packages/shared/<name>/` 로 이동할지는 *별 spec-x* 추후 검토. 본 PR은 framework adapter 룰만.

7. **ADR 분리 (ADR-0003 갱신 + ADR-0015 신규)**: ADR-0003 = *기존 룰 절*, ADR-0015 = *framework adapter 신규 결정*. 책임 분리 → 향후 ADR-0015 폐기/대체 시 ADR-0003 영향 최소.

8. **memory ↔ ADR 책임 분리**: memory는 *agent 운영 규칙* (코드 작성 시 즉시 적용), ADR은 *프로젝트 결정 기록*. 본 PR에서 둘 다 갱신 — 두 곳에서 일관 보장.

9. **재검토 트리거 명시 (ADR-0015 §Revisit Triggers)**: *adapter끼리 의존 빈번* / *framework dep 2개+* / *`shared/` 도입* 시점에 본 ADR 재방문. 룰이 *영구가 아니라 조건부* 임을 명문화.

10. **PR target = main (phase 우회)**: spec-x 는 phase-bound 아닌 governance → main 직접 머지. phase-03 진행 차단 없음 (phase-03-backend-foundation 브랜치에 영향 없음 — 후속 재구성 spec 진입 시 main에서 최신 룰 fetch).

## 🧪 Verification

### 자동 테스트

본 spec은 *문서/룰만* — 단위 테스트 없음.

```bash
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**: ✔ no dependency violations found (26 modules, 33 dependencies cruised)

main 시점 상태 — `nestjs/` 카테고리 디렉토리 아직 없음 → 0 violations 기대대로. 후속 재구성 spec에서 `packages/nestjs/logger/` 생성 시 본 룰이 *즉시* 정적 검증.

### 수동 검증

1. ADR-0015 마크다운 정상 (frontmatter + 절 구조) ✓
2. ADR-0003 갱신 — 기존 5 카테고리 룰 보존 + framework adapter 절 추가 (역호환) ✓
3. ARCHITECTURE.md §3.2 — 기존 룰과 일관 ✓
4. depcruise config — `pnpm exec depcruise` 정상 + 0 violations ✓
5. memory 갱신 — `MEMORY.md` index 자동 로드 시 새 description 반영 ✓

## 🔗 참조

- **ADR**: `docs/adr/0015-framework-adapter-naming-and-layout.md` (신규) + `docs/adr/0003-package-layout-and-naming.md` (갱신)
- **walkthrough**: `specs/spec-x-governance-reset-package-layout/walkthrough.md` (결정 9 + 5 round-trip 협의 + 검증 + 발견 6)
- **트리거 spec**: spec-03-02 PR #10 (https://github.com/Changsik00/service-foundry/pull/10) review 시점부터 시작된 논의
- **memory** (git 외부): `project_boilerplate_package_layout` + `feedback_platform_agnostic_packages` (둘 다 갱신)
- **후속 spec (즉시)**: spec-03-XX-nestjs-adapter-relocation — 실제 코드 이동 (logger + settings)
- **후속 spec (추후)**: spec-x-shared-restructure — `packages/utils` 등을 `shared/`로 이동할지 검토

## 📝 Post-Merge

- [ ] Merge → `main` (spec-x → main 직접, phase 우회)
- [ ] phase-03-backend-foundation 브랜치에서 후속 재구성 spec 진입 시 본 PR의 룰이 *base 룰*
- [ ] depcruise 위반 1+건 (현재 임시 위반: backend-logger-nestjs + backend-settings 안 NestJS 코드) — 재구성 spec ship 시 해소
- [ ] 사용자 알림 + 다음 spec 진입 옵션 제시
