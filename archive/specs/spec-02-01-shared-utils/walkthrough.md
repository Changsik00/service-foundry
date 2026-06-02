# Walkthrough: spec-02-01

> Phase 2의 첫 spec. `@repo/utils` 스텁(`identity`)을 *실제 4 함수군*(sleep / pick / omit / Result+6 helpers)으로 교체. ADR-0008로 Result 디자인 박음.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `identity` placeholder 처리 | (A) 유지 / (B) 제거 | **B (제거)** | 사용처 없는 placeholder. 새 4 함수군과 함께 정리 |
| Result 디자인 | (A) discriminated union + 함수 helper / (B) class + chaining / (C) Either monad / (D) `unwrap` 제공 | **A** | tree-shaking 친화 + zero-dep 원칙 + 명시적 분기 강제 (`unwrap` throw 회피) → ADR-0008로 박음 |
| Result 기본 에러 타입 | `E = Error` / 명시 강제 | `E = Error` 기본값 | zero-config. 도메인 narrow는 spec-02-02 |
| `pick` / `omit` 안전성 | `key in source` / `Object.hasOwn` / hasOwnProperty | **Biome가 `Object.hasOwn`으로 자동 modernize** | ES2022 표준 + prototype chain 안전 |
| T2 단위 분할 | T2(identity 제거 단독) / T2+T3 합침 | **합침** | vitest "no tests in file"이 단독 cleanup commit을 fail로 처리. cleanup + 첫 함수를 한 commit으로 |
| ADR 작성 시점 | 본 PR 포함 / 별 PR | **본 PR 포함** | 결정과 구현이 한 추적 단위 |
| `unwrap` helper | 제공 / 미제공 | **미제공** | throw 유발 = Result 도입 이유와 충돌. `isOk(r) ? r.value : default` 패턴 표준 |
| tsconfig DOM lib | base 변경 / shared-only 변경 | **shared/utils만** | base 변경은 backend node-app에 의도치 않은 DOM 노출. shared/*만 환경 무관 의도 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **ADR-0008** `docs/adr/0008-result-type.md` 작성됨 (`type: convention`)
- [ ] 없음

## 💬 사용자 협의

- **주제 1**: phase-02 진입 전 3 선결정 (non-base 모드 / lat.md 종료 시 평가 / spec-02-05 핵심 필드 우선)
  - **사용자**: "1로 진행" — 3 결정 모두 추천안 수락.
- **주제 2**: spec-02-01 plan accept
  - **사용자**: "1" — Plan Accept.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트

```bash
pnpm --filter @repo/utils test
```

- **결과**: ✅ 16 tests passed (sleep 2 + pick 3 + omit 3 + Result 8)
- **로그 요약**:

```text
 RUN  v4.1.6 /Users/dennis/Project/ck/service-foundry/packages/shared/utils
 ✓ src/index.test.ts (16 tests) 25ms

 Test Files  1 passed (1)
      Tests  16 passed (16)
   Duration  103ms
```

#### 타입체크 + Lint + depcruise

- `pnpm lint`: ✅ Biome PASS (5 files checked)
- `pnpm typecheck`: ✅ tsc --noEmit PASS (FULL TURBO cache hit)
- `pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/`: ✅ no dependency violations found (10 modules, 6 dependencies, 0 errors)

### 2. TDD 흐름 증거

| Task | Red 결과 | Green 결과 | Commit |
|:---:|:---:|:---:|:---|
| T2 sleep | 2 failed | 2 passed (24ms) | 542d3dd |
| T3 pick + omit | 6 failed / 2 passed | 8 passed (25ms) | 757b579 |
| T4 Result + 6 helpers | 8 failed / 8 passed | 16 passed (25ms) | c18fc81 |

### 3. 번들 사이즈

- `wc -l packages/shared/utils/src/index.ts` → **67줄** (예상 하한 100~200 미만, minimal 4 함수군이라 자연)
- runtime dep: 0 (zod 미사용)
- type-only export(`Result<T, E>`)는 런타임 비용 0

## 🔍 발견 사항

1. **lefthook의 typecheck fail 비차단 동작** ⚠️ (RCA 후보): T2 commit에서 `setTimeout` 타입 미정의로 `typecheck FAIL` (exit 2) 발생했으나 lefthook이 commit 진행시킴. *lefthook의 parallel 모드 + exit code 처리*의 quirk로 보임. fix commit(`d361592`)으로 정정했으나 동일 패턴이 재발하면 main에 broken state 박힐 위험. **harness-kit 본체 개선 후보** — lefthook.yml에 `fail_text` 또는 sequential 모드 평가 필요.
2. **base tsconfig의 `lib: ["ES2023"]`만으로는 `setTimeout` type 부재**: shared/utils는 *환경 무관* (Node + browser) 필요하나 ES lib만으로는 timer API 타입 없음. shared/utils/tsconfig.json에 `DOM` lib 추가로 해결. 후속 shared/* 패키지도 동일 패턴 필요할 수 있음 — *공통 wrapper* 또는 *typescript-config preset에 "env-agnostic" 변형 추가* 후보 (Phase 2 후반에 평가).
3. **Biome auto-modernize**: `Object.prototype.hasOwnProperty.call(source, key)`를 `Object.hasOwn(source, key)`로 자동 fix. ES2022 표준 + prototype chain 안전. 편의성 좋음.
4. **vitest "no tests in file" 규칙**: 빈 test 파일 = exit 1. T2 단독 cleanup commit이 불가했던 이유. 향후 spec 분할 시 *test 파일을 비울 일이 있다면 통째로 삭제 후 다음 task에서 다시 만들기*가 정석. 또는 본 spec처럼 cleanup + 첫 함수 합치기.

## 🚧 이월 항목

- **lefthook typecheck 비차단 quirk** → RCA 후보 (2회째 발생 시 `docs/rca/RCA-001-lefthook-typecheck-non-blocking.md` 작성). harness-kit upstream 개선 후보.
- **shared/* 패키지의 DOM/timer 타입 패턴** → spec-02-04 후반 또는 별 spec에서 *typescript-config preset에 `env-agnostic` 변형 추가* 평가.
- **`@repo/utils`에 추가 유틸 (zip / partition / groupBy / chunk 등)** → YAGNI. 도메인 spec(02-02~04)에서 *필요 시* 추가.
- **`Result.unwrapOr` / `Result.match` 등 추가 helper** → 본 spec 패턴 사용해본 후 spec-02-02/03에서 *실제 사용처 발생 시* 평가.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-17 |
| **최종 commit** | (ship 시 갱신) |
| **테스트 수** | 16 (sleep 2 + pick 3 + omit 3 + Result 8) |
| **소스 라인 수** | 67 (`index.ts`) |
