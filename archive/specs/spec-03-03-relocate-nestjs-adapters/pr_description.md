# refactor(spec-03-03): NestJS 어댑터 재배치 — `nestjs/logger` + `nestjs/settings` (ADR-0015 적용)

> **재배치 + rename 만**. 코드 동작 변경 0. ADR-0015 (PR #11) 룰을 *기존 박힌 코드*에 적용 — spec-03-01 정정 + spec-03-02 이동을 한 spec에 통합.

## 📋 Summary

### 배경 및 목적

PR #11에서 ADR-0015 (framework adapter naming & layout) 박힘 → main에서 phase-03-backend-foundation 브랜치로 sync 완료 (`c0da559`). 그러나 *기존 코드*는 임시 위반 상태:

1. **`@repo/backend-logger-nestjs`** (`packages/backend/logger-nestjs/`) — spec-03-02 suffix 패턴, ADR-0015 위반
2. **`@repo/backend-settings`** 안에 `BackendSettingsModule` / `BACKEND_SETTINGS` / `@nestjs/common` dep — spec-03-01에서 박힌 NestJS 어휘, 위반

본 PR은 *룰을 코드에 적용* — 두 위반 모두 해소:
- `packages/backend/logger-nestjs/` → `packages/nestjs/logger/` (이동 + rename)
- `packages/backend/settings/`에서 NestJS 코드 제거 (pure화)
- `packages/nestjs/settings/` 신규 (`BackendSettingsModule` 이동)

### 주요 변경 사항

- [x] **`packages/nestjs/logger/`** (rename + 이동, `@repo/nestjs-logger`)
  - `git mv` (95% similarity — history 보존)
  - test 4개 그대로
  - deps / devDeps / tsconfig / vitest.config 그대로

- [x] **`packages/backend/settings/` 정정 (pure화)**:
  - `BACKEND_SETTINGS` symbol + `BackendSettingsModule.forRoot()` 제거
  - test 2개 제거 (8 → 6)
  - `@nestjs/common` / `@nestjs/core` / `@nestjs/testing` / `rxjs` / `reflect-metadata` dep 모두 제거
  - `tsconfig.json` decorator 옵션 (`experimentalDecorators` / `emitDecoratorMetadata`) 제거

- [x] **`packages/nestjs/settings/` 신규 (`@repo/nestjs-settings`)**:
  - deps: `@nestjs/common` + `@repo/backend-settings` (workspace) + `reflect-metadata`
  - devDeps: 표준 + `@nestjs/core` / `@nestjs/testing` + `rxjs` + `zod`
  - `BACKEND_SETTINGS` + `BackendSettingsModule.forRoot()` 이동
  - test 2개 이동

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행**: spec-x-governance-reset-package-layout (PR #11, ADR-0015 박음), main → phase-03 sync (`c0da559`)
- **본 SPEC 역할**: 룰을 *코드에 적용* — boilerplate 단계 마무리. *임시 위반* 해소.

## 🎯 Key Review Points

1. **🎯 ADR-0015 1:1 적용**: spec-x-governance-reset-package-layout에서 박힌 룰을 *기존 박힌 코드*에 그대로 적용. 카테고리 = `packages/nestjs/<name>`, 명명 = `@repo/nestjs-<name>`, 의존 방향 = 어댑터 → pure 단방향. depcruise 룰 4개 모두 통과.

2. **코드 동작 변경 0**: 본 PR은 *재배치 + rename* 만. `createLogger` / `PinoLoggerService` / `BackendSettingsModule.forRoot` 등 모든 export 시그니처 그대로. *use sites 영향 0* (현재 use sites 없음 — apps 미존재).

3. **`git mv` 95% similarity**: logger-nestjs 디렉토리 이동 시 `git mv` 사용 — git diff에서 *rename* 으로 인식 (package.json name 1글자만 다름). history / blame 보존.

4. **spec-03-01 settings 정정 통합**: ADR-0015 위반은 spec-03-02 logger뿐 아니라 spec-03-01 settings에도 존재 (`BackendSettingsModule` / `BACKEND_SETTINGS`). 한 spec에서 둘 다 정정 — ADR-0015 적용 일관 + scope 단일.

5. **`rxjs` / `reflect-metadata` 도 NestJS 전용 — 제거**: pure settings에서 사용 검증 후 제거. catalog에서 받는 *불필요 dep* cleanup. 의도 명확화 (이 패키지는 NestJS 안 씀).

6. **settings tsconfig decorator 옵션 제거**: `experimentalDecorators` / `emitDecoratorMetadata` 는 NestJS decorator 전용. pure에서 제거 → 정적 선언 효과.

7. **nestjs/settings test가 workspace dep 검증 동시 수행**: test에서 `defineSettings` import를 `@repo/backend-settings` (workspace) 에서 받음. 추가 integration test 없이 *어댑터 ↔ pure 단방향 의존* 실증. 검증 효율.

8. **test 위치만 이동, 수 변동 없음**: 이전 19 test → 본 PR 후 19 test. backend-logger 7 + nestjs-logger 4 + backend-settings 6 + nestjs-settings 2. 동작 동일.

9. **depcruise 룰 즉시 정적 보장**: 본 PR 후 `packages/backend/* → packages/nestjs/*` 의존 시도하면 depcruise가 즉시 차단. spec-x에서 박은 룰이 *실 효과* 발휘 시점.

10. **rollback 용이**: 본 PR revert 시 git history (rename 추적) 로 즉시 복구. 후속 spec (03-04 http-client 등) 이 본 PR의 새 import path에 의존 안 함 (use sites 0) — ripple 0.

## 🧪 Verification

### 자동 테스트

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**:
- ✅ `pnpm lint`: 9 tasks PASS
- ✅ `pnpm typecheck`: 9 tasks FULL TURBO
- ✅ `pnpm test`: **19 test PASS** (backend-logger 7 + nestjs-logger 4 + backend-settings 6 + nestjs-settings 2)
- ✅ `depcruise`: **0 violations** (44 modules / 58 dependencies)

### test 분포 (19)

| 패키지 | test 수 | describe 블록 |
|---|:---:|---|
| `@repo/backend-logger` (pure) | 7 | `createLogger` (3) + `requestId context` (4) |
| `@repo/nestjs-logger` (어댑터) | 4 | `PinoLoggerService` (2) + `BackendLoggerModule` (2) |
| `@repo/backend-settings` (pure) | 6 | `defineSettings (re-export)` (3) + `BaseBackendSchema` (2) + `dogfooding` (1) |
| `@repo/nestjs-settings` (어댑터) | 2 | `BackendSettingsModule` (2) |

### 수동 검증

```bash
# 1. backend/ 안에 NestJS 흔적 0
grep -rn "@nestjs" packages/backend/ --include='*.json' --include='*.ts'
# → (no matches)

# 2. 디렉토리 구조
ls packages/backend/   # → logger / settings (pure만)
ls packages/nestjs/    # → logger / settings (어댑터만)
ls packages/backend/logger-nestjs/   # → "No such file or directory"

# 3. pkg name
grep '"name"' packages/nestjs/logger/package.json    # → @repo/nestjs-logger
grep '"name"' packages/nestjs/settings/package.json  # → @repo/nestjs-settings
```

## 🔗 참조

- **선행 ADR**: [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md)
- **선행 PR**: #11 (spec-x-governance-reset-package-layout — 룰 박음)
- **선행 sync**: merge commit `c0da559` (phase-03-backend-foundation 에 main 룰 흡수)
- **walkthrough**: `specs/spec-03-03-relocate-nestjs-adapters/walkthrough.md`
- **memory**: `feedback_platform_agnostic_packages` + `project_boilerplate_package_layout` (PR #11에서 갱신)
- **후속 spec**: spec-03-04 backend-http-client (원래 planned 순서 진입)

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-03 → Merged)
- [ ] 사용자 알림 + 후속 spec (03-04 http-client) 진입 옵션 제시

## ✅ Definition of Done

- [x] `packages/nestjs/logger/` 존재 (이동 완료) + `@repo/nestjs-logger`
- [x] `packages/backend/logger-nestjs/` 삭제됨
- [x] `packages/nestjs/settings/` 신규 존재 + `@repo/nestjs-settings`
- [x] `packages/backend/settings/` 에 NestJS 코드 / dep / decorator 흔적 0
- [x] `pnpm install` 정상 + lockfile 갱신
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm test` 그린 (19 test)
- [x] `pnpm exec depcruise` 0 violations
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
