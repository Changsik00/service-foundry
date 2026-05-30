# feat(spec-10-03): tooling 스크립트 번들 (manifest / startup-report / config-graph + security 결정)

## 📋 Summary

### 배경 및 목적

phase-10 의 소형 `tooling/scripts` 유틸 3종과 보안 linter 결정(구 spec-10-03/04/05/07)을 §11.4 bundle 로 한 spec 에 묶어 ceremony 를 절감한다. 앱 포트/의존 선언, 부트 시 config 가시성(시크릿 마스킹), config 스키마 시각화, 보안 linter 도입 여부를 한 번에 정리.

### 주요 변경 사항
- [x] **service-manifest**: `apps/*/service.yaml` + zod validator (`pnpm tooling:manifest`) — 포트중복/depends/스키마 교차검증
- [x] **startup-report**: `maskConfig`(@repo/backend-settings) + apps/api 부트 시 masked config dump 1회 로그
- [x] **config-graph**: `pnpm tooling:config-graph` — settings 스키마 → mermaid flowchart
- [x] **security-linter 결정**: ADR-0019 **No-Go** (phase-11 CI 재평가)

### Phase 컨텍스트
- **Phase**: `phase-10` (Ops & Tooling)
- **역할**: 성공 기준 3(startup report)·4(manifest)·5(config-graph) 충족. 구 10-04/05/07 흡수.

## 🎯 Key Review Points

1. **maskConfig 위치 = `@repo/backend-settings`**: apps/api 가 부트 시 import 하므로 tooling/scripts 가 아닌 settings 패키지에 둠 (layering). 시크릿 평문 미노출은 단위 테스트로 강제.
2. **manifest validator**: 순수 함수 `validateManifests` (zod + 교차검증). service.yaml 의 `depends` 는 앱 간 의존만(인프라는 compose).
3. **config-graph**: `introspectEnvSchema` 재사용으로 zod 직접 reflection 회피.
4. **ADR-0019**: 보안 linter No-Go 근거 (CI 부재 → 강제력 0, phase-11 재평가).

## 🧪 Verification

### 단위 테스트
```bash
pnpm exec vitest run tooling/scripts
pnpm --filter @repo/backend-settings test
```
**결과**: ✅ tooling/scripts 10 + backend-settings 11 passed

### 통합 테스트
```bash
bash tooling/scripts/smoke-test.sh
```
**결과**: ✅ manifest 0 error + config-graph mermaid 출력

## 📦 Files Changed

### 🆕 New
- `apps/{api,web-next,web-vite}/service.yaml`
- `tooling/scripts/manifest/{lib/validate.ts,lib/validate.test.ts,run.ts}`
- `tooling/scripts/config-graph/{lib/to-mermaid.ts,lib/to-mermaid.test.ts,run.ts}`
- `tooling/scripts/smoke-test.sh`
- `packages/backend/settings/src/{mask.ts,mask.test.ts}`
- `docs/adr/0019-security-linter.md`

### 🛠 Modified
- `apps/api/src/main.ts` (+5): 부트 시 masked dump 로그
- `packages/backend/settings/src/index.ts` (+8): mask export
- `package.json` (+6): `tooling:manifest`/`tooling:config-graph` + `yaml`/`zod` devDep
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`: `yaml` catalog
- `backlog/phase-10.md`, `backlog/queue.md`: 번들 재조정 + 보안 linter 결정 반영

**Total**: 20 files changed (+502)

## ✅ Definition of Done

- [x] 단위 테스트 PASS (validate/mask/toMermaid)
- [x] 통합 스모크 PASS
- [x] 보안 linter 결정 ADR-0019
- [x] walkthrough / pr_description ship commit
- [x] lint / typecheck 통과

## 🔗 관련 자료

- Phase: `backlog/phase-10.md`
- ADR: `docs/adr/0019-security-linter.md`
- 후속: spec-10-06 (observability), `pnpm new app`
