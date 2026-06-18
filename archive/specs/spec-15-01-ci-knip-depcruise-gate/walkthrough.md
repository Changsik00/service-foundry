# Walkthrough: spec-15-01

> CI knip + depcruise 게이트 배선. 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| knip preset 소비 방식 | (A) root `knip.json` `extends` / (B) `knip.config.ts` re-export | **B** | knip 6.14 는 config `extends` 미지원 (`ERROR: unrecognized_keys: extends`). README 가 안내하던 (A) 가 실제로 동작 안 함 → preset JSON 을 import 해 re-export. preset = SoT 유지. |
| base.json 방향 | (A) 워크스페이스 과도 명시 / (B) 최소화 + plugin 신뢰 | **B** | knip 자신이 hints 95개로 "redundant/no matches" 보고. 모든 패키지에 vitest.config 존재 → test 인식은 plugin 보조. tooling preset 은 추적 불가라 `ignoreDependencies` 로만 처리. |
| 미배선 scaffolding (deps 7·export 4·catalog 1) | (A) 전부 보존 / (B) 배선예정만 ignore·나머지 삭제 / (C) 전부 삭제 | **A** (사용자 결정) | 보일러플레이트 YAGNI-면제 철학 + spec out-of-scope "intentional 은 삭제 금지, ignore 만". 삭제 시 후속 spec 재추가 필요. |
| scaffolding export 보존 방식 | (A) 파일 전체 ignore / (B) `@public` JSDoc 태그 | **B** | (A) 는 같은 파일의 정상 export 검사까지 잃음. `@public` 은 정밀·비파괴 + exports 게이트를 error 로 유지 → task-07 주입 테스트 동작. |
| 게이트 severity | exports/types=error, duplicates=off, catalog=warn | — | duplicates: preset 의 의도적 named+default dual-export 관례. catalog: 보일러플레이트가 제공하는 미사용 핀(@nestjs/config)은 의도적 → visible-only(비차단). 나머지는 error (NFR3 핵심=error). |
| knip/depcruise turbo 형태 | per-package task / **root task `//#`** | root task | 둘 다 모노레포 전역 분석기. 소스 전체를 input 으로 잡아 stale-pass 방지. |
| CI knip 실패: `Unresolved ./routeTree.gen` (PR #94 1차) | (A) 게이트를 build 뒤로 이동 / (B) `ignoreUnresolved` / (C) CI 에서 codegen 선행 | **B** | `routeTree.gen.ts` 는 gitignore + TanStack vite plugin 이 빌드 시 생성. 로컬엔 있어 통과했으나 CI clean checkout(build 前)엔 없어 unresolved error. `ignoreUnresolved:["routeTree\\.gen"]` 로 파일 유무와 무관하게 결정론적 통과(빌드 시 resolve). fail-fast(build 前) 위치 유지. |

### ADR 승격 가이드
- [ ] ADR 승격 대상 있음
- [x] 없음 (phase-14 ADR-0001/0019 범위 내; knip `extends` 미지원은 README 교정으로 충분)

## 💬 사용자 협의

- **주제**: 미배선 scaffolding(선언만 된 workspace deps 7 + sample export 4 + `@nestjs/config` catalog) 처리
  - **사용자 의견**: 전부 보존 (ignore + 사유)
  - **합의**: 삭제 없이 knip ignore / `@public` 태그 / catalog warn 으로 보존. 사유는 knip-config README + 본 문서에 문서화. 게이트는 "진짜 신규 dead" 만 error 로 잡음.

## 🧪 검증 결과

### 1. 게이트 실행 (단위 테스트 대체 — CI 게이트 spec)

- **knip**: `pnpm knip` → exit 0. error 급 위반 0. 잔여는 catalog `@nestjs/config` 1건 (warn=비차단).
- **depcruise**: `pnpm depcruise` → `✔ no dependency violations found (383 modules, 825 dependencies cruised)`, exit 0.
- **turbo 경유**: `pnpm turbo run knip depcruise` → 2 successful, exit 0.

### 2. 회귀 (기존 게이트 불변)

- **명령**: `pnpm turbo run lint typecheck test build`
- **결과**: 134/135 tasks 성공. 유일 실패 `@apps/api#test` (e2e 23건).
- **사전 존재 확인**: 변경 stash 후 clean base 에서 동일 실패 재현 (500/401 — e2e 가 실제 Postgres 필요; CI verify.yml 은 postgres service 제공). **본 spec 과 무관, 회귀 0.**
- biome: 변경 파일(knip.config.ts·@public 2곳·.dependency-cruiser.cjs) 전부 통과. typecheck: factory 포함 전 패키지 통과.

### 3. 위반 주입 검증 (task-07)

1. **시나리오1 (knip unused export)**: `apps/api/src/auth/oauth.stores.ts` 에 `export const __knipCanary = 42;` 주입
   - **Result**: `Unused exports (1) __knipCanary` → `pnpm knip` exit **1 (red)**. 복원 후 exit 0.
2. **시나리오2 (depcruise frontend→backend)**: `packages/frontend/ui/src/__depcruise_canary.ts` 가 `../../../backend/logger/src/index.js` import
   - **Result**: `error frontend-no-backend-imports: packages/frontend/ui/src/__depcruise_canary.ts → packages/backend/logger/src/index.ts`, exit **1 (red)**. 삭제 후 exit 0.

## 🔍 발견 사항

- **boilerplate README 버그**: `@repo/knip-config` README 가 동작 안 하는 `extends` 패턴을 안내 중이었음 → re-export 로 교정.
- **knip plugin 연쇄 효과**: depcruise 배선 후 knip 의 depcruise plugin 이 `.dependency-cruiser.cjs` 를 인식 → `dependency-cruiser`·`@repo/depcruise-config` ignore 가 redundant 해져 제거. turbo entry 추가로 `@turbo/gen` 도 동일.
- **biome 미커버 루트 파일**: `pnpm lint`(turbo per-package)는 루트 `knip.config.ts`·`.dependency-cruiser.cjs` 를 검사하지 않음. 루트 파일 lint 일원화는 icebox 후보.
- **로컬↔CI 환경 차이 (generated file)**: 게이트가 build 前 실행되므로 생성 파일(`routeTree.gen.ts`)이 CI 엔 부재 → 로컬 통과가 CI 통과를 보장 못 함. `ignoreUnresolved` 로 해소. 재현은 파일을 잠시 치워(`mv`) 검증함. depcruise 도 같은 이유로 CI 에서 `__root.tsx` no-orphans **warn**(비차단) 1건 — 게이트 실패 아님, 빌드 시 사라짐.

## 🚧 이월 항목

- **task-08 (factory 생성기 tsconfig lib)** → spec-15-05 (생성기 tsconfig). factory 패키지 *자체* tsconfig 는 정상(typecheck 통과)이라 본 spec 처리 불요. 이미 phase-15 계획에 존재 — queue 신규 항목 불요.
- **exports/types 게이트를 미래에 더 엄격히**: 현재 scaffolding 안정화 전이라 `@public` 태그로 개별 보존. scaffolding 배선 완료(15-02~05) 후 태그 정리 검토.

## 🔗 관련 문서 (Related)

- 관련 wiki: `docs/explainers/platform/config-packages-presets.md`, `docs/explainers/platform/ci-verify-gate.md`
- 관련 ADR: ADR-0001(lint/boundary), ADR-0019(보안 linter No-Go)
- 관련 리뷰: `docs/review/2026-06-01-wiring-audit.md` §C

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-01 |
| **최종 commit** | (ship 시 갱신) |
