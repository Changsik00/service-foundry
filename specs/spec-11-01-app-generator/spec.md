# spec-11-01: 앱 코드 생성기 (`pnpm new app`)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-11-01` |
| **Phase** | `phase-11` |
| **Branch** | `spec-11-01-app-generator` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
phase-10 spec-10-02 가 `pnpm new package` (turbo gen, 5 카테고리)를 제공했으나, **앱 스캐폴딩(`pnpm new app`)은 미구현**이다. 새 앱(api/next/vite)을 추가하려면 기존 `apps/{api,web-next,web-vite}` 를 손으로 복사·수정해야 한다 — 포트/네이밍/scripts/deps/tsconfig 가 타입마다 달라 실수가 쉽다.

### 문제점
- 복붙 비용 + 타입별 규칙(scripts/extends/deps/port) 위반 위험.
- generator 스토리가 package 만 닫히고 app 이 비어 phase-10 성공 기준의 절반만 충족됨.

### 해결 방안 (요약)
turbo gen 에 `app` 생성기를 추가한다. 타입(prompt: api/next/vite) + 이름 + 포트를 받아 `apps/<name>/` 에 ADR-0003 레이아웃·`@apps/<name>` 네이밍으로 스캐폴딩. 타입→타깃 매핑은 **순수 함수 `resolveAppTarget`** 로 분리해 단위 테스트. 생성 즉시 `pnpm install` 후 typecheck/lint 0 error.

**생성되는 api 앱은 *최소 NestJS*(health + settings + logger)** 로 — 범용 scaffold 목적상 전체 auth 스택은 끌어오지 않는다.

## 🎯 요구사항

### Functional Requirements
1. `pnpm new app` 실행 시 turbo gen `app` 생성기 동작.
2. 타입 3종(`api`/`next`/`vite`) prompt + 앱 이름(kebab) + 포트 입력(기본값 제안).
3. 타입별 생성:
   - **api**: `@apps/<name>`, NestJS 최소(main.ts bootstrap + app.module health + settings + logger), tsconfig `nestjs`, scripts(dev tsx watch / lint / typecheck / test)
   - **next**: `@apps/<name>`, Next 최소(app/layout+page), tsconfig `react-app`, scripts(next dev --port / build / lint / typecheck / test) + next/postcss/tailwind config
   - **vite**: `@apps/<name>`, Vite+React 최소(main.tsx + App + index.html), tsconfig `react-app`, scripts(vite --port / build / preview / lint / typecheck / test) + vite config
4. 타입→타깃 매핑(`resolveAppTarget`)이 순수 함수로 단위 테스트됨 (dir/pkgName/tsconfigExtends/port/scripts).
5. 생성 앱이 `pnpm install` 후 `typecheck`/`lint` 0 error.

### Non-Functional Requirements
1. 신규 외부 의존 0 (turbo gen 재사용). 버전은 catalog/workspace.
2. 생성 직후 `biome check --write` 로 lint-clean 보장 (10-02 패턴 재사용).
3. 포트 충돌 회피 — 기존 앱(2026/2027/2028)과 다른 기본값 제안.

## 🚫 Out of Scope
- api 앱에 auth/db 전체 배선 — 최소 scaffold만 (auth 는 사용자가 추가).
- observability(OTEL/metrics) 자동 배선 → spec-11-02/03 (생성 앱은 기본 미포함).
- worker/edge-api 타입 → 후속(phase-12 worker).

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (10-02 generator 컨벤션 연장 — 별도 ADR 불요)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-11.md` (§성공 기준 1, §시나리오 1)
- 직전 spec: `spec-10-02` (package generator — 동일 turbo/generators)
- 관련 ADR: ADR-0003 (layout)

## ✅ Definition of Done
- [ ] `resolveAppTarget` 단위 테스트 PASS (3 타입)
- [ ] 통합: `pnpm new app`(api) 생성 → install → typecheck/lint 0 error
- [ ] walkthrough / pr_description ship
- [ ] `spec-11-01-app-generator` push
- [ ] 사용자 검토 요청 알림
