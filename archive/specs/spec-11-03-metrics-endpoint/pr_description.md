# feat(spec-11-03): 메트릭 엔드포인트 + auth 카운터

## 📋 Summary

### 배경 및 목적
11-02 로 trace 는 tempo 로 가지만 메트릭이 없었다. 본 spec 은 prom-client 기반 auth 카운터 + apps/api `/metrics` 엔드포인트 + prometheus scrape 를 추가해 로그인 보안 이벤트를 수치로 관측 가능하게 한다 (11-04 grafana 대시보드/alert 의 토대).

### 주요 변경
- [x] `@repo/backend-observability` **`createAuthMetrics()`** — prom-client Registry + `auth_login_{attempts,success,failure}_total`
- [x] apps/api **`GET /metrics`** (prom text) — @Global `ObservabilityModule`
- [x] auth.controller signin 경계에서 attempt/success/failure 카운터 증가
- [x] `prometheus.yml` apps/api scrape target (`host.docker.internal:2026`)

### Phase 컨텍스트
- **Phase**: `phase-11` — 관측 코어 2/3 (trace→metric→dashboard)
- **역할**: 성공 기준 3(/metrics + auth 카운터 + scrape) 충족. 11-04 alert 의 데이터원.

## 🎯 Key Review Points
1. **core 경계**: 카운터 primitives 는 prom-client(framework-agnostic) `@repo/backend-observability`. nestjs 어댑터는 후속.
2. **@Global DI**: `ObservabilityModule` 가 AUTH_METRICS 를 export → MetricsController(app) + auth.controller(AuthModule) 공유.
3. **wiring 위치**: signin try/catch 경계 — 성공/실패 분기 명확.
4. **테스트 동반 갱신**: 신규 required 주입(AUTH_METRICS) → auth.controller.test 에 mock provider 추가(회귀 수정).

## 🧪 Verification
```bash
pnpm --filter @repo/backend-observability test    # 10 passed (metrics 3 포함)
pnpm --filter @apps/api typecheck                 # 0
docker compose -f tooling/docker/compose.yaml config --quiet
```
auth.controller.test 10 passed.

## 📦 Files Changed
### 🆕 New
- `packages/backend/observability/src/metrics.ts` (+`.test.ts`)
- `apps/api/src/metrics/{auth-metrics.provider,metrics.controller,observability.module}.ts`
### 🛠 Modified
- `apps/api/src/app.module.ts` (+ObservabilityModule), `auth/auth.controller.ts` (+카운터), `auth/auth.controller.test.ts` (+mock)
- `backend-observability/{package.json,src/index.ts}` (+prom-client)
- `prometheus.yml` (apps/api scrape), `pnpm-workspace.yaml` (prom-client catalog)

**Total**: 13 files (+168)

## ✅ Definition of Done
- [x] `createAuthMetrics` 단위 PASS (10)
- [x] /metrics 엔드포인트 + 카운터 wiring (typecheck)
- [x] prometheus.yml scrape (compose config)
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-11.md`
- 후속: spec-11-04 (grafana dashboards + alerts)
