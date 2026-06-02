# feat(spec-02-01): @repo/utils — sleep / pick / omit / Result + ADR-0008

## 📋 Summary

### 배경 및 목적

Phase 2 "shared primitives"의 첫 spec. Phase 1에서 `@repo/utils`를 스텁(`identity`)으로 박아두었던 자리를 *실제 4 함수군*으로 교체. Phase 3 backend / Phase 4 frontend가 본격 의존할 *공통 어휘*(Result + 객체 유틸 + 시간 대기)를 박는다. 동시에 Result 디자인을 ADR-0008로 박아 *cross-spec convention* 으로 격상.

### 주요 변경 사항

- [x] **`@repo/utils` 본문 교체**: `identity` 제거 + `sleep` / `pick` / `omit` / `Result<T, E>` + 6 helpers 추가 (총 67줄)
- [x] **테스트 16건 추가** (sleep 2 + pick 3 + omit 3 + Result 8) — TDD red → green 사이클 commit별 기록
- [x] **ADR-0008 작성**: `docs/adr/0008-result-type.md` (type: convention) — discriminated union + 함수 helper / class chaining 미사용 / `unwrap` 미제공 결정
- [x] **`packages/shared/utils/tsconfig.json`에 DOM lib 추가**: `setTimeout` 등 환경 무관 timer API 타입 노출

### Phase 컨텍스트

- **Phase**: `phase-02` — Shared Primitives (In Progress)
- **본 SPEC의 역할**: phase-02 5 spec 중 첫 번째. Result 패턴이 후속 spec(`shared-errors` / `shared-validation` / `shared-contracts` / `shared-auth-contracts`) + Phase 3 backend / Phase 4 frontend의 *공통 의존*. 본 spec 머지로 *공통 어휘 박힌 상태*에서 후속 진행.

## 🎯 Key Review Points

1. **Result 디자인 결정** (ADR-0008): discriminated union(`{ ok: true, value } | { ok: false, error }`) + 함수 helper. class chaining / `unwrap` / Either monad 비채택. 카운터: Rust/Scala 백그라운드에 *덜 자연스러움*이나 *명시적 분기 강제* + tree-shaking + zero-dep 이득이 크다.
2. **`identity` 제거의 영향 범위**: placeholder. 사용처 0건. 본 spec 제거 = clean slate.
3. **`pnpm shared/utils/tsconfig.json`의 DOM lib 추가**: `setTimeout` type 노출 목적. shared/* 가 *환경 무관*이어야 하는 의도. base tsconfig 변경 없음 (backend 영향 0).
4. **TDD 흐름**: 각 함수군마다 *test 추가 → fail 확인 → impl 추가 → pass 확인 → commit*. red 단계의 fail count(2/6/8)를 walkthrough에 박음.
5. **lefthook typecheck quirk 발견** ⚠️: T2 commit에서 typecheck FAIL에도 lefthook이 commit 진행시킴. fix commit으로 정정(`d361592`). RCA 후보 — harness-kit 본체 개선 검토.
6. **Biome auto-modernize**: `Object.prototype.hasOwnProperty.call` → `Object.hasOwn` 자동 변환.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 외 0 warning
- ✅ `pnpm lint`: Biome PASS
- ✅ `pnpm typecheck`: tsc --noEmit PASS (FULL TURBO cache hit)
- ✅ `pnpm test`: **16 tests passed** (sleep 2 / pick 3 / omit 3 / Result 8)
- ✅ `depcruise`: ✔ no dependency violations found (10 modules, 6 dependencies, 0 errors)

### TDD 흐름

| Task | Red (Fail count) | Green | Commit |
|:---:|:---:|:---:|:---|
| T2 sleep | 2 failed | 2 passed | `542d3dd` |
| T3 pick + omit | 6 failed / 2 passed | 8 passed | `757b579` |
| T4 Result + 6 helpers | 8 failed / 8 passed | 16 passed | `c18fc81` |

### 수동 검증 시나리오

1. `cat docs/adr/0008-result-type.md` → frontmatter `type: convention` + Context/Decision/Consequences/Alternatives/Status/Related 6 섹션 확인.
2. `wc -l packages/shared/utils/src/index.ts` → 67줄 (zero-dep 4 함수군).
3. `grep "@repo/utils" packages/shared/utils/src/index.test.ts` 없음 (자체 import — `./index.js`).

## 📦 Files Changed

### 🆕 New Files

- `docs/adr/0008-result-type.md` (60줄) — Result convention ADR
- `specs/spec-02-01-shared-utils/spec.md` (130줄)
- `specs/spec-02-01-shared-utils/plan.md` (130줄)
- `specs/spec-02-01-shared-utils/task.md` (90줄)
- `specs/spec-02-01-shared-utils/walkthrough.md` (110줄)
- `specs/spec-02-01-shared-utils/pr_description.md` (본 파일)

### 🛠 Modified Files

- `packages/shared/utils/src/index.ts` (-1 placeholder, +67 본문)
- `packages/shared/utils/src/index.test.ts` (-13 identity test, +94 본문)
- `packages/shared/utils/tsconfig.json` (+3 DOM lib)
- `backlog/phase-02.md` (sdd 자동 — spec-02-01 SPEC 표 행)
- `backlog/queue.md` (sdd 자동 — phase-02 active)

### 🗑 Deleted Files

- 없음.

**Total**: 6 new files + 5 modified files.

## ✅ Definition of Done

- [x] sleep / pick / omit / Result + 6 helpers 구현 + 단위 테스트
- [x] `identity` 제거
- [x] `pnpm test` 그린 (16 tests)
- [x] `pnpm lint` / `pnpm typecheck` 그린
- [x] depcruise violation 0건 유지
- [x] ADR-0008 작성 및 본 PR에 포함
- [x] walkthrough.md / pr_description.md ship commit
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-02.md` (5 spec 중 첫 번째)
- ADR: `docs/adr/0008-result-type.md` (본 spec에서 추가)
- Walkthrough: `specs/spec-02-01-shared-utils/walkthrough.md` (특히 §🔍 발견 사항 — lefthook quirk + DOM lib 패턴)
- 후속 spec: `spec-02-02-shared-errors` — `AppError` 계층을 `Result<T, AppError>`로 narrow 예정
