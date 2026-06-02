# Walkthrough: spec-03-01

> Phase 3 (Backend Foundation)의 첫 spec. `@repo/backend-settings` — `@env-kit/node-settings` wrap + `BaseBackendSchema` + NestJS adapter. **Phase Base Branch 모드 첫 적용** + **외부 라이브러리 zod 4 migration 우회작업** 포함.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 의존 라이브러리 | `@env-kit/node-settings` 채택 / 자체 구현 | **`@env-kit/node-settings`** | memory `project_boilerplate_locked_stack` (dogfooding) + 사용자 본인 라이브러리 |
| 라이브러리 wrap 방식 | (A) 자체 `defineSettings` 단순 wrap / (B) 라이브러리 그대로 re-export + 추가 가치 | **B** | T2 정찰: 라이브러리가 이미 풍부한 API (envSchema/perEnv/overrideEnvKey/build). 단순 wrap은 *겹침* |
| zod 호환성 | (A) zod 3 별도 설치 / (B) 라이브러리 zod 4 업그레이드 / (C) 자체 구현 | **B** | ADR-0002/0010 일관. 라이브러리는 사용자 본인이라 업그레이드 가능 |
| 라이브러리 업그레이드 위치 | (A) service-foundry 안 / (B) 별 spec-x / (C) 외부 작업 | **C** | service-foundry 외부 repo. 본 spec과 *분리된 commit 흐름* |
| 라이브러리 version | 1.0.2 → 1.1.0 (BREAKING peer dep) | 1.1.0 | semver 정확 — peer dep는 BREAKING |
| `BaseBackendSchema` scope | 3개 (NODE_ENV / PORT / LOG_LEVEL) | 채택 | 최소 공통 — 다른 backend 패키지가 `.extend()`로 추가 |
| NODE_ENV 값 | 3 (dev/staging/prod) / 4 (dev/test/staging/prod) | **4** | test 환경 명시 — vitest의 `NODE_ENV=test` 자연 매핑 |
| LOG_LEVEL scope | pino 6단계 (trace~fatal) | 채택 | pino 호환 — phase-03 spec-03-02 logger와 직접 연결 |
| `BackendSettingsModule` 구현 | (A) NestJS @Module class / (B) 객체 리터럴 (DynamicModule) | **B** | NestJS 직접 import 안 함 — *peer dep 비대 회피*. 호출자가 NestJS dep 책임 |
| BACKEND_SETTINGS token | symbol vs string | **symbol** | NestJS 권장 + 유일성 보장 |
| dogfooding scope | `.env.example` 생성 / `introspectEnvSchema` 검증 | **introspect 검증** | 생성기는 `generators/` sub-export — phase-10 Ops에서 호출 (본 spec scope 밖) |
| ADR 시점 | 없음 | 채택 | 본 spec은 *결정 적용*만. 후속 backend 패키지에서 패턴 반복 시 격상 |

### ADR 승격 가이드

- [ ] ADR 가치 있는 결정 있음
- [x] **없음** — 본 spec은 *결정 적용*. memory `project_boilerplate_locked_stack` + ADR-0005가 이미 NestJS+Drizzle 결정. 본 spec은 wrap 구현 + NestJS adapter.

## 💬 사용자 협의

- **주제 1**: spec/plan/task 검토 후 Plan Accept ("1") — 정상 진행.
- **주제 2**: T2 정찰에서 라이브러리 zod 3 호환성 이슈 발견 → Hard Stop. 사용자 결정 4 옵션 제시 → **"zod 4로 업그레이드부터 해"** 채택.
- **주제 3**: 라이브러리 업그레이드 작업 완료 후 PR + tag push까지 진행. 사용자 *"배포 한번 해줄래?"* → npm publish (GitHub Actions release workflow 자동 진행).
- **주제 4**: 사용자 *"우리쪽 일 하자"* → service-foundry T3~T7 재개.

## 🛡 Phase Base Branch 모드 첫 spec — 동작 검증

