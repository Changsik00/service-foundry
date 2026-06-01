# ci(spec-15-01): wire knip + depcruise PR gate

## 📋 Summary

### 배경 및 목적
`@repo/knip-config`·`@repo/depcruise-config` preset 은 있었으나 **root 에서 소비하는 config·script·turbo task·CI step 이 전혀 없었다.** phase-14 성공기준5("frozen-lockfile + turbo + **knip + depcruise**")에서 knip/depcruise 가 누락된 채 PASS 판정된 것이 직접 동기다. knip 을 돌리면 unused 74+ 가 나오는데 대부분 config 가 워크스페이스와 안 맞아 생긴 오탐이었다.

knip/depcruise config 를 실측에 맞게 교정해 **오탐 0** 으로 만든 뒤, root script + turbo task + `verify.yml` step 으로 PR 게이트를 배선한다.

### 주요 변경 사항
- [x] knip 6 `extends` 미지원 대응 → root `knip.config.ts` 가 preset JSON re-export (preset=SoT)
- [x] `base.json` 실측 재작성: 오탐 90+ → error 급 위반 0 (plugin 신뢰 + tooling `ignoreDependencies` + `rules`)
- [x] depcruise root 배선 (`.dependency-cruiser.cjs`) — 경계 위반 0 (383 modules)
- [x] turbo root task `//#knip`·`//#depcruise` + root scripts
- [x] `verify.yml` 에 knip+depcruise step (install 직후 fail-fast)
- [x] 미배선 scaffolding 은 사용자 결정대로 **전부 보존** (ignore+사유 / `@public` 태그)

### Phase 컨텍스트
- **Phase**: `phase-15` (security & wiring hardening)
- **본 SPEC 의 역할**: 후속 배선 작업(15-02~05)의 안전망 — dead code·레이어 경계 위반을 PR 단계에서 차단. phase-14 성공기준5 보강.

## 🎯 Key Review Points

1. **knip preset 소비 (`knip.config.ts`)**: knip 6 은 `extends` 미지원이라 JSON re-export 방식 채택. boilerplate README 도 함께 교정.
2. **게이트 severity 정책 (`base.json` rules)**: exports/types/files/deps = **error**, duplicates = off(의도적 dual-export), catalog = warn(의도적 미사용 핀). NFR3 점진 도입 — 핵심은 error.
3. **scaffolding 보존 방식**: 미사용 workspace deps 는 워크스페이스별 `ignoreDependencies`(예 `@repo/backend-auth-rate-limit` = 15-02~04 배선예정), 의도적 export 는 `@public` 태그. 삭제 0.
4. **turbo root task**: 전역 분석기라 per-package 아님. 소스 전체를 input 으로 잡아 stale-cache pass 방지.

## 🧪 Verification

### 게이트 실행
```bash
pnpm knip        # exit 0 (catalog 1건 warn=비차단)
pnpm depcruise   # ✔ no violations (383 modules, 825 deps), exit 0
pnpm turbo run knip depcruise   # 2 successful
```

### 위반 주입 (red 확인)
1. **unused export 주입** → `pnpm knip` `Unused exports __knipCanary`, exit 1 → 복원
2. **frontend→backend import 주입** → `pnpm depcruise` `error frontend-no-backend-imports`, exit 1 → 삭제

### 회귀
- `pnpm turbo run lint typecheck test build` → 134/135 성공. `@apps/api#test`(e2e) 실패는 **사전 존재**(실제 Postgres 필요, clean base 에서 동일 재현; CI 는 postgres service 제공). 본 변경 회귀 0.

## 📦 Files Changed

### 🆕 New Files
- `knip.config.ts`: preset re-export (root knip 진입점)
- `.dependency-cruiser.cjs`: preset require (root depcruise config)

### 🛠 Modified Files
- `packages/config/knip-config/base.json`: 워크스페이스 정합 재작성 + rules/ignore
- `packages/config/knip-config/README.md`: extends→re-export 교정 + 게이트 정책 문서화
- `turbo.json`: `//#knip`·`//#depcruise` root task
- `package.json`: `knip`·`depcruise` scripts
- `.github/workflows/verify.yml`: knip+depcruise step
- `apps/api/src/auth/oauth.stores.ts` (+1), `packages/backend/auth-audit/src/audit-log.schema.ts` (+1): `@public` 태그

**Total**: 핵심 8 files (+ spec 산출물)

## ✅ Definition of Done

- [x] knip 오탐 0 (진짜 위반만 / 점진 warn)
- [x] depcruise 경계 위반 0
- [x] turbo task + script + verify.yml step
- [x] 진짜 dead 처리 (사용자 결정: 전부 보존, 사유 명시)
- [x] 위반 주입 시 red 확인
- [x] walkthrough / pr_description ship
- [x] lint / typecheck 통과 (회귀 0)

## 🔗 관련 자료

- Phase: `backlog/phase-15.md`
- Walkthrough: `specs/spec-15-01-ci-knip-depcruise-gate/walkthrough.md`
- 관련 ADR: ADR-0001, ADR-0019
