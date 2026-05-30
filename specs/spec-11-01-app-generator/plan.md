# Implementation Plan: spec-11-01

## 📋 Branch Strategy
- 신규 브랜치: `spec-11-01-app-generator`
- 시작 지점: `phase-11-observability` (base, 첫 spec — phase 브랜치는 ship 시 JIT 생성)
- base 모드: PR target = `phase-11-observability`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] **api 앱 = 최소 NestJS**(health+settings+logger), auth/db 전체 미포함 (범용 scaffold).
> - [ ] turbo gen 재사용(신규 의존 0), 생성 직후 biome 포맷.

> [!WARNING]
> - [ ] 통합 테스트가 앱 생성 + `pnpm install` → 워크스페이스 변경 → 정리 + lockfile 복구 필수.
> - [ ] PreToolUse 훅 의존(#161) — add 분리 + bare `git commit`.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| 엔진 | turbo gen `app` 생성기 (config.ts 확장) | 10-02 package 생성기와 동일 |
| 매핑 | 순수 함수 `resolveAppTarget(type,name,port)` | 타입 규칙 단위 테스트 |
| 템플릿 | `lib/app-templates.ts` 빌더 + config inline write + biome 포맷 | 10-02 패턴 재사용 |
| api 템플릿 | 최소 NestJS (main/app.module health/settings/logger) | 범용 scaffold, auth 비포함 |
| next/vite | 최소 entry + config + hello page | 부팅·typecheck 가능한 최소 |
| 포트 | prompt(기본 제안 2030+) | 기존 2026~2028 충돌 회피 |
| 테스트 | 단위(resolveAppTarget) + 통합(api 생성→install→typecheck/lint) | 시나리오 1 |

## 📂 Proposed Changes

#### [NEW] `turbo/generators/lib/resolve-app-target.ts` (+ `.test.ts`)
`resolveAppTarget(type, name, port)` → `{ dir, pkgName, type, port, tsconfigExtends, scripts }`. api/next/vite 분기.

#### [NEW] `turbo/generators/lib/app-templates.ts`
타입별 파일 빌더: package.json(deps/scripts), tsconfig, vitest.config, entry(main.ts/main.tsx/app/page), config(next/vite/tailwind/postcss), health(api), index.html(vite).

#### [MODIFY] `turbo/generators/config.ts`
`app` 생성기 추가 (prompt type/name/port → resolveAppTarget → buildAppFiles write → biome 포맷). `package` 생성기와 공존.

#### [MODIFY] `package.json`
`pnpm new app` 은 `new`(=turbo gen) 스크립트로 이미 동작 (`turbo gen app`). 변경 불필요 — 확인만.

#### [NEW] `turbo/generators/app-smoke-test.sh`
`turbo gen app --args api <name> <port>` → `pnpm install` → 생성 앱 typecheck/lint → 정리(rm + install 복구).

## 🧪 검증 계획

### 단위
```bash
pnpm exec vitest run turbo/generators/lib/resolve-app-target.test.ts
```
3 타입 매핑 + 잘못된 타입/이름 throw.

### 통합 (Integration Test Required = yes)
```bash
bash turbo/generators/app-smoke-test.sh
```
api 앱 생성 → install → typecheck/lint 0 error → 정리.

### 수동
1. `pnpm new app` → type=api, name=demo-svc, port=2031 → `apps/demo-svc/` 생성 → 부팅 가능 구조 확인.

## 🔁 Rollback
- 신규 파일(turbo/generators/) + config.ts 확장뿐. 기존 앱/패키지 무변경. 통합 테스트 생성물 정리 필수(lockfile drift 방지).

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
