# Walkthrough: spec-16-02

> applySecurity(helmet/CORS)를 configureApp SoT 에 흡수. 작업 기록 + 결정 + 검증.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 배선 위치 | main.ts 인라인 유지 / configureApp 흡수 | configureApp 흡수 | C1 SoT 패턴 확장 — prod·e2e 단일 경로, 제거 시 동시 실패 |
| cors origin 주입 | settings import / 파라미터 | `configureApp(app, { corsOrigin })` | app.setup 을 settings 비의존으로 유지, main.ts 가 주입 |
| 배선 순서 | logger 뒤 유지 / 생성 직후 이동 | 생성 직후(configureApp 내) | helmet/cors 는 요청 미들웨어라 useLogger(앱 레벨)와 무관 — 이동 안전 |

### ADR 승격 가이드
- [x] 없음

## 🧪 검증 결과

### 1. 통합 테스트 (Integration Test Required = yes)
- **명령**: `DATABASE_URL=...5434/test pnpm --filter @apps/api test`
- **결과**: ✅ **105/105 PASS** (+1: 보안 헤더 helmet)
- **신규**: "보안 헤더 (helmet)" describe — `GET /auth/csrf` 응답에 `x-content-type-options: nosniff`.

#### TDD Red→Green
- Red: 흡수 전 configureApp 에 applySecurity 없음 → helmet 헤더 부재 → Fail.
- Green: configureApp 에 applySecurity 흡수 → 헤더 존재.

### 2. 부정 검증 (대조 — 성공기준2)
- `configureApp` 에서 `applySecurity` 호출 제거 → helmet e2e **FAIL** 확인 → 원복. 배선 회귀 차단 작동.

### 3. 게이트
- `pnpm turbo run lint typecheck test knip depcruise` → **136/136 successful**.

## 🔍 발견 사항
- 이제 부트스트랩 미들웨어 3종(requestId + cookieParser + helmet/CORS)이 모두 `configureApp` SoT 안에 있어, 어느 하나라도 제거하면 대응 e2e(reqId / CSRF / helmet)가 깨진다 — C1 안전망이 보안헤더까지 완성됨.

## 🚧 이월 항목
- 없음.

## 🔗 관련 문서 (Related)
- 관련 RCA: [[RCA-003]] (배선 검증)
- 관련: phase-15 2차회고 V1, spec-15-04 C1(configureApp 도입)

## 📅 메타
| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-06-02 |
| **최종 commit** | `ae9e4fe` |
