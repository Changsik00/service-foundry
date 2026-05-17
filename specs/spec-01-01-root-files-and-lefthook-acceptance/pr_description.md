# chore(spec-01-01): root files + Phase 1 acceptance 1/2/3/5/6 evidence

## 📋 Summary

### 배경 및 목적

Phase 1 골격(루트 파일 + `packages/config/*` 6종 + 스텁)이 d3894b4 commit에 박힌 상태이나, *acceptance 1/2/3/5/6의 실측 증거*가 walkthrough/PR 어디에도 없어 phase-01 Done 판단 근거 부재. 또한 LICENSE 파일이 빠져 `package.json: "license": "MIT"`와 불일치. 본 PR은 (a) LICENSE 추가, (b) 5개 acceptance 실측 + 증거 누적.

### 주요 변경 사항

- [x] `LICENSE` 신규 (MIT, 2026 dennis) — `package.json`과 일치
- [x] 루트 파일 9종 ADR 정합성 점검 — **변경 없음** (대조 표 walkthrough에 기록)
- [x] Acceptance 1 (`pnpm install` 무경고) 실측 + 해석 — `engines warning`은 ADR-0002 §3 의도된 신호
- [x] Acceptance 2 (`pnpm lint` 그린) 실측
- [x] Acceptance 3 (`pnpm typecheck` 그린) 실측
- [x] Acceptance 5 (turbo cache 100% hit) — `--force` 후 일반 lint, 303ms → 16ms (19x)
- [x] Acceptance 6 (`lefthook run pre-commit`) — 직접 실행 + 실 commit 흐름 둘 다

### Phase 컨텍스트

- **Phase**: `phase-01` — 모노레포 골격 (In Progress)
- **본 SPEC의 역할**: phase-01 acceptance 7개 중 5개(1/2/3/5/6) 실측 증거 박음. acceptance 4(test 그린)는 spec-01-02, 7(depcruise)는 spec-01-03 담당. 본 PR 머지 후 phase-01의 acceptance 71% 검증 완료.

## 🎯 Key Review Points

1. **`engines.node` warning 해석**: `>=22 <23` 잠금 vs 머신 v24의 매 commit `[WARN]`은 ADR-0002 §3의 의도된 신호로 해석. 본 spec에서 잠금 변경 없음 (out of scope, Phase 2 진입 시점에 재평가).
2. **변경 최소화 원칙 준수**: 루트 파일 9종 모두 ADR과 일치 → 변경 없음. LICENSE 1개만 신규. 스타일 정리 금지 원칙 그대로.
3. **Acceptance 5 측정의 신뢰성**: `--force`로 clean turbo state 만든 후 2회째 cache hit 검증 — 캐시가 이미 warm한 상태에서의 부분 검증을 피함.
4. **Acceptance 6 검증 범위**: 직접 실행은 staged 없어 skip 결과. 그러나 본 spec 4 commit + spec-x 12 commit 전체에서 hook이 *실제 동작*하고 통과 — 검증 폭은 충분.
5. **현재 lint/typecheck/test 대상이 1 패키지**: `@repo/utils`만 script 보유. `packages/config/*`는 preset이라 대상 외. Phase 2에서 새 shared/* 패키지 추가 시 자연스럽게 늘어남.

## 🧪 Verification

### 자동 테스트

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec turbo run lint --force && pnpm exec turbo run lint
pnpm exec lefthook run pre-commit
```

**결과 요약**:
- ✅ `pnpm install`: engines warning 1건 외 0 warning, `Already up to date`
- ✅ `pnpm lint`: 1 task PASS, FULL TURBO
- ✅ `pnpm typecheck`: 1 task PASS, FULL TURBO
- ✅ `pnpm test`: 1 test PASS (`@repo/utils`)
- ✅ Acceptance 5: 1회 force (303ms, `cache bypass`) → 2회 (16ms, `cache hit, replaying logs`)
- ✅ `lefthook run pre-commit`: hook 정상 실행 (staged 없어 skip), exit 0

### 수동 검증 시나리오

1. `cat LICENSE | head -3` → `MIT License / Copyright (c) 2026 dennis` 확인.
2. `git log --oneline main..HEAD` → 4 commit 확인 (pre-flight / LICENSE / acceptance 1/2/3/5 / acceptance 6).
3. walkthrough.md `🧪 검증 결과` 섹션 → 5개 acceptance 로그 모두 캡처되어 있음.

## 📦 Files Changed

### 🆕 New Files

- `LICENSE` (MIT, 21줄)
- `specs/spec-01-01-root-files-and-lefthook-acceptance/spec.md` (113줄)
- `specs/spec-01-01-root-files-and-lefthook-acceptance/plan.md` (155줄)
- `specs/spec-01-01-root-files-and-lefthook-acceptance/task.md` (74줄)
- `specs/spec-01-01-root-files-and-lefthook-acceptance/walkthrough.md` (190줄)
- `specs/spec-01-01-root-files-and-lefthook-acceptance/pr_description.md` (본 파일)

### 🛠 Modified Files

- 없음 (루트 파일 9종 모두 변경 없음).

### 🗑 Deleted Files

- 없음.

**Total**: 6 new files / 0 modified / 0 deleted.

## ✅ Definition of Done

- [x] LICENSE 추가
- [x] 루트 파일 점검 결과 walkthrough 기록
- [x] Acceptance 1/2/3/5/6 실측 로그 walkthrough 누적
- [x] `engines` warning 해석 walkthrough 명시
- [x] walkthrough.md / pr_description.md ship commit (본 commit)
- [x] lint / typecheck / test 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Phase: `backlog/phase-01.md` (success criteria 7개 중 5개 본 PR로 검증)
- Walkthrough: `specs/spec-01-01-root-files-and-lefthook-acceptance/walkthrough.md`
- 관련 ADR: 0001 / 0002 / 0003 / 0004 (정합성 점검 대상)
- 후속: spec-01-02 (`config-presets-finalize`) — Acceptance 4 / spec-01-03 (`depcruise-boundary-validation`) — Acceptance 7
