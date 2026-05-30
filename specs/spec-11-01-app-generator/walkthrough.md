# Walkthrough: spec-11-01

> 앱 코드 생성기 — `pnpm new app` (turbo gen, api/next/vite).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| api 앱 깊이 | 전체 auth/db / 최소 NestJS | **최소(health+settings+logger)** | 범용 scaffold — auth 는 사용자가 추가 |
| 엔진 | 신규 / turbo gen 재사용 | **turbo gen `app`** | 10-02 package 생성기와 동일, 신규 의존 0 |
| 매핑 | inline / 순수함수 | **`resolveAppTarget` 순수함수** | 타입 규칙 단위 테스트 |
| 콘텐츠 정규화 | 수기 / biome 포맷 | **생성 직후 biome --write** | 10-02 패턴 재사용, 즉시 lint-clean |
| 포트 | 고정 / prompt(기본 2031) | **prompt** | 기존 2026~2028 충돌 회피 |

### ADR 승격
- [x] 없음 (10-02 generator 컨벤션 연장)

## 💬 사용자 협의
- phase-11 첫 spec 으로 app generator 선택(독립적, generator 스토리 완성). api 최소 scaffold 합의.

## 🧪 검증 결과

### 단위
- **명령**: `pnpm exec vitest run turbo/generators/lib/resolve-app-target.test.ts`
- **결과**: ✅ 7 passed (api/next/vite 매핑 + 타입/이름/포트 throw)

### 통합
- **명령**: `bash turbo/generators/app-smoke-test.sh`
- **결과**: ✅ api 생성 → install → lint/typecheck/test 0 error → 정리

### 수동 (3종 전체)
- api/next/vite 각각 생성 → **lint 0 / typecheck 0 / test(api) 통과** 확인 후 정리. 성공 기준 1(api/next/vite 0 error) 충족.

## 🔍 발견 사항
- next/vite 도 `next-env.d.ts`/route 코드젠 없이 최소 구조로 typecheck 통과 (react-app tsconfig + @types/react 로 충분).
- `writeAndFormat` 헬퍼로 package/app 생성기 공통화 — 생성 직후 biome 포맷이 JSON.stringify 배열 줄바꿈을 정규화.

## 🚧 이월 항목
- worker/edge-api 타입 → phase-12 (worker)
- 생성 앱에 observability 자동 배선 → spec-11-02/03 후 generator 옵션 추가 검토

## 🔗 관련
- 관련 phase: `backlog/phase-11.md` (§성공 기준 1, §시나리오 1)
- 직전 spec: spec-10-02 (package generator — 동일 turbo/generators)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-30 |
| 최종 commit | ship 시 갱신 |
