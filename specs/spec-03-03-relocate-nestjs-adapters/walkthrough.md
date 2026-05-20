# Walkthrough: spec-03-03

> ADR-0015 적용 — 기존 박힌 framework-coupled 코드를 platform-agnostic으로 재배치. spec-03-01 정정 + spec-03-02 이동을 한 spec에 통합. 코드 동작 변경 0, 위치/이름만 변경.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| logger / settings 같은 spec 통합 vs 분리 | (A) 한 spec / (B) 두 spec | **A 한 spec** | 같은 ADR-0015 적용 + 사용자 합의 *"본 phase 안에서"* + scope 일관 |
| 디렉토리 이동 방식 | (A) `git mv` / (B) 새 dir 생성 + 복사 + 삭제 | **A `git mv`** | git diff에서 *rename* 인식 (95% similarity) → history 보존 + diff 가독성 |
| 패키지 rename 시점 | (A) `git mv` 후 한 commit / (B) 분리 | **A** | atomic — pkg name + dir 동시 변경 |
| `reflect-metadata` / `rxjs` 처리 | 유지 / 제거 | **제거** | grep 결과 settings 코드에서 사용 0. NestJS 전용 — 어댑터 패키지로 이동 |
| settings tsconfig decorator 옵션 | 유지 / 제거 | **제거** | NestJS decorator 미사용 — pure에서 불필요 |
| nestjs/settings의 dep 방향 | (A) backend-settings workspace dep / (B) 자체 구현 | **A workspace dep** | 어댑터 본질 (단방향 의존) — 코드 중복 0 |
| nestjs/settings test 의 `defineSettings` import | (A) backend-settings에서 / (B) @env-kit/node-settings 직접 | **A workspace dep** | workspace dep 정상 동작 검증 + test가 *실 사용 패턴*과 일관 |
| pkg.json name validation | grep으로 use sites 사전 점검 | **점검** | apps 미존재라 use sites 0 — 안전 |

### ADR 승격 가이드

- [x] **없음** — 본 spec은 ADR-0015 적용. 새 결정 없음.

## 💬 사용자 협의