본 spec이 phase-03의 *첫 spec*. Phase Base Branch 모드(`baseBranch: phase-03-backend-foundation`) 처음 적용. 검증 포인트:
- ✅ `sdd phase activate phase-03 --base` 성공 (단, 첫 시도에서 phase-03.md Base Branch 필드에 *description text*까지 들어가 *baseBranch 필드 오염* — `\`phase-03-backend-foundation\` (...)` 형태. phase-03.md를 *Base Branch* 필드와 *Base Branch 모드* 필드로 분리해 해소).
- ✅ sdd phase activate 재실행이 *spec state 리셋* — `spec: null` 됨. state.json 수동 복구 필요 (memory `feedback_spec_x_phase_activate`와 동일 패턴).
- ✅ Plan Accept 정상 동작.
- ⏸ `phase-03-backend-foundation` branch 생성은 *첫 ship 시점*. 본 ship에서 확인.

## 🔬 `@env-kit/node-settings` API 정찰 결과 (T2)

```ts
defineSettings({
  envSchema: z.object({...}),     // env 검증 schema
  envKey: "APP_ENV",              // per-env 분기 키
  defaults: { ... },              // 공통 기본값
  perEnv: { local: {...}, prod: {...} },  // env별 override
  overrideEnvKey: "APP_CONFIG_JSON",  // runtime JSON override (12-factor)
  build: (env, layered) => ({ ... }),  // 최종 typed config builder
})
// → SettingsLoader: (rawEnv) => TSettings
```

**풍부한 export 30+**:
- 본체: `defineSettings` / `defineClientEnv` / `introspectEnvSchema`
- 유틸: `loadDotenvCascade` / `parseDotenv` / `inferAppEnv` / `deepMerge` / `mergePerEnv`
- 검증: `checkPerEnvCompleteness` / `validateDefineSettingsOptions`
- 에러: `NodeSettingsError` / `ERROR_CATALOG`
- 상수: `DEFAULT_SECRET_PATTERNS` / `DEFAULT_DOCS_BASE`
- TODO 마커: `todo` / `isTodo` / `TODO_SYMBOL`

본 spec에서 re-export한 것: `defineSettings` / `introspectEnvSchema` / `DEFAULT_SECRET_PATTERNS` / `DEFAULT_DOCS_BASE` / `NodeSettingsError` / `presets`. 나머지는 *필요 시 점진적 추가*.

## 🔧 외부 라이브러리 zod 4 migration (우회작업 요약)

본 spec의 *블로커*였던 `@env-kit/node-settings@1.0.2` zod 3 호환성을 해소하기 위한 외부 repo 작업:

- **branch**: `chore/upgrade-zod-4` on `Changsik00/node-settings`
- **변경 7 파일** (CHANGELOG / package.json / lock / introspect / zod-issues / validate-options ×2)
- **마이그레이션 패턴**:
  - `_def.typeName` (PascalCase) → `_def.type` (lowercase)
  - `ZodEnum` / `ZodNativeEnum` 분리 → `enum` 통합
  - `ZodEffects` / `ZodPipeline` 분리 → `pipe` 통합 (in/out)
  - `defaultValue: () => T` 함수 → 직접 값
  - `ZodError.errors` → `ZodError.issues`
- **검증**: typecheck PASS + 294/294 test pass + build clean
- **release**: PR #6 squash 머지 → v1.1.0 tag push → GitHub Actions release workflow (53초) → npm publish 성공

## 🔍 발견 사항

### 1. memory `feedback_spec_x_phase_activate` 패턴이 phase activate에도 적용

`sdd phase activate phase-03 --base` 재실행 시 *active spec이 null로 리셋*됨. memory에는 *"spec-x 진행 중 sdd phase activate 호출 금지"*로 박혀있었으나 실제로는 *모든 phase activate 호출*이 spec state를 리셋. *재실행 시점에 spec이 박혀있으면 보존하는 동작*이 더 자연 — sdd 도구 개선 후보 (별 Icebox).

복구는 state.json 직접 편집 (`spec: null` → `spec-03-01-backend-settings`)으로 즉시.

### 2. phase-03.md `Base Branch` 필드 description text가 sdd 파싱 깨뜨림

phase-03.md 메타에 `Base Branch: \`phase-03-backend-foundation\` (Phase Base Branch 모드 — ...)` 처럼 *description 함께* 적었더니 sdd가 *전체 문자열을 baseBranch 값으로 박음*. branch checkout 시 invalid branch name 위험. 분리:
```md
| **Base Branch** | `phase-03-backend-foundation` |
| **Base Branch 모드** | Phase Base Branch 모드 — Spec PR이... |
```

phase 템플릿 *Base Branch 필드는 *값만**으로 제한 권장 — *템플릿 docs 보강 후보*.

