# Walkthrough: spec-01-02

> 6 config 패키지 전수 점검 + Phase 1 잔여 acceptance(4 + 7) 실측 기록.
> 본 spec 머지로 **phase-01 acceptance 7건 전수 통과** 달성.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| spec 분할 단위 (재조정) | spec-01-02/03 유지 / bundle | bundle (현재 spec) | 정찰 결과 6 config + depcruise 룰 본문 모두 이미 완성 — 실제 변경 거의 없음. spec-01-02만의 ceremony가 의미 단위 약함 |
| 변경 없음 시 처리 | sub-commit / walkthrough만 | walkthrough만 | spec-01-01 패턴 동일. 의미 없는 commit 회피 |
| depcruise 호출 방식 | (a) `--config ... packages/` / (b) `--config + --ts-config` / (c) per-workspace wrapper | Task 3에서 시도 후 결정 | 보일러플레이트 사용자가 칠 명령과 동일해야 acceptance 의미 있음. 가장 단순한 형태부터 시도 |

### ADR 승격 가이드

- [ ] ADR 승격 대상 있음
- [x] 없음 — acceptance 실측이 핵심. ADR-0001/0004에 이미 박혀 있음.

## 💬 사용자 협의

- **주제 1**: spec-01-02 정찰 후 재분할 (`config-presets-finalize` + `depcruise-boundary-validation` → 1 spec)
  - **사용자 의견**: B (bundle) 선택. 변경량이 작아 ceremony 비용 비례 안 됨에 동의.
  - **합의**: `spec-01-02-config-presets-finalize` 디렉토리 폐기 + state.json 초기화 + phase-01.md 재조정(2개 → 1개 spec, 새 슬러그 `config-and-depcruise-acceptance`). FF로 main에 박은 후(commit 8ed9e04) 새 spec 시작.

- **주제 2**: 사용자 임시 권한 (`state.json` 수기 편집)
  - **사용자 의견**: 이미 spec-x-roadmap-migration에서 동일 권한 부여. 본 spec에서도 폐기 흐름에 따라 state.json `spec=null` 복원 시 활용.
  - **합의**: memory의 `feedback-spec-x-phase-activate` 패턴 인지하며 진행.

## 🧪 검증 결과

### 1. Acceptance 실측

#### Acceptance 4 — `turbo run test` 그린

- **명령**: `pnpm test`
- **결과**: ✅ Pass (1 test, FULL TURBO cache hit)
- **로그**:

```text
@repo/utils:test: cache hit, replaying logs 2851a2f07972a9e7
@repo/utils:test: $ vitest run

@repo/utils:test:  RUN  v4.1.6 /Users/dennis/Project/ck/service-foundry/packages/shared/utils
@repo/utils:test:  ✓ src/index.test.ts (1 test) 1ms
@repo/utils:test:  Test Files  1 passed (1)
@repo/utils:test:       Tests  1 passed (1)
@repo/utils:test:    Duration  80ms (transform 11ms, setup 0ms, import 17ms, tests 1ms, environment 0ms)

 Tasks:    1 successful, 1 total
 Cached:    1 cached, 1 total
  Time:    29ms >>> FULL TURBO
```

- **Preset round-trip 검증**:

```bash
cat packages/shared/utils/vitest.config.ts
# → export { default } from "@repo/vitest-config/node";
```

`@repo/vitest-config/node`의 `nodePreset`이 `defineConfig({test: {environment: "node", ...}})`를 반환 → Vitest가 이를 사용해 `src/index.test.ts`의 `identity` 테스트 1건을 실행 → PASS. *config preset이 실제로 동작함*을 입증.

#### Acceptance 7 — `dependency-cruiser` violation 0건

- **호출 방식 결정**: `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/` — 가장 단순한 형태로 동작. `--ts-config` 옵션 불필요 (스텁이 단순 TS이고 base.cjs의 `tsPreCompilationDeps: true`로 충분). 후속 turbo task 정의 시 동일 명령 사용.

- **1차 실행 결과** (fix 전):

```text
  warn no-orphans: packages/config/depcruise-config/base.cjs

x 1 dependency violations (0 errors, 1 warnings). 10 modules, 6 dependencies cruised.
```

- **발견**: `depcruise-config/base.cjs` 자체가 orphan 검출됨 — 외부 도구(depcruise CLI)만 사용하고 다른 모듈은 import하지 않는 *의도된 상태*. 기존 `pathNot` 패턴(dotfile / d.ts / tsconfig.json / *.config.*)이 `packages/config/*/base.cjs` 패턴을 커버하지 않음.

