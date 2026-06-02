# feat(spec-03-01): @repo/backend-settings — @env-kit/node-settings wrap + BaseBackendSchema + NestJS adapter

> Phase 3 (Backend Foundation)의 **첫 spec** + **Phase Base Branch 모드 첫 적용** + **외부 라이브러리 zod 4 migration 우회작업 포함**.

## 📋 Summary

### 배경 및 목적

Phase 3 진입 후 첫 spec. `packages/backend/*`의 *기반*인 settings 패키지 — env validation + runtime config + NestJS DI 통합. memory `project_boilerplate_locked_stack`의 *"node-settings를 dep으로 받아 wrap (dogfooding)"* 결정을 실현. 모든 backend 패키지가 본 패키지를 통과시켜 `process.env` 직접 접근 금지.

### 주요 변경 사항

- [x] **`packages/backend/settings/` 신규 패키지** (`@repo/backend-settings`)
  - `@env-kit/node-settings` re-export 6종 (defineSettings / introspectEnvSchema / DEFAULT_SECRET_PATTERNS / DEFAULT_DOCS_BASE / NodeSettingsError / presets)
  - `BaseBackendSchema` (NODE_ENV 4값 / PORT coerce int default 3000 / LOG_LEVEL pino 6단계 default info)
  - `BACKEND_SETTINGS` symbol injection token + `BackendSettingsModule.forRoot(loader, env?)` NestJS DynamicModule adapter
