---
id: RCA-001
type: failure-pattern
date: 2026-05-18
severity: high
status: resolved
---

# RCA-001: lefthook pre-commit이 typecheck fail 시 commit을 차단하지 않음 (불일관 동작)

## 🔍 Symptom

`pnpm turbo run typecheck` exit code 2 (TS 컴파일 에러)인데도 lefthook pre-commit이 *통과되어 commit이 만들어지는* 경우가 있다. **동일 종류 에러에서도** 차단되는 케이스와 통과되는 케이스가 *불일관*하게 섞임:

- **차단됨 (정상)**: `spec-02-02-shared-errors` Task 8 — `@repo/utils` import 후 `setTimeout` 타입 미정의 → exit 2 → lefthook이 commit 차단 ✓
- **통과됨 (버그)**: `spec-02-01-shared-utils` Task 2 — 동일하게 `setTimeout` 타입 미정의 → exit 2 → 그러나 lefthook이 commit을 통과시킴 ✗ (그 결과 main에 typecheck-broken 상태가 박힐 뻔, 다음 commit `d361592`로 사후 정정)

## 🔁 Reproduction

1. `packages/shared/utils/src/`에 `export const broken: number = "not a number";` 같은 type error를 가진 파일 추가.
2. `git add` + `git commit`.
3. 기대(고침 전): 일관 차단. 실제(고침 전): *random*하게 통과되거나 차단됨.
4. 본 RCA에서 2026-05-18에 fix 후 reproducer 실행 → **정상 차단됨** (해당 commit이 만들어지지 않음 확인).

> **주의**: 고침 전 quirk는 *비결정적*이라 매번 재현된다고 보장 안 됨. 본 RCA의 직접 트리거는 ≥2회 관찰된 *동일 패턴*.

## 🎯 Root Cause

`lefthook.yml`의 `pre-commit: { parallel: true }` + biome의 `--write` + `stage_fixed: true` + turbo cache의 race condition.

```yaml
pre-commit:
  parallel: true     # ← biome / typecheck 동시 실행
  commands:
    biome:
      run: pnpm exec biome check --write ...
      stage_fixed: true   # ← fix 후 staged 파일에 반영
    typecheck:
      run: pnpm turbo run typecheck ...
```

**race 가설** (3-step):

1. `biome`와 `typecheck`가 동시 시작.
2. `biome --write`가 staged 파일을 수정 + `stage_fixed: true`로 git stage 갱신.
3. `turbo run typecheck`가 *staged 파일 hash*로 cache key 계산. 단,
   - **biome가 stage update를 마치기 *전*에 turbo가 cache key를 계산하면**: 이전 그린 상태의 cache hit → `>>> FULL TURBO` → exit 0 → lefthook이 *명목상 success*로 commit 통과.
   - **biome stage update를 본 후**: cache miss → 실제 tsc 실행 → typecheck fail → exit 2 → 차단.

즉 **timing-dependent** — race가 *어떤 commit에선 발생*, *어떤 commit에선 미발생*. 이게 *불일관 동작*의 정체.

## 🛡 Invariant Violated

> **Pre-commit hook의 어떤 검사라도 fail이면 commit이 반드시 차단된다.**

이전에 명시되지 않았으나 *상식적 lefthook 사용 계약*. 본 RCA로 *지금 명시*. 향후 lefthook.yml에 새 hook 추가 시 동일 race 가능성을 *항상* 점검.

## 🚧 Prevention

본 RCA 작성 시점(2026-05-18, 본 commit)에 **fix 적용**:

```yaml
pre-commit:
  parallel: false      # ← race 차단 (biome → typecheck 순차)
  piped: true          # ← 한 명령 fail 시 다음 명령 skip (의도 명시)
  commands:
    biome:
      glob: "*.{js,jsx,ts,tsx,json,jsonc}"
      run: pnpm exec biome check --write ...
      stage_fixed: true
    typecheck:
      glob: "*.{ts,tsx,cts,mts}"   # ← TS 변경 시만 실행 (불필요 trigger 회피)
      run: pnpm turbo run typecheck ...
```

**3 fix**:

1. **`parallel: false`** — biome → typecheck *순차* 실행. biome stage update가 typecheck 시작 *전에* 완료 보장. race 원천 차단.
2. **`piped: true`** — biome fail 시 typecheck skip (의도 명시). 불필요 실행 회피.
3. **typecheck `glob` 한정** — TS 파일 변경 시만 typecheck trigger. 다른 파일 commit 시 race 표면적 줄임 (보조 방어).

**검증**: 본 commit에서 `__rca_repro.ts` (type error 포함) reproducer로 commit 시도 → lefthook이 정상 차단 (커밋 SHA 변경 없음 — main 마지막 commit `30d40db` 유지) → reproducer 제거 후 RCA 본문 commit.

**향후 모니터링**:

- 다음 5 spec(spec-02-03 / 02-04 / 02-05 + spec-03-01 등)에서 *동일 quirk 재발* 발견되면 RCA를 reopen + lefthook 업그레이드 평가 (현재 2.1.6 → 최신).
- `parallel: false`로 약간의 성능 손해 (현재 1초 미만이라 영향 거의 없음) — 누적 시 reactor 형태로 lefthook 외 hook 분리 검토.

## 🔗 Related

- 트리거 발견: `specs/spec-02-01-shared-utils/walkthrough.md` §발견 사항 #1 (1회째), `specs/spec-02-02-shared-errors/walkthrough.md` §발견 사항 #1 (2회째 — RCA Protocol trigger 도달).
- 이전 Icebox 항목: `backlog/queue.md`의 "spec-02-01에서 발견된 이슈" 섹션 → 본 RCA로 격상 (Icebox에서 제거).
- 관련 ADR: `docs/adr/0002-monorepo-foundations.md` (lefthook 채택 결정 — fix 본문은 lefthook 사용 룰 보강).
- 코드: `lefthook.yml` (본 commit에서 수정).
- harness-kit upstream 개선 후보: hook 템플릿에 *parallel + stage_fixed 조합 주의* 노트 추가 가치.