본 spec은 *합의된 후속 작업*. 별 협의 없음:
- spec-x-governance-reset-package-layout (PR #11) 머지 후 사용자 *"머지 완료"* 알림
- 본 spec 진입 — 사용자 *"좋아"* 류 추가 합의 없이 plan accept

## 🔁 진행 과정

### T1 — 브랜치 생성

- `git checkout -b spec-03-03-relocate-nestjs-adapters` (시작 지점: `phase-03-backend-foundation`)
- carry-over: `backlog/phase-03.md` / `backlog/queue.md` 갱신 + `specs/spec-03-03-relocate-nestjs-adapters/` — T2 commit에 통합

### T2 — `logger-nestjs` 이동 + rename (`caf8069`)

- `mkdir -p packages/nestjs && git mv packages/backend/logger-nestjs packages/nestjs/logger`
- `packages/nestjs/logger/package.json`: `@repo/backend-logger-nestjs` → `@repo/nestjs-logger`
- grep — use sites 0 (apps 미존재). 문서 references는 *historical context* 유지
- `pnpm install` → lockfile 갱신
- 검증: `pnpm --filter @repo/nestjs-logger test` → 4/4 ✓ / typecheck clean
- 5 files renamed (package.json / src/index.ts / src/index.test.ts / tsconfig.json / vitest.config.ts) — 95% similarity index

### T3 — `backend-settings`에서 NestJS 제거 (`a38078a`)

- `src/index.ts`: `BACKEND_SETTINGS` symbol + `BackendSettingsModule` 제거 + 모듈 docstring 갱신 (어댑터 위치 명시)
- `src/index.test.ts`: `describe("BackendSettingsModule")` 2 test 제거 + imports 정리 (`BACKEND_SETTINGS` / `BackendSettingsModule` 제거)
- `package.json` deps:
  - `dependencies` 제거: `@nestjs/common` / `rxjs` / `reflect-metadata`
  - `devDependencies` 제거: `@nestjs/core` / `@nestjs/testing`
- `tsconfig.json`: `experimentalDecorators` / `emitDecoratorMetadata` 제거
- 검증:
  - grep `"@nestjs|BACKEND_SETTINGS|BackendSettingsModule"` in `packages/backend/settings/` → **0 hit**
  - `pnpm --filter @repo/backend-settings test` → 6/6 ✓ (이전 8 → 2 제거)
  - typecheck clean

### T4 — `nestjs/settings` 신규 패키지 (`e332f8b`)

- `mkdir -p packages/nestjs/settings/src`
- scaffold 4 파일 (package.json / tsconfig.json / vitest.config.ts / src/index.ts + src/index.test.ts)
- `package.json`:
  - deps: `@nestjs/common` + `@repo/backend-settings` (workspace) + `reflect-metadata`
  - devDeps: 표준 + `@nestjs/core` / `@nestjs/testing` + `rxjs` + `zod` (test 사용)
- `tsconfig.json`: experimentalDecorators + emitDecoratorMetadata + node types
- `src/index.ts`: `BACKEND_SETTINGS` symbol + `BackendSettingsModule.forRoot()` 이동 (T3에서 제거한 코드 그대로). JSDoc 예시에 새 import path 명시
- `src/index.test.ts`: T3에서 제거한 2 test 이동. `defineSettings` import는 `@repo/backend-settings` (workspace dep) — 어댑터 ↔ pure 단방향 검증 동시 수행
- 검증: 2/2 ✓ / typecheck clean

### T5 — 전체 검증

```bash
pnpm lint          # 9 tasks ✓
pnpm typecheck     # 9 tasks FULL TURBO ✓
pnpm test          # 9 tasks ✓ (19 test 총 — backend-logger 7 + nestjs-logger 4 + backend-settings 6 + nestjs-settings 2)
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
# ✔ no dependency violations found (44 modules, 58 dependencies cruised)
```

수동 검증:
- `grep "@nestjs" packages/backend/ --include='*.json' --include='*.ts'` → 0 hit
- `ls packages/backend/` → logger / settings (pure만)
- `ls packages/nestjs/` → logger / settings (어댑터만)

### T6 — Ship (본 commit)

- walkthrough.md + pr_description.md 작성
- sdd ship + push + PR

## 🧪 검증 결과

### 자동화 테스트

| 패키지 | test 수 | 상태 |
|---|:---:|:---:|
| `@repo/backend-logger` (pure) | 7 | ✓ |
| `@repo/nestjs-logger` (어댑터) | 4 | ✓ |
| `@repo/backend-settings` (pure) | 6 | ✓ |
| `@repo/nestjs-settings` (어댑터, 신규) | 2 | ✓ |
| **합계** | **19** | **all green** |

이전 19 test 동일 — *위치만 이동*.

### depcruise

```
✔ no dependency violations found (44 modules, 58 dependencies cruised)
```

ADR-0015의 4 forbidden 룰 모두 *통과*:
- `backend-no-nestjs-imports` ✓
- `frontend-no-react-adapter-imports` ✓ (no frontend/* yet)
- `nestjs-no-frontend-imports` ✓
- `react-no-backend-imports` ✓ (no react/* yet)

### 수동 검증

| 항목 | 명령 | 결과 |
|---|---|---|
| `packages/backend/` 안 NestJS 흔적 | `grep "@nestjs" packages/backend/ ...` | 0 hit ✓ |
| `logger-nestjs/` 디렉토리 제거 | `ls packages/backend/logger-nestjs/` | "No such file or directory" ✓ |
| 새 디렉토리 존재 | `ls packages/nestjs/{logger,settings}/` | 정상 ✓ |
| pkg name | `cat packages/nestjs/logger/package.json | grep name` | `@repo/nestjs-logger` ✓ |
| pkg name | `cat packages/nestjs/settings/package.json | grep name` | `@repo/nestjs-settings` ✓ |

## 🔍 발견 사항

1. **use sites 0 → rename 비용 0**: 본 spec 시점에 `apps/api` 등 consumer가 없어서 `@repo/backend-logger-nestjs` import가 어디에도 없었음. *boilerplate 초기에 정정한 가치* — 후속 spec/apps가 *처음부터* 새 이름 사용. ADR-0015를 *바로* 박은 게 적시.
2. **git mv similarity index 95%**: package.json만 변경 (name 1글자 다름), 나머지는 그대로. git이 *rename으로 인식* → blame / history 보존. 안전한 이동의 보증.
3. **settings test의 `defineSettings` workspace dep 사용 — 정적 보장 보너스**: nestjs/settings test가 backend-settings에서 `defineSettings` import하면서 *workspace dep 동작 검증* + *어댑터 ↔ pure 단방향* 동시 실증. 추가 integration test 불필요.
4. **`rxjs` / `reflect-metadata` 도 NestJS 전용 — 제거 정당**: pure settings에서 `import "rxjs"` / `import "reflect-metadata"` 사용 0 검증 후 제거. catalog에서 받는 *불필요 dep* 정리 — 라이브러리 bundle 사이즈 영향은 미미하나 *의도 명확*.
5. **tsconfig decorator 옵션 제거 — pure 명확화**: `experimentalDecorators` / `emitDecoratorMetadata` 는 NestJS decorator 전용. pure에서 제거 → "이 패키지는 decorator 안 씀" 정적 선언 효과.
6. **44 modules / 58 deps (depcruise)**: T2 직후 26 → T4 직후 44. 모듈 수 +18 (test imports / pino transitive 등). 룰 적용 후에도 0 violations — 의도된 단방향 의존 정상.
7. **lockfile 변경 작음**: 새 패키지 추가 (nestjs/settings) + 기존 패키지 deps 정리 → pnpm-lock.yaml diff는 *workspace 항목만* (외부 npm 패키지 그대로 — 모두 catalog 통해 받음). PR diff 노이즈 적음.

## 🚧 이월 항목

- **`@repo/backend-settings`의 `@repo/errors` / `@repo/utils` dep 미사용 검증** — *추후 cleanup* (본 spec scope 밖, 별 spec-x 또는 phase-03 후속에서).
- **다른 framework 어댑터 (Fastify / Hono 등)** — phase-04+ 또는 *필요 시점*.
- **`shared/` 도입** — spec-x 추후 검토.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-19 |
| **commits** | 3 (T2 caf8069 + T3 a38078a + T4 e332f8b) + T6 ship (본 commit) |
| **test 수** | 19 (이전 19와 같음, 위치만 이동) |
| **depcruise** | 0 violations (44 modules / 58 deps) |