- [x] **catalog 추가**: `@env-kit/node-settings` ^1.1.0 + NestJS 6종 (common/config/core/testing/reflect-metadata/rxjs)
- [x] **pnpm-workspace.yaml**: `allowBuilds: '@nestjs/core': true` (postinstall)
- [x] **외부 라이브러리 업그레이드**: `@env-kit/node-settings@1.0.2` → `1.1.0` (zod 3 peer dep → zod 4)
  - PR `Changsik00/node-settings#6` 머지 + v1.1.0 npm publish 완료
  - 마이그레이션 7 파일 (CHANGELOG / package.json / lock / introspect / zod-issues / validate-options ×2)
  - 294/294 test pass under zod 4

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation` (base branch — 첫 ship 시 자동 생성)
- **본 SPEC의 역할**:
  - 후속 backend 패키지(spec-03-02 logger / 03-04 database / 03-05 observability / 03-07 apps/api scaffold)가 *모두 본 패키지 의존* — 일관된 env validation
  - dogfooding — service-foundry 차별화 포인트(env auto-doc / K8s manifest drift 검출)의 *진입점*

## 🎯 Key Review Points

1. **외부 라이브러리 zod 4 migration이 본 PR의 *블로커*였음**: `@env-kit/node-settings@1.0.2` zod 3 peer dep 발견 → Hard Stop. 옵션 4 (zod 3 별도 설치 / 라이브러리 업그레이드 / 자체 구현 / spec 중단) 분석 후 **라이브러리 업그레이드 채택**. 사용자 본인 라이브러리라 가능했고, ADR-0002/0010 zod 4 catalog 일관성 유지. 자세한 내용은 walkthrough §외부 라이브러리 zod 4 migration.
2. **라이브러리 wrap이 *얇은 re-export 패턴***: 정찰에서 `defineSettings` factory가 이미 풍부 (envSchema/perEnv/overrideEnvKey/build) — 자체 `defineSettings` 단순 wrap은 *겹침*. 본 spec은 *re-export + BaseBackendSchema + NestJS adapter*만 추가. plan.md 의도와 일관.
3. **`BackendSettingsModule` 객체 리터럴 패턴**: NestJS `@Module` decorator class 대신 *DynamicModule 객체 리터럴*. NestJS를 런타임 dep로 끌어들이지 않음 (호출자 책임) + Fastify/Hono adapter 추가 시 같은 패턴 재사용 가능. 단점: `forRootAsync` 등 reflection 기능 불가 — 필요 시 phase-09 이후 정정.
4. **`BaseBackendSchema` 최소 3 키**: NODE_ENV / PORT / LOG_LEVEL. 후속 패키지가 `.extend({ DATABASE_URL: ..., REDIS_URL: ... })` 패턴으로 확장. NODE_ENV에 *test* 포함 (vitest 자연 매핑).
5. **NestJS 도입 첫 spec — 검증 완료**: catalog 6 패키지 + `experimentalDecorators` / `emitDecoratorMetadata` + `reflect-metadata` 런타임 + `allowBuilds` 모두 정상. 후속 backend 패키지가 *동일 catalog 그대로* 사용 가능.
6. **Phase Base Branch 모드 첫 검증**: sdd state.json `baseBranch: phase-03-backend-foundation` 박힘. 첫 ship 시 phase branch 자동 생성 + 본 PR base = phase branch. main 직접 머지 아님 — phase 단위 통합 검증.
7. **dogfooding scope 조정**: 본래 *.env.example 생성*까지 박을 계획이었으나 라이브러리 generators는 `generators/` sub-export — 본 spec scope 밖. *`introspectEnvSchema` round-trip 검증*으로 대체 (raw metadata 추출). `.env.example` / Markdown docs / K8s manifest 생성기 검증은 phase-10 Ops.
8. **memory `feedback_spec_x_phase_activate` 패턴 확장**: `sdd phase activate` 재실행도 spec state 리셋. state.json 수동 복구 필요. *sdd 도구 개선 후보* (walkthrough §발견 사항 #1).
9. **phase-03.md Base Branch 필드 description 분리**: phase 메타 파싱 시 description text가 baseBranch 값에 섞이는 버그 발견 + 분리로 해소. *phase 템플릿 docs 보강 후보* (walkthrough §발견 사항 #2).
10. **`@types/node` 명시적 dep + tsconfig types 명시**: backend 패키지는 `process.env` 등 Node global 사용 → 후속 backend 패키지 공통 패턴. *`@repo/typescript-config/node` variant* 격상 후보 (walkthrough §발견 사항 #6).

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning + NestJS postinstall 정상
- ✅ `pnpm lint`: Biome PASS (6 패키지)
- ✅ `pnpm typecheck`: FULL TURBO cache hit
- ✅ `pnpm test`: **113 test PASS** (utils 16 + errors 56 + validation 20 + contracts 6 + auth-contracts 7 + **backend-settings 8 신규**)
- ✅ `depcruise`: 0 violations (30 modules / 39 deps — backend-settings 합류 후)

### 수동 검증

1. **`defineSettings` round-trip** ✅:
   ```ts
   const loader = defineSettings({
     envSchema: z.object({ APP_ENV: z.enum(["local","prod"]).default("local") }),
     envKey: "APP_ENV",
     defaults: { region: "us-east-1" },
     perEnv: { local: {region: "us-east-1"}, prod: {region: "us-west-2"} },
     build: (_env, layered) => ({ region: layered.region }),
   });
   loader({ APP_ENV: "prod" }).region === "us-west-2"
   ```
2. **`BaseBackendSchema` 기본값** ✅: `{ NODE_ENV: "test" }` → `{ NODE_ENV: "test", PORT: 3000, LOG_LEVEL: "info" }`
3. **`BackendSettingsModule.forRoot()`** ✅: DynamicModule 구조 (module / providers / exports / global) + BACKEND_SETTINGS provider value 일치
4. **`introspectEnvSchema(BaseBackendSchema)`** ✅: 3 field 추출 (NODE_ENV enum required / PORT number !required defaultValue=3000 / LOG_LEVEL enum)
5. **외부 라이브러리 npm**: `@env-kit/node-settings@1.1.0` registry 등록 확인.

## 📐 Architecture / Decision

- [x] **walkthrough.md** — 결정 기록 13건 + 사용자 협의 4건 + Phase Base Branch 검증 + `@env-kit/node-settings` 정찰 + 외부 zod 4 migration 요약 + 발견 사항 6건
- [x] **pr_description.md** — 본 문서
- [ ] ADR — 없음 (본 spec은 결정 적용. 후속 backend 패키지에서 패턴 반복 시 격상)

## 🚫 Out of Scope (의도적 deferral)

- **`.env.example` / Markdown docs / K8s manifest 생성** — `@env-kit/node-settings`의 `generators/` sub-export에 있음. phase-10 Ops에서 CI 통합.
- **`forRootAsync` 비동기 loader** — async config (예: AWS Secrets Manager 조회) 필요 시 phase-09 이후.
- **secret 관리** (Vault / AWS Secrets Manager) — node-settings의 secret 분류 패턴 활용 + Vault 통합은 phase-09 이후.
- **logger / database / observability schema** — 각 후속 spec(spec-03-02/04/05)에서 본 패키지 `.extend()`로 추가.
- **apps/api wire-up** — spec-03-07 (apps-api-scaffold).
- **`@repo/typescript-config/node` variant** — Icebox 후보 (backend 공통 패턴).

## 🔗 Related

- **선행**:
  - phase-02 (`@repo/utils` / `@repo/errors` / `@repo/validation` / `@repo/contracts` / `@repo/auth-contracts`)
  - ADR-0002 (zod 4 catalog), ADR-0005 (NestJS+Drizzle), ADR-0009 (AppError flat code), ADR-0010 (parse/fromZodError)
  - memory `project_boilerplate_locked_stack` (dogfooding decision)
- **외부 작업**:
  - `Changsik00/node-settings` PR #6 (zod 4 migration) — 머지 + v1.1.0 publish 완료
- **후속**:
  - phase-03 spec-03-02 backend-logger (pino + LOG_LEVEL 사용)
  - phase-03 spec-03-04 backend-database (DATABASE_URL env)
  - phase-03 spec-03-07 apps-api-scaffold (BackendSettingsModule wire-up)
- **코드**: [`packages/backend/settings/`](../../packages/backend/settings/)
- **외부**: https://github.com/Changsik00/node-settings/pull/6 + https://www.npmjs.com/package/@env-kit/node-settings/v/1.1.0
