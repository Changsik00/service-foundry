# feat(spec-11-01): 앱 코드 생성기 (`pnpm new app`)

## 📋 Summary

### 배경 및 목적
phase-10 spec-10-02 가 `pnpm new package` 를 제공했으나 앱 스캐폴딩은 비어 있었다. 새 앱(api/next/vite) 추가 시 기존 앱 복붙 비용 + 타입별 규칙(scripts/extends/deps/port) 위반 위험. 본 spec 은 turbo gen `app` 생성기로 이를 자동화한다.

### 주요 변경
- [x] `pnpm new app` (= `turbo gen app`) — 타입(api/next/vite) + 이름 + 포트 prompt
- [x] `resolveAppTarget` 순수 함수 (타입→dir/`@apps/`name/tsconfig/port) + 단위 테스트 7
- [x] **api = 최소 NestJS**(health+settings+logger, auth/db 미포함 — 범용 scaffold)
- [x] 생성 직후 biome 포맷 → lint-clean. `writeAndFormat` 로 package/app 생성기 공통화
- [x] 통합 스모크(api): 생성→install→lint/typecheck/test 0 error

### Phase 컨텍스트
- **Phase**: `phase-11` (Observability + App Generator) — 첫 spec
- **역할**: 성공 기준 1(`pnpm new app` 0 error scaffold) 충족, generator 스토리 완성

## 🎯 Key Review Points
1. **`resolveAppTarget`**: 타입 규칙 SoT (api→nestjs tsconfig, next/vite→react-app). 단위 테스트로 고정.
2. **api 최소 scaffold**: 실제 apps/api 에서 auth/db 제거한 최소판 — 생성 즉시 typecheck/lint/test 통과.
3. **3종 전부 0 error**: api/next/vite 모두 생성물 lint/typecheck 통과 확인 (next 도 framework codegen 없이).

## 🧪 Verification
```bash
pnpm exec vitest run turbo/generators/lib/resolve-app-target.test.ts   # 7 passed
bash turbo/generators/app-smoke-test.sh                                # api 0 error
```

## 📦 Files Changed
### 🆕 New
- `turbo/generators/lib/resolve-app-target.ts` (+ `.test.ts`)
- `turbo/generators/lib/app-templates.ts` (api/next/vite 빌더)
- `turbo/generators/app-smoke-test.sh`
### 🛠 Modified
- `turbo/generators/config.ts` (+`app` 생성기 + `writeAndFormat` 공통 헬퍼)

**Total**: 5 files (+467)

## ✅ Definition of Done
- [x] `resolveAppTarget` 단위 7 PASS
- [x] 통합 스모크(api) PASS
- [x] walkthrough / pr_description ship
- [x] lint / typecheck 통과

## 🔗 관련
- Phase: `backlog/phase-11.md`
- 직전: spec-10-02 (package generator)
- 후속: spec-11-02 (OTEL tracing)
