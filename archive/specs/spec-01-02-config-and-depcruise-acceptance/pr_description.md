# chore(spec-01-02): config preset 점검 + Phase 1 acceptance 4/7 (테스트 + depcruise)

## 📋 Summary

### 배경 및 목적

spec-01-01에서 Phase 1 acceptance 7건 중 5건(1/2/3/5/6)이 검증됐고, 잔여 2건(4 test 그린 + 7 depcruise violation 0건)이 본 spec의 핵심. 또한 6개 `packages/config/*` preset 본문이 ADR-0001/0004와 일치하는지 전수 점검.

본 PR 머지로 **Phase 1 acceptance 7건 전수 통과** 상태 달성.

### 주요 변경 사항

- [x] 6 config 패키지 본문 전수 점검 — **변경 없음** (대조 표 walkthrough)
- [x] Acceptance 4 (`pnpm test` 그린) 실측 — 1 task PASS, FULL TURBO
- [x] Acceptance 7 (`depcruise` violation 0건) 실측
  - 1차: 1 warning (orphan: `depcruise-config/base.cjs` 자체 — 의도된 false positive)
  - **Fix**: `no-orphans.pathNot`에 `^packages/config/.+\\.(?:cjs|mjs|cts|mts|js|ts)$` 추가
  - 2차: ✔ no dependency violations found (10 modules, 6 dependencies cruised)
- [x] Preset round-trip 검증: `@repo/utils/vitest.config.ts` → `@repo/vitest-config/node` import → 동작

### Phase 컨텍스트

- **Phase**: `phase-01` — 모노레포 골격
- **본 SPEC의 역할**: phase-01 잔여 acceptance 2건 검증 + depcruise 룰 1줄 micro-fix. 본 PR 머지 후 phase-01 acceptance 100% 통과 → `sdd phase done phase-01` 실행 가능.

## 🎯 Key Review Points

1. **6 config 본문 모두 ADR 일치 (변경 없음)**: d3894b4 / 2e3469c commit이 ADR-0001/0004를 충실히 반영. 점검 결과 표 walkthrough의 §1.2.
2. **depcruise `no-orphans` pathNot 보완** (1줄 fix): `packages/config/*` 내부의 `.cjs/.mjs/.cts/.mts/.js/.ts` preset 파일을 orphan 검사 예외에 추가. 이유: config preset은 *외부 도구가 직접 사용*하므로 import 그래프에 안 나오는 게 자연. `config-pure` 룰이 import 차단을 이미 보호 — 안전.
3. **depcruise 호출 방식**: 가장 단순한 `--config <base.cjs> packages/` 형태로 충분. `--ts-config` 옵션 불필요 (`tsPreCompilationDeps: true`로 자동 추적).
4. **Phase 1 Acceptance 7건 전수 통과 선언**: walkthrough §🎉에 7개 항목 + 검증 spec 매핑 표.
5. **bundle 결정의 결과**: 정찰 결과 spec-01-02/03 둘 다 작아 1 spec(`config-and-depcruise-acceptance`)으로 합침 — phase-01.md SPEC 분할 단위 2차 결정(commit 8ed9e04). ceremony 비용 절감.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 1건 외 0 warning
- ✅ `pnpm lint`: 1 task PASS, FULL TURBO
- ✅ `pnpm typecheck`: 1 task PASS, FULL TURBO
- ✅ `pnpm test`: 1 test PASS (`@repo/utils:test`)
- ✅ `depcruise`: no dependency violations found (10 modules, 6 dependencies, 0 errors, 0 warnings)

### 수동 검증 시나리오

1. `cat packages/config/depcruise-config/base.cjs | grep -A 12 "no-orphans"` → `pathNot`에 `^packages/config/.+\\.(?:cjs|mjs|cts|mts|js|ts)$` 라인 추가 확인.
2. `git log --oneline main..HEAD` → 3 commit 확인 (pre-flight / T2(점검+A4) / T3(fix+A7) / ship).
3. walkthrough.md §🎉 → Phase 1 acceptance 7건 전수 통과 표.

## 📦 Files Changed

### 🆕 New Files

- `specs/spec-01-02-config-and-depcruise-acceptance/spec.md` (107줄)
- `specs/spec-01-02-config-and-depcruise-acceptance/plan.md` (115줄)
- `specs/spec-01-02-config-and-depcruise-acceptance/task.md` (70줄)
- `specs/spec-01-02-config-and-depcruise-acceptance/walkthrough.md` (180줄)
- `specs/spec-01-02-config-and-depcruise-acceptance/pr_description.md` (본 파일)

### 🛠 Modified Files

- `packages/config/depcruise-config/base.cjs` (+1, -0): `no-orphans.pathNot`에 config preset 예외 추가

### 🗑 Deleted Files

- 없음.

**Total**: 5 new files + 1 modified file.

## ✅ Definition of Done

- [x] 6 config 패키지 전수 점검 결과 walkthrough 기록
- [x] Acceptance 4 (`turbo run test`) 실측 로그 walkthrough 누적
- [x] Acceptance 7 (depcruise) 실측 로그 walkthrough 누적
- [x] depcruise 호출 방식 결정 walkthrough 명시
- [x] **Phase 1 Acceptance 7건 전수 통과 선언** walkthrough 명시
- [x] walkthrough.md / pr_description.md ship commit
- [x] lint / typecheck / test 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md` (success criteria 7개 전수 통과)
- Walkthrough: `specs/spec-01-02-config-and-depcruise-acceptance/walkthrough.md`
- 관련 ADR: 0001 (Biome / Knip / depcruise) / 0004 (TS strict / tsup / JIT)
- 후속: `sdd phase done phase-01` 실행 → phase-02 (`shared primitives`) 진입
