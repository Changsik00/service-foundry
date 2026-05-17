# phase-01: 모노레포 골격 (Monorepo Skeleton)

> 본 phase는 service-foundry의 모든 후속 Phase가 올라설 **베이스**를 만든다.
> Root files, `packages/config/*` 6종, 그리고 acceptance 검증을 위한 단일 스텁 패키지(`packages/shared/utils`)까지가 범위.

## 📋 메타

| 항목 | 값 |
|---|---|
| **Phase ID** | `phase-01` |
| **상태** | In Progress |
| **시작일** | 2026-05-17 |
| **목표 종료일** | 미정 |
| **소유자** | dennis |
| **Base Branch** | 없음 (각 spec → main 직접 PR) |

> **현재 진행 상태**: 일부 root files 및 packages/config/* 골격이 이미 작성됨 (d3894b4 / 2e3469c 커밋).
> 누락 항목 및 acceptance 검증이 본 phase의 잔여 범위.

## 🎯 배경 및 목표

### 현재 상황

레포 부트스트랩 단계. `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.editorconfig`, `.nvmrc`, `biome.json`, `lefthook.yml`, `.changeset/config.json` 등의 root files는 초기 골격이 잡혀 있으나, ADR-0001~0004에서 결정된 도구 체인(Biome / Knip / dependency-cruiser / tsup / vitest / typescript)을 `packages/config/*` preset으로 캡슐화하고 turbo 파이프라인에서 일관되게 통과시키는 검증이 남아 있다.

### 목표 (Goal)

`pnpm install` → `turbo run lint typecheck test` 가 그린 상태로 끝나며, 두 번째 실행 시 turbo 캐시 100% hit. lefthook pre-commit이 통과하고 dependency-cruiser가 시범 실행 가능한 상태. 이는 후속 모든 Phase가 동일한 toolchain 위에서 일관되게 진행될 수 있는 토대.

### 성공 기준 (Success Criteria) — 정량 우선

1. `pnpm install` 무경고로 완료.
2. `turbo run lint` 그린 (Biome via `@repo/biome-config`).
3. `turbo run typecheck` 그린 (`@repo/typescript-config` 상속).
4. `turbo run test` 그린 (Vitest via `@repo/vitest-config`, 빈 placeholder 테스트 1개 OK).
5. 두 번째 `turbo run lint` → 캐시 100% hit.
6. `lefthook run pre-commit` 통과.
7. dependency-cruiser 룰 시범 실행 (스텁 패키지만 있어 violation 없음 확인).

> **Note**: `turbo run build` acceptance는 Phase 3에서 첫 compiled 패키지(`packages/backend/*` + `@repo/tsup-config`)가 등장할 때 검증. Phase 1의 stub는 JIT(`packages/shared/*`)이라 build 파이프라인은 정의만 해두고 실제 실행은 보류.

## 🧩 작업 단위 (SPECs)

> 본 표는 phase의 *작업 지도*. sdd가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
| `spec-01-01` | root-files-and-lefthook-acceptance | P? | Merged | `specs/spec-01-01-root-files-and-lefthook-acceptance/` |
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-01-01 — root-files-and-lefthook-acceptance

- **요점**: 루트 파일(`package.json` / `pnpm-workspace.yaml` / `turbo.json` / `.gitignore` / `.editorconfig` / `.nvmrc` / `LICENSE` / `lefthook.yml` / `.changeset/config.json` / `README.md`) **누락/불일치 점검 및 보강** + lefthook pre-commit 동작 검증 + turbo cache 적중 검증.
- **방향성**: 초기 commit(d3894b4 / 2e3469c)에 이미 박힌 루트 파일을 ADR-0002/0003/0004 결정과 1:1 대조해 누락/불일치만 fix. `engines.node`(>=22 <23) vs 실행 머신(v24) 불일치 경고도 본 spec에서 처리. Acceptance 1, 2, 3, 5, 6 검증 (pnpm install 무경고 / turbo lint 그린 / turbo typecheck 그린 / lint 캐시 100% hit / lefthook pre-commit 통과).
- **연관 ADR**: 0001 / 0002 / 0003 / 0004
- **연관 모듈**: 레포 root + `lefthook.yml`

### spec-01-02 — config-presets-finalize

- **요점**: 6개 `packages/config/*` preset의 **누락 룰 본문 보강** + Vitest preset import 점검 (Acceptance 4: turbo test 그린).
  - `@repo/typescript-config` — tsconfig preset (base / library / node-app / react-app) — strict + noUncheckedIndexedAccess
  - `@repo/biome-config` — Biome 룰 preset (lint + format)
  - `@repo/vitest-config` — Vitest preset (node / react)
  - `@repo/tsup-config` — 라이브러리 번들 preset (Phase 3에서 실제 사용)
  - `@repo/knip-config` — dead code 검사 preset
  - `@repo/depcruise-config` — boundary 룰 *본문은 spec-01-03에서 검증*
- **방향성**: 6개 preset이 이미 골격 존재. 본 spec은 *룰 본문이 비어있거나 stale한 부분*을 ADR-0001/0004와 대조해 보강. preset 자체 변경량이 작으면 1 spec으로 묶어도 §11.2 임계 내.
- **연관 ADR**: 0001 / 0004
- **연관 모듈**: `packages/config/{typescript,biome,vitest,tsup,knip,depcruise}-config`

### spec-01-03 — depcruise-boundary-validation

- **요점**: `@repo/depcruise-config`의 **boundary 룰 본문 작성 + 시범 실행 + violation 0건 확인** (Acceptance 7).
- **방향성**: ARCHITECTURE.md §3.1의 의존성 레이어 규칙(apps → composition → infra → shared → config; FE↔BE 차단; shared/* Node-only 금지)을 dependency-cruiser 룰로 코드화. Phase 1 시점에 스텁(`packages/shared/utils`) 1개뿐이라 violation 0건이 자연스럽게 입증됨. 본 룰은 Phase 2~4에서 새 패키지/앱 추가 시 자동 검증 게이트로 작동.
- **연관 ADR**: 0001
- **연관 모듈**: `packages/config/depcruise-config` (룰 본문) + `packages/shared/utils` (스텁 — 검증 대상)

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Phase 1의 build acceptance 포함 여부 | 포함 / Phase 3 보류 | Phase 3 보류 | Phase 1의 모든 패키지가 JIT(`packages/shared/*`)이라 build 파이프라인 실제 실행 불필요 |
| 스텁 패키지 위치 | `packages/shared/utils` / 다른 카테고리 | `packages/shared/utils` | acceptance 검증 후 Phase 2의 첫 패키지로 그대로 승계 가능 |
| SPEC 분할 단위 | 8개 (config preset마다 1 spec) / 3개 (bundle) | 3개 bundle | 골격이 이미 존재(d3894b4) — 본 phase 잔여는 *검증 + 누락 보강*. 8 spec × ceremony 비용 ≈ 48~64k 토큰으로 비대. `root-files-and-lefthook-acceptance` / `config-presets-finalize` / `depcruise-boundary-validation` 3 spec이 §11.2 임계와 acceptance 7개 검증 단위에 적합 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: turbo cache 적중

- **Given**: spec-01-01 + spec-01-02 완료.
- **When**: `turbo run lint`을 두 번 연속 실행.
- **Then**: 두 번째 실행에서 모든 task가 `cache hit, replaying logs` 표시.
- **연관 SPEC**: spec-01-01 (turbo.json + 스텁 import 가능 상태) + spec-01-02 (biome 룰)

### 시나리오 2: lefthook pre-commit gate

- **Given**: spec-01-01 완료 + 임의 `.ts` 파일 수정.
- **When**: `lefthook run pre-commit`.
- **Then**: Biome 자동 포맷 + `tsc --noEmit` 그린 통과.
- **연관 SPEC**: spec-01-01 (lefthook.yml + biome/tsc 호출)

### 시나리오 3: dependency-cruiser 시범 실행

- **Given**: spec-01-03 완료.
- **When**: `pnpm exec depcruise --config packages/config/depcruise-config/.dependency-cruiser.cjs packages/`.
- **Then**: 스텁(`packages/shared/utils`) 1개뿐이라 violation 0건.
- **연관 SPEC**: spec-01-03 (룰 본문 + 스텁 대상)

### 통합 테스트 실행

```bash
pnpm install
turbo run lint typecheck test     # 시나리오 1, 2 base
turbo run lint                    # 시나리오 1 cache check
lefthook run pre-commit           # 시나리오 2
pnpm exec depcruise --config packages/config/depcruise-config/.dependency-cruiser.cjs packages/   # 시나리오 3
```

## 🔗 의존성

- **선행 phase**: 없음 (root)
- **외부 시스템**: 없음
- **연관 ADR**:
  - `docs/adr/0001-linting-formatting-strategy.md` (Biome / Knip / dependency-cruiser)
  - `docs/adr/0002-monorepo-foundations.md` (pnpm / turborepo / Node / lefthook / changesets)
  - `docs/adr/0003-package-layout-and-naming.md` (폴더 그룹 + `*-config` suffix + `@repo/*` flat import)
  - `docs/adr/0004-typescript-and-compilation-strategy.md` (tsup + JIT 전략, no project references)

## 📝 위험 요소 및 완화

| 위험 | 영향 | 완화책 |
|---|---|---|
| Biome 메이저 버전 변경 시 룰 호환성 깨짐 | lint 그린 회귀 | catalog의 Biome 버전을 단일 pin + 변경 시 `pnpm exec biome --help`로 재유도 (ARCHITECTURE.md §0.1) |
| dependency-cruiser 룰 false positive | acceptance 7 실패 | Phase 1 스텁은 violation 0 보장. 룰 정교화는 Phase 2 이후 |
| catalog pin 누락으로 packages/* 간 버전 drift | 환경 비일관 | `pnpm-workspace.yaml` catalog에 ADR-0002 명시 라이브러리 모두 pin |

## 🏁 Phase Done 조건

- [ ] 모든 SPEC(spec-01-01 ~ spec-01-03)이 main에 merge
- [ ] 성공 기준 7개 모두 충족 (정량 측정 결과 본 문서 하단 "검증 결과"에 첨부)
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
