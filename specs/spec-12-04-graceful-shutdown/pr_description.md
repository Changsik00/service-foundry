# feat(spec-12-04): Graceful Shutdown + Lifecycle (`@repo/backend-lifecycle`)

## 📋 Summary

### 배경 및 목적
SIGTERM 시 graceful drain·정리 훅이 없고 readiness≠liveness 미구분이었다. 본 spec 은 `@repo/backend-lifecycle`(readiness + shutdown 드레인) + apps/api `/health/live`·`/health/ready` + SIGTERM 배선을 추가해 무중단 배포 기반을 마련한다. **phase-12 마지막 spec.**

### 주요 변경
- [x] **`@repo/backend-lifecycle`** — `createLifecycle()`: readiness 플래그 + `onShutdown` 훅 + `shutdown(timeout)` (idempotent, 행 방지)
- [x] apps/api `/health/live`(항상 200) + `/health/ready`(종료 중 503)
- [x] apps/api SIGTERM/SIGINT → readiness=false → `app.close` 드레인 → exit

### Phase 컨텍스트
- **Phase**: `phase-12` (Service Foundations I · Runtime) — 4/4 (마지막)
- **역할**: 성공 기준 4(graceful shutdown, readiness≠liveness) 충족.

## 🎯 Key Review Points
1. **차단 순서**: readiness=false 가 정리보다 먼저 → LB 가 트래픽 먼저 끊고 드레인.
2. **행 방지**: `shutdown({timeoutMs})` 가 멈춘 훅에도 resolve.
3. **core 경계**: lifecycle 로직은 framework-agnostic, health controller 가 real lifecycle 주입으로 검증.

## 🧪 Verification
```bash
pnpm --filter @repo/backend-lifecycle test                              # 5 passed
pnpm --filter @apps/api exec vitest run src/health/health.controller.test.ts  # 4 passed
pnpm --filter @apps/api typecheck                                       # 0
```

## 📦 Files Changed
### 🆕 New
- `packages/backend/lifecycle/src/index.ts` (+test)
- `apps/api/src/lifecycle/{lifecycle.provider,lifecycle.module}.ts`
- `apps/api/src/health/health.controller.test.ts`
### 🛠 Modified
- `apps/api/src/health/health.controller.ts` (+live/ready), `main.ts` (+SIGTERM drain), `app.module.ts`, `package.json`

**Total**: 13 files (+257)

## ✅ Definition of Done
- [x] lifecycle 단위 PASS (5, 타임아웃 포함)
- [x] health /live·/ready (4) + typecheck
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-12.md` — 본 머지 후 phase-12 ship 후보
- 후속: 정밀 드레인, k8s probe(phase-15)
