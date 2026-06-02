# feat(spec-03-08): `apps/api` NestJS app — 5 어댑터 통합 wire-up + `GET /health`

> Phase 3 (Backend Foundation) **마지막 spec**. `apps/api` 신설 — phase-03 의 5 어댑터 (`nestjs-settings/logger/http-client/database/security`) 통합 검증 시점. health-check 스켈레톤 + supertest E2E + 수동 부트 그린. 실 도메인 / Repository 패턴 구현은 phase-04+ 영역.

## 📋 Summary

### 배경 및 목적

phase-03 의 5 인프라 어댑터 단위 테스트만 — *함께 동작* 검증 시점 부재. apps/* 디렉토리 자체 미존재. 본 spec 이 *통합 검증 첫 시점*. phase-03 성공기준 §5 ("apps/api scaffold 가 본 패키지들 wire up → booted NestJS app 이 `/health`에 200 응답") 충족.

### 주요 변경 사항

- [x] **신규 `apps/api/`** (phase-03 첫 NestJS app):
  - `package.json` (`@apps/api` private, 5 어댑터 deps + `tsx` + `supertest`)
  - `tsconfig.json` / `vitest.config.ts` (다른 nestjs 어댑터와 동일 패턴)
  - `env.example` (NODE_ENV / PORT / LOG_LEVEL / DATABASE_URL / HTTP_CLIENT_BASE_URL)
  - `README.md` (부트 가이드 + Repository 패턴 phase-04+ 예고)
  - `src/settings.ts` (`defineSettings({ envSchema: BaseBackendSchema.extend(...) })`)
  - `src/main.ts` (`NestFactory.create + applySecurity + useLogger + listen`)
  - `src/app.module.ts` (5 어댑터 `forRoot` + HealthController)
  - `src/health/health.controller.ts` (`@Controller("health") + @SkipThrottle() + @Get()`)
  - `src/health/health.e2e.test.ts` (supertest `GET /health` 200 + body shape)

- [x] **catalog 갱신** (`pnpm-workspace.yaml`):
  - `@nestjs/platform-express: ^11.1.21`
  - `supertest: ^7.2.2`
  - `@types/supertest: ^7.2.0`

- [x] **E2E test 1 신규**: supertest `GET /health` 200 + `{ status, uptime, version }`

### Phase 컨텍스트

- **Phase**: `phase-03` Backend Foundation (Phase Base Branch 모드)
- **PR Target**: `phase-03-backend-foundation`
- **선행 spec**: spec-03-02 ~ 07 (5 어댑터 + 2 ADR 박힌 작업)
- **본 SPEC 역할**: phase-03 마지막 spec — *통합 검증 + phase ship 직전*

## 🎯 Key Review Points

1. **🎯 5 어댑터 통합 검증 첫 시점**: 단위 테스트만이었던 5 어댑터가 *함께* 동작 확인. forRoot 시그니처 충돌 없음 / `APP_GUARD` 자동 등록 + `@SkipThrottle()` 정상 / pino logger 어댑터 우회 없이 NestJS logger 통합 / `pg.Pool` lazy connection 으로 부트 시점 DB 검증 안 됨 — *통합 가능성 확인됨*.

2. **수동 부트 검증 — `curl /health` 200 ✓**:
   ```bash
   NODE_ENV=development PORT=3007 DATABASE_URL=postgres://localhost:5432/test \
     HTTP_CLIENT_BASE_URL=http://localhost:9999 npx tsx apps/api/src/main.ts &
   curl http://localhost:3007/health
   # → {"status":"ok","uptime":6.79,"version":"0.0.0"}
   ```

3. **scope 의도적 제한 — health-check 스켈레톤**: 실 도메인 (User / Tenant 등), Repository 패턴 실 구현, drizzle migration 워크플로 — 모두 *phase-04+ 영역*. 본 spec 은 *통합 검증 시점* 만. README 의 Repository 패턴 가이드 박음 (phase-04+ 진입 시 답습).

4. **`@SkipThrottle()` 적용 — ThrottlerGuard 자동 등록 검증**: `BackendThrottlerModule` 의 `APP_GUARD` 자동 등록이 *실제 모든 라우트 영향*. health 가 `@SkipThrottle()` 박혀 k8s probe 빈도 한계 무시. spec-03-07 의 우려 *코드로 검증* 됨.

5. **process.env stub in test + dynamic import**: `AppModule` 이 *module load 시점* settings 로딩 → test 안 env stub 필수. 해결: e2e test 상단 `process.env.X ??= "..."` + `await import("../app.module.js")`. *후속 app 패턴 답습 가능*. 또는 forRootAsync 패턴 검토 (이월).

6. **`.env.example` Write 차단 → `env.example` 채택**: Claude Code 가 `.env*` 패턴 Write 자동 차단 (사용자 권한 부여 무관). 사용자 협의 후 *점 없는* `env.example` 채택 + README rename 가이드. dotenv 컨벤션 약하지만 reference 파일이라 영향 적음.

7. **logger 통합 검증**: `app.useLogger(app.get(PinoLoggerService))` — NestJS 표준 logger 대신 어댑터 logger 사용. 부트 로그가 pino 형식 출력 ✓. 통합 가치 핵심 검증.

8. **`pnpm exec depcruise` 0 violations** (76 modules / 126 deps): ADR-0015 룰 통과. apps/api 가 packages/frontend/* import 없음 / 5 어댑터 의존 모두 표준.

9. **commit 5개 (excl ship)**: chore catalog → feat scaffold → test Red → feat Green → feat main+README. TDD Red/Green 분리 + 깔끔한 revert 단위.

10. **phase-03 인프라 완료**: 본 PR 머지 시 phase-03 의 8 spec (settings/logger/governance/relocate/http-client/database/rework/security/apps-api) 모두 완료. 통합 검증 그린 → phase ship 진입 가능.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

**결과**:
- ✅ `pnpm lint`: 15 tasks PASS
- ✅ `pnpm typecheck`: 15 tasks FULL TURBO
- ✅ `pnpm test`: **154 test PASS** (apps/api E2E 1 신규 + 기존 153)
- ✅ `depcruise`: **0 violations** (76 modules / 126 dependencies)

### 수동 부트 검증

```bash
# 1. env 셋업 (env.example 복사 후 .env 박음 — 또는 직접 export)
cp apps/api/env.example apps/api/.env

# 2. 부트
pnpm --filter @apps/api start

# 3. health 호출
curl http://localhost:3000/health
# → {"status":"ok","uptime":1.234,"version":"0.0.0"}
```

### 수동 검증 grep

```bash
# 1. apps/api 신설
ls apps/api/
# → package.json/tsconfig.json/vitest.config.ts/env.example/README.md/src/ ✓

# 2. 5 어댑터 모두 wire-up
grep -E "Module\.forRoot|applySecurity" apps/api/src/{app.module.ts,main.ts}
# → 5 forRoot + 1 applySecurity ✓

# 3. HealthController @SkipThrottle
grep "@SkipThrottle\(\)" apps/api/src/health/health.controller.ts
# → 1 hit ✓
```

## 🔗 참조

- **ADR**: [`docs/adr/0015-framework-adapter-naming-and-layout.md`](../docs/adr/0015-framework-adapter-naming-and-layout.md), [`docs/adr/0016-nestjs-adapter-standard-module-pattern.md`](../docs/adr/0016-nestjs-adapter-standard-module-pattern.md)
- **walkthrough**: `specs/spec-03-08-apps-api-scaffold/walkthrough.md` (결정 12 + 사용자 협의 3 + 진행 7 + 발견 8 + 이월 5)
- **선행 spec**: spec-03-02~07 — 5 어댑터 + 2 ADR
- **후속**: phase ship (`/hk-phase-ship`) — phase-03 머지 후 phase-04 진입

## 📝 Post-Merge

- [ ] Merge → `phase-03-backend-foundation` (Phase Base Branch 모드)
- [ ] Auto-sync: `backlog/phase-03.md` / `backlog/queue.md` (spec-03-08 → Merged)
- [ ] **phase ship 절차** (`/hk-phase-ship`) — phase-03 성공기준 검증 + 통합 테스트 + main 머지

## ✅ Definition of Done

- [x] `apps/api/` 디렉토리 신설 (package.json / tsconfig / vitest.config.ts / env.example)
- [x] `AppModule` — 5 어댑터 forRoot + HealthController 등록
- [x] `HealthController` — `GET /health` 200 + `@SkipThrottle()`
- [x] `main.ts` — applySecurity + NestFactory + listen
- [x] E2E test PASS (supertest GET /health 200)
- [x] `pnpm lint` / `pnpm typecheck` / `pnpm test` 모두 그린 (15 tasks / 154 test)
- [x] `pnpm exec depcruise` 0 violations
- [x] 수동 부트 검증 (`curl /health` 200) ✓
- [ ] `walkthrough.md` / `pr_description.md` ship commit (본 commit 직후)
- [ ] PR 생성 (base = `phase-03-backend-foundation`)
- [ ] 사용자 알림
