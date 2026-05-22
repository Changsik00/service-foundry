# Walkthrough: spec-09-01

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| ADR 저장 위치 | `docs/decisions/` (harness-kit 템플릿) / `docs/adr/` (프로젝트 기존) | `docs/adr/` | 프로젝트 기존 컨벤션 (ADR-0001~0016 모두 `docs/adr/`) 따름 |
| ADR-0017 타입 | decision / convention | convention | "AuthProvider sdk prop = CoreAuthSDK" 는 반복 적용되는 구조 규칙 |
| ADR-0018 타입 | decision / convention | decision | 패키지 위치 결정은 once-and-done 아키텍처 결정 |

- [x] ADR 승격 대상 있음 → 작성됨: `docs/adr/0017-auth-provider-sdk-prop-contract.md`, `docs/adr/0018-auth-provider-package-location.md`

## 💬 사용자 협의

- **주제**: phase-09 scope 결정
  - **합의**: 기존 phase-09.md(API extend/worker/edge-api) 대신 로그인 UI 먼저 진행. spec-09-01에서 phase-08 이월 ADR 2개 정리.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 타입 체크
- **명령**: `pnpm -r typecheck`
- **결과**: ✅ Passed (39 packages) — 문서 변경만이므로 타입 영향 없음

### 2. 수동 검증

1. **ADR-0017 frontmatter 확인**: `type: convention`, `status: accepted` ✅
2. **ADR-0018 frontmatter 확인**: `type: decision`, `status: accepted` ✅
3. **ADR 내부 상호 링크 확인**: ADR-0017 ↔ ADR-0018 상호 참조 ✅

## 🔍 발견 사항

- 기존 ADR 형식(ADR-0016 기준)이 harness-kit 템플릿과 섹션 헤더가 다름 (`## ✅ Decision` vs `## 🎯 Decision`). 프로젝트 컨벤션(ADR-0016) 형식을 따름.
- `docs/decisions/` 디렉토리가 없었음 — `docs/adr/`가 프로젝트 표준임을 확인.

## 🚧 이월 항목

- 없음

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-22 |
| **최종 commit** | (ship commit) |
