# feat(spec-03-07): `@repo/nestjs-security` — helmet + cors helper + `@nestjs/throttler` Module

> Phase 3 (Backend Foundation) **7번째 spec, 마지막 인프라 어댑터**. `applySecurity(app, opts)` helper (helmet + cors) + `BackendThrottlerModule.forRoot()` (`@nestjs/throttler` wrap + `APP_GUARD` 자동 등록). ADR-0015 + ADR-0016 답습. 기존 코드 영향 0 (신규 패키지 추가).

## 📋 Summary

### 배경 및 목적

phase-03 인프라 어댑터 4개 (`nestjs-settings/logger/http-client/database`) 안정 후, 마지막 *HTTP security middleware* 영역 박음. helmet/cors/rate-limit preset 한 곳에 표준화 → `apps/api` scaffold (spec-03-08 예정) 가 자연스럽게 wire-up 가능.

### 주요 변경 사항

- [x] **신규 패키지 `@repo/nestjs-security`** (`packages/nestjs/security/`):
  - `applySecurity(app: INestApplication, opts?: SecurityOptions): void` helper
    - helmet wire-up (`app.use(helmet(opts.helmet))`)
    - cors wire-up (`app.enableCors(opts.cors)`)
    - `opts.helmet === false` / `opts.cors === false` 시 각각 skip
  - `BackendThrottlerModule.forRoot(opts?: BackendThrottlerOptions): DynamicModule` (ADR-0016 표준 `@Module` class)
    - `@nestjs/throttler` 의 `ThrottlerModule.forRoot([{ ttl, limit }])` wrap
    - `APP_GUARD` provider 자동 등록 (`ThrottlerGuard`) — *모든 라우트 자동 rate-limit*
    - default `ttl: 60_000ms` (60s) / `limit: 100req`
    - `global: true`

- [x] **catalog 갱신** (`pnpm-workspace.yaml`):
  - `helmet: ^8.1.0`
  - `@nestjs/throttler: ^6.5.0` (NestJS 11 peer 호환)

