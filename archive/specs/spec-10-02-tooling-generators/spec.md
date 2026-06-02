# spec-10-02: 패키지 코드 생성기 (turbo gen)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-10-02` |
| **Phase** | `phase-10` |
| **Branch** | `spec-10-02-tooling-generators` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

새 패키지를 추가하려면 기존 패키지(`@repo/utils` 등)를 손으로 복사해 `package.json` / `tsconfig.json` / `vitest.config.ts` / `src/index.ts` / `src/index.test.ts` 를 일일이 고쳐야 한다. 카테고리(shared/backend/frontend/nestjs/config)마다 디렉토리 위치·`@repo/*` 네이밍·`tsconfig` extends 프리셋·deps 가 달라(ADR-0003 / ADR-0015) 실수가 쉽다.

### 문제점

- 복붙 비용 + 카테고리별 규칙(네이밍/extends/deps) 위반 위험.
- 일관성 부재 → lint/typecheck/test 설정이 패키지마다 미묘하게 어긋남.

### 해결 방안 (요약)

**turbo gen**(turbo 내장 generator, `@turbo/gen`)으로 `pnpm new package` 를 제공한다. 카테고리를 prompt 로 받아 ADR-0003 레이아웃·네이밍에 맞춰 스캐폴딩하고, 생성 즉시 `pnpm install` 로 워크스페이스에 편입되어 `lint`/`typecheck`/`test` 가 0 error 로 통과하도록 한다. 카테고리→타깃 매핑은 **순수 함수로 분리**해 단위 테스트한다.

## 🎯 요구사항

### Functional Requirements

1. `pnpm new package` 실행 시 turbo gen 의 `package` 생성기가 동작한다 (`new` 스크립트 = `turbo gen`).
2. 카테고리 5종(`shared` / `backend` / `frontend` / `nestjs` / `config`)을 prompt 로 선택하고, 패키지 base 이름을 입력받는다.
3. 카테고리별로 ADR-0003 / ADR-0015 규칙대로 생성한다:
   - 디렉토리: `packages/<category>/<name>/` (config 는 `packages/config/<name>-config/`)
   - `package.json` name: shared=`@repo/<name>`, backend=`@repo/backend-<name>`, frontend=`@repo/frontend-<name>`, nestjs=`@repo/nestjs-<name>`, config=`@repo/<name>-config`
   - `tsconfig` extends: shared/backend=`base`, frontend=`react-app`, nestjs=`nestjs`
   - `vitest` preset: frontend=`react`, 그 외=`node`
4. 생성 파일: `package.json` / `tsconfig.json` / `vitest.config.ts` / `src/index.ts` / `src/index.test.ts` (config 카테고리는 별도 최소 구조).
5. 카테고리→타깃 매핑 로직은 순수 함수(`resolvePackageTarget`)로 분리되어 단위 테스트로 검증된다.
6. 생성된 패키지는 `pnpm install` 후 `lint`/`typecheck`/`test` 가 0 error.

### Non-Functional Requirements

1. 신규 외부 의존 최소화 — turbo(기설치) + `@turbo/gen`(turbo-family, 타입/config 용)만 추가.
2. 모든 버전은 `pnpm-workspace.yaml` 의 `catalog:` 참조 (하드코딩 금지).
3. 템플릿은 handlebars(turbo gen 기본)로, 카테고리 분기는 helper/조건으로 처리.

## 🚫 Out of Scope

- **`pnpm new app` (app 생성기 — api/next/vite)** → **후속 spec (spec-10-02b / 신규 spec)**. 본 spec 은 package 생성기에 집중 (사용자 결정).
- **config 카테고리의 복잡한 다중 프리셋** — 최소 단일 `base` 구조만. 풍부한 프리셋은 수동.
- 기존 패키지 마이그레이션/일괄 정규화 — 본 생성기는 신규 생성만.

## 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → 후보 한 줄 요약: `generator-location` — turbo gen 관례상 `turbo/generators/` 사용 (phase.md 의 `tooling/generators/` 와 상이). phase 누적 후 tooling 레이아웃 ADR 에 통합 권장. 본 spec 은 walkthrough 기록.
- [ ] 없음

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md` (§성공 기준 2, §통합 테스트 시나리오 2)
- 관련 ADR: ADR-0003 (패키지 레이아웃/네이밍), ADR-0015 (framework adapter 카테고리)
- 직전 spec: `spec-10-01` (tooling-docker)

## ✅ Definition of Done

- [ ] `resolvePackageTarget` 단위 테스트 PASS (5 카테고리)
- [ ] 통합 테스트: `pnpm new package` 로 생성한 패키지가 lint/typecheck/test 0 error
- [ ] `walkthrough.md` / `pr_description.md` 작성 및 ship commit
- [ ] `spec-10-02-tooling-generators` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
