# refactor(spec-03-06): NestJS 어댑터 4 패키지 — 객체 리터럴 → 표준 `@Module` class (ADR-0016)

> Phase 3 (Backend Foundation) **6번째 spec**. ADR-0016 (PR #15) 적용 — 4 어댑터 패키지 코드 재구성. `DatabaseShutdownService` 우회 class 제거 → `DatabaseModule implements OnModuleDestroy` 직접. **동작 변경 0** (forRoot 시그니처 / token export / 호출자 사용 모두 동일).

## 📋 Summary

### 배경 및 목적

ADR-0016 (PR #15) 로 어댑터 모듈 구현 패턴 박힌 후, 5 어댑터 (spec-03-02~05) 가 *임시 위반 상태*. 본 spec 은 *룰을 코드에 적용* — 위반 해소.

### 주요 변경 사항

- [x] **4 어댑터 모두 표준 `@Module` decorator class 채택**:
  - `@repo/nestjs-settings` — `@Module({}) class BackendSettingsModule { static forRoot }`
  - `@repo/nestjs-logger` — 동일 패턴 (PinoLoggerService 그대로)
  - `@repo/nestjs-http-client` — 동일 패턴
  - `@repo/nestjs-database` — 동일 + `implements OnModuleDestroy` (lifecycle hook 직접)

- [x] **`DatabaseShutdownService` 우회 class 제거**:
  - spec-03-05 에서 박은 우회 패턴 — `useValue` 객체에 lifecycle hook 못 박힘 → 별 provider class
  - 본 spec: `DatabaseModule implements OnModuleDestroy` 직접 → 우회 class 더 이상 불필요
  - `private static currentDatabase` field 로 pool 보유 (forRoot static 와 같은 class context)

- [x] **`packages/config/biome-config/base.json` overrides 추가**:
  - `packages/nestjs/**/src/**` 한정 `noStaticOnlyClass: off`
  - NestJS `@Module` class 가 static-only members 만 가지는 표준 패턴 — biome 룰과 충돌 해소
  - inline `biome-ignore` 는 decorator 위 comment 처리 안 됨 → config-level override 가 깔끔

- [x] **test 정정**:
  - NestJS `Provider` union 타입 narrowing — `as any` cast + biome-ignore (4 test 파일)
  - nestjs-database mock 전략 변경 — `vi.mock("@repo/backend-database")` (workspace dep transitive mock 불가)
  - DatabaseShutdownService 관련 test 제거 → `DatabaseModule.onModuleDestroy` 직접 호출 test

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행 ADR**: [ADR-0016](../docs/adr/0016-nestjs-adapter-standard-module-pattern.md) (PR #15 — 룰 박은 spec-x)
- **본 SPEC 역할**: 룰을 *코드에 적용* — 5 어댑터 위반 해소.

## 🎯 Key Review Points

1. **🎯 ADR-0016 1:1 적용 — 5 어댑터 위반 모두 해소**: 객체 리터럴 4개 + `DatabaseShutdownService` 우회 class 1개 → 표준 `@Module` decorator class + `implements OnModuleDestroy` 직접. 검증: `grep "export const \(Backend\|Http\|Database\)" packages/nestjs/` → **0 hit**, `grep "DatabaseShutdownService" packages/nestjs/` → **0 hit**.

2. **동작 변경 0**: `BackendSettingsModule.forRoot(loader)` / `BackendLoggerModule.forRoot(opts)` / `HttpClientModule.forRoot(opts)` / `DatabaseModule.forRoot(opts)` — 모든 forRoot 시그니처 동일. `BACKEND_*` / `HTTP_CLIENT` / `DATABASE` symbol token 동일. *use sites 영향 0* (apps 미존재 — 더더욱 자유).

3. **lifecycle hook 자연 해결 — `DatabaseShutdownService` 제거**: spec-03-05 의 *우회 class + useFactory 패턴* 더 이상 불필요. `DatabaseModule implements OnModuleDestroy` + `async onModuleDestroy()` instance method — *NestJS 표준 lifecycle*. 코드 line count 약 30% 감소.

4. **`private static currentDatabase` 패턴**: NestJS 가 `DatabaseModule` 인스턴스 생성 시 *static field 통해 pool reference 공유*. `forRoot` static method 가 *같은 class context* — 패턴 자연. **현실적 한계**: 같은 Module 두 번 forRoot 호출 시 두 번째가 덮어씀 (multi-tenant 시점에 재검토).

5. **biome `noStaticOnlyClass` ↔ NestJS `@Module` 충돌**: NestJS 표준 패턴 (decorator class with only static `forRoot`) 이 biome 룰과 충돌. **해결**: `packages/config/biome-config/base.json` overrides 로 `packages/nestjs/**` 한정 룰 disable. 후속 어댑터 자동 적용.

6. **vitest workspace dep transitive mock 불가 — 발견 + 해결**: `vi.mock("pg")` 가 *현 패키지 import 만* mock — `@repo/backend-database` (workspace dep) 안 import 못 미침. **해결**: `@repo/backend-database` 자체 mock (`createDatabase` / `shutdown` fake return). 다른 어댑터 패키지에서 동일 패턴 답습 가능.

7. **commit 단위 패키지별 1**: settings / logger / http-client / database — 각자 독립 commit (4 commit). + biome-config override 별 commit (1). 총 5 commit. revert 단위 명확.

8. **test 9 그대로**: 이전 9 test = 본 PR 후 9 test. 위치/내용 거의 동일 — test 코드만 NestJS Provider union 호환 적응. *Refactor 의 모범적 결과*.

9. **`pnpm exec depcruise` 0 violations** (61 modules / 93 deps): ADR-0015 룰 그대로 통과. `@Module` decorator class 도입이 *의존 구조* 변경 없음.

10. **ADR-0016 vs 객체 리터럴 — 실 효과 비교**:
    - **Onboarding**: NestJS 표준 → 새 dev 즉시 이해 (객체 리터럴은 *"왜?"* 질문)
    - **Lifecycle**: `implements OnModuleDestroy` 직접 (우회 class 불필요)
    - **NestJS ecosystem**: `@Module` class 가 `DiscoveryService` / `Reflector` 등에 호환
    - **AI/copilot**: 표준 패턴 — AI 가 잘 만듦. 우리 컨벤션 안 환기

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**:
- ✅ `pnpm lint`: 13 tasks PASS (0 warnings)
- ✅ `pnpm typecheck`: 13 tasks FULL TURBO
- ✅ `pnpm test`: **9 test PASS** (settings 2 + logger 4 + http-client 1 + database 2)
- ✅ `depcruise`: **0 violations** (61 modules / 93 dependencies)

### test 분포 (9)

| 패키지 | test 수 | describe |
|---|:---:|---|
| `@repo/nestjs-settings` | 2 | `BackendSettingsModule.forRoot` (DynamicModule 구조 + provider value) |
| `@repo/nestjs-logger` | 4 | `PinoLoggerService` (2) + `BackendLoggerModule` (2) |
| `@repo/nestjs-http-client` | 1 | `HttpClientModule.forRoot` (DynamicModule + HTTP_CLIENT provider) |
| `@repo/nestjs-database` | 2 | `DatabaseModule.forRoot` (구조) + `DatabaseModule.onModuleDestroy` (lifecycle 직접) |

### 수동 검증

```bash
# 1. 객체 리터럴 잔재 0
grep -rn "export const \(Backend\|Http\|Database\)" packages/nestjs/
# → (no matches) ✓

# 2. 우회 class 잔재 0
grep -rn "DatabaseShutdownService" packages/nestjs/
# → (no matches) ✓

# 3. @Module decorator 4 패키지 모두
grep -l "@Module" packages/nestjs/*/src/index.ts
# → 4 files ✓
```

## 🔗 참조

- **ADR**: [`docs/adr/0016-nestjs-adapter-standard-module-pattern.md`](../docs/adr/0016-nestjs-adapter-standard-module-pattern.md) (PR #15)
- **walkthrough**: `specs/spec-03-06-rework-nestjs-adapters/walkthrough.md` (결정 9 + 사용자 협의 + 발견 8)
- **선행 PR**: #15 (spec-x-nestjs-adapter-standard-module — ADR-0016 박은 PR)
- **선행 spec 작업**: spec-03-02 / 03-03 / 03-04 / 03-05 — 5 어댑터 박힌 작업 (객체 리터럴 패턴)
- **후속 spec**: spec-03-07 apps-api-scaffold — Repository 패턴 실 예제

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-06 → Merged)
- [ ] 사용자 알림 + 후속 spec (spec-03-07 apps-api-scaffold or spec-03-XX backend-security) 진입 옵션

## ✅ Definition of Done

- [x] 4 어댑터 모두 표준 `@Module` decorator class 패턴
- [x] `DatabaseShutdownService` 우회 class 제거
- [x] `DatabaseModule implements OnModuleDestroy` 직접
- [x] biome `noStaticOnlyClass` 룰 override (`packages/nestjs/**`)
- [x] `pnpm test` 그린 (9 test)
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations
- [x] 수동 검증 — 객체 리터럴 0 / DatabaseShutdownService 0
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