- [x] **단위 테스트 7 신규**:
  - `applySecurity` 4 (default / helmet false / cors false / cors forward)
  - `BackendThrottlerModule` 3 (DynamicModule 구조 / APP_GUARD provider / 사용자 지정 ttl·limit)

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행 ADR**: [ADR-0015](../docs/adr/0015-framework-adapter-naming-and-layout.md) (PR #11), [ADR-0016](../docs/adr/0016-nestjs-adapter-standard-module-pattern.md) (PR #15)
- **본 SPEC 역할**: phase-03 마지막 *인프라 어댑터*. 다음 spec-03-08 (apps-api-scaffold) 이 통합 검증.

## 🎯 Key Review Points

1. **🎯 패키지 레이아웃 — `nestjs-security` 단일 (pure backend layer 없음)**: helmet/cors/throttler 자체가 *HTTP/NestJS-specific* — pure layer *공허화* 가능성. spec-03-02~05 의 backend/* + nestjs/* 분리 패턴 *답습하지 않음*. ADR-0015 *각 영역의 자연 결을 따른다* 정신 적용.

2. **helmet 은 helper, throttler 는 Module — 비대칭 의도적**: helmet 은 `app.use()` 호출 — *app instance 시점*. throttler 는 *DI provider + Guard* — *모듈 등록 시점*. 두 패턴 공존이 NestJS ecosystem 답습. 강제 통일 시 어색.

3. **`APP_GUARD` 자동 등록 — 모든 라우트 영향**: `BackendThrottlerModule` import 만으로 모든 라우트 자동 rate-limit. dev 가 `ThrottlerGuard` 등록 잊을 위험 0. opt-out 은 `@SkipThrottle()` decorator (사용자 책임). **현실적 한계**: apps/api health probe 등 빈번 endpoint 와 default 100req/60s 충돌 가능 — per-app tuning 또는 `@SkipThrottle()` 박음.

4. **default preset (`ttl: 60_000`, `limit: 100`)**: 합리적 baseline. 운영시 app 별 tuning. 분산 환경 진입 시 `@nestjs/throttler` Redis storage 박는 별 spec (현재는 in-memory).

5. **ADR-0016 답습 — `@Module` decorator class 패턴**: `BackendThrottlerModule` 도 객체 리터럴 없이 표준 `@Module({}) class { static forRoot }`. spec-03-06 의 4 어댑터 와 동일 패턴. biome `noStaticOnlyClass` override 자동 적용 (`packages/nestjs/**`).

6. **TDD Red 와 pre-commit typecheck 충돌 — stub function 패턴**: Red 단계에서 import 깨지면 pre-commit 가 막음. **해결**: stub fn (throw `not implemented`) 박아 typecheck 통과 + runtime 은 fail. 후속 spec 동일 패턴 답습 가능.

7. **`pnpm exec depcruise` 0 violations** (67 modules / 102 deps): ADR-0015 룰 그대로 통과. `@repo/nestjs-security` 추가로 +6 module / +9 dep 만 증가 — *경량 어댑터*.

8. **commit 단위 (6 commit)**: chore catalog → feat scaffold → test+feat (applySecurity) → test+feat (throttler). TDD Red/Green 분리 — revert 단위 명확.

9. **신규 패키지 추가만 — 기존 코드 영향 0**: `applySecurity` / `BackendThrottlerModule` 호출 site 0 (apps 미존재 — spec-03-08 예정). 본 PR 단독 *동작 변경 0*.

10. **phase-03 인프라 어댑터 영역 완료**: 본 PR 머지 시 phase-03 의 5 어댑터 (`nestjs-settings/logger/http-client/database/security`) 모두 박힘. 다음 spec-03-08 (`apps-api-scaffold`) 이 모든 어댑터 통합 wire-up + Repository 패턴 실 예제.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**:
- ✅ `pnpm lint`: 14 tasks PASS
- ✅ `pnpm typecheck`: 14 tasks FULL TURBO
- ✅ `pnpm test`: **153 test PASS** (nestjs-security 7 신규 + 기타 146)
- ✅ `depcruise`: **0 violations** (67 modules / 102 dependencies)

### test 분포 (7 신규)

| describe | test 수 | 검증 |
|---|:---:|---|
| `applySecurity` | 4 | default opts / helmet false / cors false / cors forward |
| `BackendThrottlerModule` | 3 | DynamicModule 구조 / APP_GUARD provider / 사용자 지정 ttl·limit |

### 수동 검증

```bash
# 1. export 확인
grep "export function applySecurity\|export class BackendThrottlerModule" packages/nestjs/security/src/index.ts
# → 2 hit ✓

# 2. APP_GUARD 자동 등록
grep "APP_GUARD" packages/nestjs/security/src/index.ts
# → 2 hit (import + provide) ✓

# 3. 표준 @Module decorator (ADR-0016)
grep "@Module" packages/nestjs/security/src/index.ts
# → 1 hit ✓
```

## 🔗 참조

- **ADR**: [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md), [`docs/adr/0016-nestjs-adapter-standard-module-pattern.md`](../docs/adr/0016-nestjs-adapter-standard-module-pattern.md)
- **walkthrough**: `specs/spec-03-07-backend-security/walkthrough.md` (결정 10 + 사용자 협의 4 + 발견 7)
- **선행 spec 작업**: spec-03-02~06 — 5 어댑터 + ADR 박힌 작업
- **후속 spec**: spec-03-08 apps-api-scaffold — Repository 패턴 실 예제 + 모든 어댑터 통합

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-07 → Merged)
- [ ] 사용자 알림 + spec-03-08 (apps-api-scaffold) 진입 옵션

## ✅ Definition of Done

- [x] `@repo/nestjs-security` 패키지 작성 (`applySecurity` helper + `BackendThrottlerModule`)
- [x] catalog 갱신 (`helmet` + `@nestjs/throttler`)
- [x] 단위 테스트 7 PASS
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] `pnpm exec depcruise` 0 violations
- [x] 수동 검증 — export 2 / APP_GUARD 2 / @Module 1
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
