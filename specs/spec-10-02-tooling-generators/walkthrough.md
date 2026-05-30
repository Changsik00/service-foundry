# Walkthrough: spec-10-02

> 패키지 코드 생성기 — turbo gen 기반 `pnpm new package` (카테고리 5종).

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 생성기 엔진 | plop / turbo gen | **turbo gen** (`@turbo/gen`) | turbo 기설치 → 신규 외부 의존 0 (사용자 결정) |
| 범위 | package만 / package+app | **package 생성기만** | app 생성기는 후속 spec (사용자 결정) |
| 생성기 위치 | `tooling/generators/` / `turbo/generators/` | **`turbo/generators/`** | turbo gen 기본 탐색 경로 (phase.md 의 tooling/ 과 상이) |
| 템플릿 방식 | handlebars *.hbs / JS 빌더 inline | **JS 빌더(`lib/templates.ts`) + config inline write** | 카테고리별 deps 분기를 handlebars 헬퍼 없이 타입 안전하게. 통합 테스트가 콘텐츠 정합성 검증 |
| 생성물 lint-clean | 템플릿 수기 정렬 / 생성 후 포맷 | **생성 직후 `biome check --write`** | JSON.stringify 의 배열 줄바꿈 등을 레포 스타일로 정규화 → 어떤 템플릿이든 0 error 보장 |

### ADR 승격 가이드

- [ ] ADR 승격 대상 있음
- [x] 없음 (`generator-location` 컨벤션은 phase 누적 후 tooling 레이아웃 ADR 에 통합 권장 — 기록만)

## 💬 사용자 협의

- **주제**: 생성기 도구 + 범위
  - **합의**: turbo gen + package 생성기만 (app 은 후속)
- **주제**: lefthook prepare 충돌 (turbo gen 실행 차단) — 본 spec 범위 밖 환경 블로커
  - **경과**: `prepare: lefthook install` 이 `core.hooksPath` 설정과 충돌 → `pnpm install`/turbo 중단. **harness-kit 이슈 #161 등록**. 우회로 `git config --unset --local core.hooksPath` 적용 (사용자 결정).
  - **부작용**: lefthook 재설치가 `.git/hooks/pre-commit` 의 harness append 블록을 제거 → git-hook 레이어 harness 검사 비활성. 단 **Claude Code PreToolUse 훅(secrets/plan-accept)은 유지**되어 bare `git commit` 은 보호됨. git-hook 항구 복구는 #161 해결안으로 분리.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm exec vitest run turbo/generators/lib/resolve-target.test.ts`
- **결과**: ✅ Passed (8 tests) — 5 카테고리 매핑 + 오류 입력(잘못된 category / 빈·대문자·공백 name) + config 중복 suffix 방지

#### 통합 테스트
- **명령**: `bash turbo/generators/smoke-test.sh`
- **결과**: ✅ Passed
- **로그 요약**:
```text
✓ 생성: @repo/smoketmp (shared)
✓ pnpm install
✓ lint
✓ typecheck
✓ test
✓ 스모크 테스트 통과 — 생성 패키지 @repo/smoketmp lint/typecheck/test 0 error
```

### 2. 수동 검증

1. **Action**: `pnpm exec turbo gen package --args shared gendemo`
   - **Result**: `packages/shared/gendemo/` 5 파일 생성 (package.json/tsconfig/vitest.config/src/index.ts/src/index.test.ts)
2. **Action**: 생성물에 lint/typecheck/test
   - **Result**: 전부 0 error (생성 직후 biome 포맷 적용 효과 — 초기엔 tsconfig 배열 줄바꿈으로 lint 실패했으나 포맷 단계 추가로 해결)
3. **Action**: gendemo / smoketmp 정리 + `pnpm install` lockfile 복구
   - **Result**: 잔재 없음, lockfile drift 없음

## 🔍 발견 사항

- **turbo gen ↔ lefthook prepare 충돌** (이슈 #161): turbo 가 태스크 전 deps 체크로 `pnpm install` 을 호출 → prepare(lefthook install) 실패가 turbo 전체를 막음. 환경 블로커였고 별도 제보·우회.
- **JSON.stringify ≠ biome 포맷**: 생성 콘텐츠를 그대로 두면 짧은 배열 줄바꿈으로 lint fail. 생성 직후 `biome check --write` 로 정규화하는 패턴이 generator 의 표준 마무리로 유효.

## 🚧 이월 항목

- **`pnpm new app` (app 생성기 — api/next/vite)** → 후속 spec (phase-10.md 의 10-02 범위 분할).
- **git-hook harness 블록 항구 복구** → #161 해결안 (lefthook.yml 네이티브 통합) 대기.

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md` (§성공 기준 2, §시나리오 2)
- 관련 ADR: ADR-0003, ADR-0015
- 관련 이슈: harness-kit#161 (lefthook/core.hooksPath 충돌)
- 직전 spec: `spec-10-01` (tooling-docker)

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis |
| **작성 기간** | 2026-05-30 |
| **최종 commit** | ship 시 갱신 |