- **Fix 결정**: `no-orphans` 룰의 `pathNot`에 `^packages/config/.+\\.(?:cjs|mjs|cts|mts|js|ts)$` 추가. `packages/config/*` 내부의 모든 preset 본문 파일을 orphan 검사에서 제외. 이유: config preset은 *외부 도구가 직접 사용*하는 자산이므로 import 그래프에 안 나오는 게 자연. `config-pure` 룰이 이미 config/* 가 다른 패키지를 import하지 못하도록 보호하므로 안전.

- **2차 실행 결과** (fix 후):

```text
✔ no dependency violations found (10 modules, 6 dependencies cruised)
```

- **결과**: ✅ Pass (0 errors, 0 warnings, 10 modules cruised)
- **연관 SPEC 룰 6개 검증**: no-circular / no-orphans / packages-no-app-imports / shared-no-backend-imports / frontend-no-backend-imports / config-pure — 모두 활성 + 위반 0건 (현재 1 스텁뿐이라 자연).

### 2. 🎉 Phase 1 Acceptance 전수 통과

| # | 항목 | 검증 spec | 결과 |
|:---:|---|:---:|:---:|
| 1 | `pnpm install` 무경고 (engines warning 외) | spec-01-01 | ✅ |
| 2 | `turbo run lint` 그린 | spec-01-01 | ✅ |
| 3 | `turbo run typecheck` 그린 | spec-01-01 | ✅ |
| 4 | `turbo run test` 그린 | spec-01-02 | ✅ |
| 5 | 두 번째 `turbo run lint` 캐시 100% hit | spec-01-01 | ✅ |
| 6 | `lefthook run pre-commit` 통과 | spec-01-01 | ✅ |
| 7 | dependency-cruiser violation 0건 | spec-01-02 | ✅ |

→ phase-01의 모든 success criteria 충족. `sdd phase done phase-01` 실행 후보.

### 2. 6 Config 패키지 전수 점검 결과 (변경 없음)

| 패키지 | 본문 | package.json | ADR 정합성 |
|---|---|---|:---:|
| `biome-config` | `base.json` — vcs (git, useIgnoreFile) / formatter (indent 2 / lineWidth 100 / lf / double quote / trailing all) / linter (useImportType / useExportType / noNonNullAssertion warn / noConsole warn / noExplicitAny warn) | `exports: { ./base }` + `files: [base.json]` | ✓ ADR-0001 §1 (Biome) 완전 일치 |
| `typescript-config` | base (strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes + isolatedModules + verbatimModuleSyntax + ES2023/NodeNext) + library (compiled, outDir/rootDir) + node-app (types:["node"], noEmit) + react-app (jsx:react-jsx, jsxImportSource:react, Bundler resolution, noEmit, noUnusedLocals/Parameters) | `exports: { ./base, ./library, ./node-app, ./react-app }` + `files: [4 json]` | ✓ ADR-0004 §TS 전략 완전 일치 |
| `vitest-config` | `src/node.ts` (nodePreset: env=node, globals=false, coverage=v8, CI reporters) + `src/react.ts` (reactPreset: env=jsdom) | `exports: { ./node, ./react }` + peerDeps vitest | ✓ ADR-0001 §테스트 + ADR-0004 §JIT 일치 |
| `tsup-config` | `src/node-lib.ts` (nodeLibPreset: entry=src/index.ts, format=esm, target=node22, dts, sourcemap, clean, splitting=false, treeshake) | `exports: { ./node-lib }` + peerDeps tsup | ✓ ADR-0004 §tsup 일치 |
| `knip-config` | `base.json` — workspaces별 entry/project 패턴 (config/* / shared/* / backend/* / frontend/* / apps/*) + ignore + ignoreBinaries:[lefthook] | `exports: { ./base }` + `files: [base.json]` | ✓ ADR-0001 §Knip 일치 |
| `depcruise-config` | `base.cjs` — 6 forbidden 룰 (no-circular / no-orphans warn / packages-no-app-imports / shared-no-backend-imports / frontend-no-backend-imports / config-pure) + options (doNotFollow node_modules, tsPreCompilationDeps true, enhancedResolveOptions) | `exports: { ./base }` + peerDeps dependency-cruiser + `files: [base.cjs]` | ✓ ADR-0001 §boundary + ARCHITECTURE §3.1 매핑 일치 |

→ 본 spec에서 *변경 없음*. fix sub-commit skip.

## 🔍 발견 사항

1. **depcruise `no-orphans` 룰의 pathNot 누락** (본 spec에서 fix): 기존 패턴이 `packages/config/*/base.cjs` 형태의 *외부 도구가 직접 사용하는* preset 파일을 커버하지 못해 false positive 발생. 본 fix는 룰 *수정*에 해당하나 spec out of scope 엄격 해석보다 *acceptance 매번 통과 만들기*의 가치가 높다고 판단(사용자 결정).
2. **6 config 패키지 본문이 모두 ADR과 완전 일치**: 정찰 단계에서 예상했지만 1:1 대조 결과 변경 없음 확정. d3894b4 / 2e3469c commit이 ADR-0001/0004 결정을 충실히 반영.
3. **depcruise 호출 방식**: `--config` 단일 인자로 충분. `--ts-config`는 *복잡한 TS 프로젝트*에서만 필요 — 현재 스텁 수준에서는 base.cjs의 `tsPreCompilationDeps: true`로 자동 추적. 후속 phase에서 패키지가 늘어나면 호출 방식 재검토 필요.
4. **`@repo/utils:test`의 `vitest.config.ts`가 1줄 re-export** (`export { default } from "@repo/vitest-config/node"`): 매우 깔끔한 preset round-trip 패턴. Phase 2 이후 신규 패키지의 baseline.

## 🚧 이월 항목

- **depcruise turbo task 정의** (`pnpm depcruise` script + `turbo.json` task) — phase-02 또는 phase-06(CI) 진입 시 처리. 본 spec은 *시범 실행*에 그침.
- **lefthook pre-commit에 depcruise 추가 여부** — phase-02 진입 시 결정. 현재는 biome + typecheck만.
- **config-pure 룰의 활성 검증** — Phase 2 진입 시 새 패키지 추가하면 자동으로 검증됨.
- **`packages/config/*`에 lint script 추가 여부** — Icebox 이슈, phase-02 진입 시 결정.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-17 |
| **최종 commit** | (ship 시 갱신) |