### 3. 외부 라이브러리 zod 4 migration이 *예상보다 작음* (5 fix file)

라이브러리 294 test 중 *294/294 통과*까지 *core 3 파일 수정*(validate-options / introspect / zod-issues) + *2 사소 fix*(test 가정 / changelog). 본 사용자가 *internal API 의존을 최소화*해 둔 결과. 향후 zod 5 등 메이저 변경에도 *작은 작업*으로 따라갈 수 있음.

### 4. `BackendSettingsModule` 객체 리터럴 패턴

NestJS의 `@Module` decorator class 대신 *DynamicModule 객체 리터럴*로 박음. 효과:
- NestJS를 *런타임 dep로 끌어들이지 않음* (peer dep / 호출자 책임)
- backend-settings는 *NestJS-agnostic 데이터 모델*에 가까움 — Fastify/Hono adapter 추가도 같은 객체 패턴 재사용 가능
- 단점: NestJS의 `@Module()` 메타데이터 reflection 활용 불가 (e.g. `forRootAsync`) — phase-09 이후 필요 시 정정

### 5. NestJS 도입 첫 spec — 검증 완료

`@nestjs/common` / `@nestjs/core` 등 6 패키지 catalog 추가 + `experimentalDecorators` / `emitDecoratorMetadata` tsconfig 옵션 + `reflect-metadata` 런타임 dep + `@nestjs/core` `allowBuilds: true` (postinstall) — 모두 정상 작동. 후속 backend 패키지(spec-03-02~07)가 *동일 catalog 그대로* 사용 가능.

### 6. `@types/node` devDep 누락 → typecheck fail

backend 패키지는 `process.env` 같은 Node global 사용 → `@types/node` 필요. base tsconfig는 *types 미지정*이라 *@types/* 자동 include*하지만 *node*는 별도 — 명시적 `types: ["node"]` + devDep 추가 필요. 후속 backend 패키지에 *공통 패턴 반복 가능* — Icebox 후보로 *backend tsconfig variant* (예: `@repo/typescript-config/node`) 격상.

## 📚 산출물

- **신규 패키지**: `packages/backend/settings/` (`@repo/backend-settings`)
  - `defineSettings` / `introspectEnvSchema` / `DEFAULT_SECRET_PATTERNS` / `DEFAULT_DOCS_BASE` / `NodeSettingsError` / `presets` re-export
  - `BaseBackendSchema` (NODE_ENV / PORT / LOG_LEVEL) + `BaseBackendInput` / `BaseBackendOutput`
  - `BACKEND_SETTINGS` symbol + `BackendSettingsModule.forRoot(loader, env?)`
- **catalog 추가**: `@env-kit/node-settings` ^1.1.0 + NestJS 6종 (common/config/core/testing/reflect-metadata/rxjs)
- **외부**: `Changsik00/node-settings` PR #6 머지 + v1.1.0 npm publish
- **commit 흐름**:
  - `d6389df` T2 scaffold + 정찰
  - `cdb80f7` T3 re-export + 첫 test
  - `93174bb` T4 BaseBackendSchema
  - `64bcc2c` T5 BackendSettingsModule
  - `5c4c57f` T6 dogfooding
  - (예정) T7 ship commit
- **test 누적**: 113 (utils 16 + errors 56 + validation 20 + contracts 6 + auth-contracts 7 + **backend-settings 8**)
- **검증**: lint / typecheck / test (FULL TURBO) / depcruise (30 modules / 39 deps / 0 violations)

## 🔗 후속

- **즉시**: 본 PR 머지 (`phase-03-backend-foundation` base branch에 머지 — Phase Base Branch 모드 첫 동작)
- **phase-03 다음 spec**: `spec-03-02 backend-logger` (pino + request-id + redaction + dev pretty + NestJS interceptor adapter). `BaseBackendSchema.LOG_LEVEL` 직접 사용.
- **Icebox 신규 후보**:
  - `sdd phase activate` 재실행 시 spec state 보존 (memory와 별 도구 fix)
  - phase 템플릿 *Base Branch 필드 description 분리* (메타 파싱 안전성)
  - `@repo/typescript-config/node` variant (backend 공통 `types: ["node"]` 패턴)
- **phase-10 (Ops)**: `@env-kit/node-settings` *generators/* sub-export로 `.env.example` / Markdown docs / K8s manifest 자동 생성 + CI 검증
