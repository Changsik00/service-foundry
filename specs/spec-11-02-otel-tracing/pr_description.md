# feat(spec-11-02): OTEL 분산추적 (apps/api → tempo)

## 📋 Summary

### 배경 및 목적
phase-10 의 tempo 는 stub 으로 기동만 됐고 trace 를 보내는 쪽이 없었다. 본 spec 은 `@repo/backend-observability`(core)를 신설해 apps/api 가 OTEL trace 를 tempo 로 export 하게 한다 — "운영 가능" 의 분산추적 축.

### 주요 변경
- [x] **`@repo/backend-observability`** — `resolveTracingConfig`(순수, env→설정) + `createTracingSdk`(NodeSDK + OTLP proto exporter + Node 자동계측 + service.name resource) + `startTracing`(opt-in)
- [x] apps/api `main.ts` 최상단 env-gated tracing init — **미설정 시 부트 불변**
- [x] compose tempo 에 OTLP `4317`/`4318` 노출
- [x] 통합 스모크: 패키지로 span 방출 → tempo query 재조회 확인

### Phase 컨텍스트
- **Phase**: `phase-11` (Observability + App Generator) — 관측 코어 첫 조각
- **역할**: 성공 기준 2(apps/api trace → tempo) 충족. 11-03(metrics)/11-04(grafana)의 토대.

## 🎯 Key Review Points
1. **opt-in**: OTLP endpoint 미설정 시 `startTracing` → null(no-op). 기존 동작 0 영향 (수동 검증 exit 0).
2. **init 순서**: `import "./tracing.js"` 를 main.ts 최상단에 — 자동계측이 모듈 require 전 패치.
3. **core 경계**: 패키지는 framework-agnostic (@nestjs 의존 없음, ADR-0015).
4. **통합 검증**: full apps/api 부트 대신 패키지→tempo 직접 export 경로 검증 (가볍고 결정론적).

## 🧪 Verification
```bash
pnpm --filter @repo/backend-observability test       # 7 passed
bash packages/backend/observability/smoke-trace.sh   # tempo 에서 trace 확인
```

## 📦 Files Changed
### 🆕 New (@repo/backend-observability)
- `src/config.ts` (+`.test.ts`), `src/tracing.ts` (+`.test.ts`), `src/index.ts`
- `emit-span.ts`, `smoke-trace.sh` (통합)
- package.json/tsconfig/vitest.config (생성기 scaffold)
### 🛠 Modified
- `apps/api/src/main.ts` (+tracing import), `apps/api/src/tracing.ts` (신규 init), `apps/api/package.json` (+dep)
- `tooling/docker/compose.yaml` (tempo OTLP 포트)
- `pnpm-workspace.yaml` (@opentelemetry/* catalog 6종)

**Total**: 16 files (+1788, lockfile 포함)

## ✅ Definition of Done
- [x] `resolveTracingConfig` 단위 PASS (7)
- [x] 통합 trace export 스모크 PASS
- [x] apps/api opt-in init + 미설정 부트 불변
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-11.md`
- 후속: spec-11-03 (metrics), spec-11-04 (grafana)
