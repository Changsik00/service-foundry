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

> **Note (ROADMAP §2 Phase 1 그대로 이관)**: `turbo run build` acceptance는 Phase 3에서 첫 compiled 패키지(`packages/backend/*` + `@repo/tsup-config`)가 등장할 때 검증. Phase 1의 stub는 JIT(`packages/shared/*`)이라 build 파이프라인은 정의만 해두고 실제 실행은 보류.

## 🧩 작업 단위 (SPECs)

> 본 표는 phase의 *작업 지도*. sdd가 `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 사이를 자동 갱신.

<!-- sdd:specs:start -->
| ID | 슬러그 | 우선순위 | 상태 | 디렉토리 |
|---|---|:---:|---|---|
<!-- sdd:specs:end -->

> 상태 허용값: `Backlog` / `In Progress` / `Merged`

### spec-01-01 — root-files

- **요점**: `package.json` (`name=service-foundry`, `private=true`, `packageManager=pnpm@11.1.2`, `engines.node>=22`, scripts: `lint`/`typecheck`/`test`/`build` turbo 위임) + `pnpm-workspace.yaml` (`apps/*` + `packages/*/*` + catalog: zod/pino/typescript/vitest/biome/tsup/knip) + `turbo.json` (`lint`/`typecheck`/`test`/`build` 파이프라인) + `.gitignore` / `.editorconfig` / `.nvmrc` (22) / `LICENSE` (MIT) + `lefthook.yml` (pre-commit: biome + tsc --noEmit) + `.changeset/config.json` + `README.md`.
- **방향성**: ADR-0002 / ADR-0003 / ADR-0004의 결정 그대로 반영. catalog는 ADR-0002 §pnpm catalog 결정 따름.
- **연관 ADR**: 0002 / 0003 / 0004
- **연관 모듈**: 레포 root

### spec-01-02 — config-typescript

- **요점**: `@repo/typescript-config` — tsconfig preset (base / library / node-app / react-app).
- **방향성**: ADR-0004 §TypeScript strict / no project references / no paths. `strict: true` + `noUncheckedIndexedAccess` 기본.
- **연관 ADR**: 0004
- **연관 모듈**: `packages/config/typescript-config`

### spec-01-03 — config-biome

- **요점**: `@repo/biome-config` — Biome 룰 preset (lint + format).
- **방향성**: ADR-0001 §Biome 단일 도구화. ESLint/Prettier 제거 결정 반영.
- **연관 ADR**: 0001
- **연관 모듈**: `packages/config/biome-config`

### spec-01-04 — config-vitest

- **요점**: `@repo/vitest-config` — Vitest preset (node / react).
- **방향성**: ADR-0001 + ADR-0004 §테스트 도구. catalog 버전 따름.
- **연관 ADR**: 0001 / 0004
- **연관 모듈**: `packages/config/vitest-config`

### spec-01-05 — config-tsup

- **요점**: `@repo/tsup-config` — 라이브러리 번들 preset (backend 패키지가 Phase 3에서 import).
- **방향성**: ADR-0004 §tsup(backend) + JIT(shared, frontend). Phase 1에서는 preset만 작성, 사용은 Phase 3.
- **연관 ADR**: 0004
- **연관 모듈**: `packages/config/tsup-config`

### spec-01-06 — config-knip

- **요점**: `@repo/knip-config` — dead code 검사 preset.
- **방향성**: ADR-0001 §Dead code = Knip.
- **연관 ADR**: 0001
- **연관 모듈**: `packages/config/knip-config`

### spec-01-07 — config-depcruise

- **요점**: `@repo/depcruise-config` — dependency-cruiser boundary 룰 preset.
- **방향성**: ADR-0001 §Boundary 강제 = dependency-cruiser. ARCHITECTURE.md §3.1 의존성 레이어 규칙을 룰로 코드화.
- **연관 ADR**: 0001
- **연관 모듈**: `packages/config/depcruise-config`

### spec-01-08 — stub-shared-utils

- **요점**: `packages/shared/utils` 스텁 패키지 1개로 acceptance 1~7 검증.
- **방향성**: 실제 함수는 Phase 2에서 채움. Phase 1에서는 turbo pipeline + lefthook + dependency-cruiser 시범 실행을 위한 *통과 대상*.
- **연관 ADR**: 0003 (네이밍) / 0004 (JIT)
- **연관 모듈**: `packages/shared/utils`

## 📌 결정 기록 (Review)

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| Phase 1의 build acceptance 포함 여부 | 포함 / Phase 3 보류 | Phase 3 보류 | Phase 1의 모든 패키지가 JIT(`packages/shared/*`)이라 build 파이프라인 실제 실행 불필요 |
| 스텁 패키지 위치 | `packages/shared/utils` / 다른 카테고리 | `packages/shared/utils` | acceptance 검증 후 Phase 2의 첫 패키지로 그대로 승계 가능 |

## 🧪 통합 테스트 시나리오 (간결)

### 시나리오 1: turbo cache 적중

- **Given**: 모든 spec-01-* 완료 상태.
- **When**: `turbo run lint`을 두 번 연속 실행.
- **Then**: 두 번째 실행에서 모든 task가 `cache hit, replaying logs` 표시.
- **연관 SPEC**: spec-01-01 (turbo.json) + spec-01-03 (biome-config) + spec-01-08 (스텁)

### 시나리오 2: lefthook pre-commit gate

- **Given**: 모든 spec-01-* 완료 + 임의 `.ts` 파일 수정.
- **When**: `lefthook run pre-commit`.
- **Then**: Biome 자동 포맷 + `tsc --noEmit` 그린 통과.
- **연관 SPEC**: spec-01-01 (lefthook.yml) + spec-01-02 (tsconfig) + spec-01-03 (biome-config)

### 시나리오 3: dependency-cruiser 시범 실행

- **Given**: 모든 spec-01-* 완료.
- **When**: `pnpm exec depcruise --config packages/config/depcruise-config/.dependency-cruiser.cjs packages/`.
- **Then**: 스텁 1개뿐이라 violation 0건.
- **연관 SPEC**: spec-01-07 + spec-01-08

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

- [ ] 모든 SPEC(spec-01-01 ~ spec-01-08)이 main에 merge
- [ ] 성공 기준 7개 모두 충족 (정량 측정 결과 본 문서 하단 "검증 결과"에 첨부)
- [ ] 통합 테스트 3개 시나리오 PASS
- [ ] 사용자 최종 승인

## 📊 검증 결과 (phase 완료 시 작성)

<!-- 통합 테스트 로그, 성공 기준 측정값, 회귀 점검 결과 등을 여기 첨부 -->
