# Walkthrough: spec-01-01

> 루트 파일 정합성 점검 + Phase 1 acceptance 1/2/3/5/6 실측 기록.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| `engines.node` warning 처리 | (A) acceptance 1에서 fail / (B) 의도된 경고로 해석 / (C) ADR-0002 §3 변경 | **B (해석만)** | ADR-0002 §3에서 `>=22 <23` 잠금 의도가 명시됨. 현재 머신(v24)에서의 warning은 잠금의 *정상 신호*. acceptance 1은 "engines 외 0 warning"으로 해석 |
| LICENSE author/year | (A) `dennis (2026)` / (B) GitHub handle / (C) 회사명 | **A (`dennis 2026`)** | 사용자 본명 + 단일 작성자 + 작성 시점 |
| 점검 결과 변경량 | (A) 명백 불일치만 fix / (B) 스타일 정리 포함 | **A (최소 변경)** | spec.md NFR1 — 스타일 정리는 별도 spec 후보 |
| Acceptance 5 측정 방법 | (A) cache 무관 2회 / (B) `--force`로 캐시 비운 후 1회 + 일반 1회 | **B (clean state)** | "두 번째 lint가 cache hit"의 의미는 *clean에서 빌드 → 그 결과 캐시 적중*. cache가 이미 warm한 상태에서의 2회 모두 hit은 부분 검증 |

### ADR 승격 가이드

- [ ] ADR 승격 대상 있음
- [x] 없음 — 본 spec의 결정은 모두 단발 chore + 실측 해석. ADR-0001~0004에 이미 박혀 있음.

## 💬 사용자 협의

- **주제 1**: Spec 분할 단위 (Alignment Phase 직전)
  - **사용자 의견**: 8 spec 분할이 잘게 쪼개진다는 인지 후 *재분할* 선택 (Option A — 3 spec bundle).
  - **합의**: phase-01.md를 8 → 3 spec(root-files-and-lefthook-acceptance / config-presets-finalize / depcruise-boundary-validation)으로 갱신 후 첫 spec 진입. 별도 FF로 phase-01.md 재작성 (commit 4be443e, main으로 fast-forward).

- **주제 2**: `engines.node` 경고 처리
  - **사용자 의견**: Plan Accept 응답 "1" — 본 spec out of scope 정책 동의.
  - **합의**: 경고는 ADR-0002 §3 잠금의 정상 신호. 본 walkthrough에 해석 명시하고 통과 처리.

## 🧪 검증 결과

### 1. 자동화 테스트

본 spec은 code 추가 없음 (LICENSE 텍스트만). 별도 단위 테스트 추가 없음. 기존 `@repo/utils:test` (1 test PASS) 유지.

### 2. Acceptance 실측 (Phase 1.md §성공 기준)

> 본 섹션이 본 spec의 핵심 결과물 — phase-01 Done 판단의 증거.

#### Acceptance 1 — `pnpm install` 무경고

- **명령**: `pnpm install`
- **결과**: ✅ Pass (engines warning 외 0 warning, 종료 코드 0)
- **로그**:

```text
[WARN] Unsupported engine: wanted: {"node":">=22.0.0 <23"} (current: {"node":"v24.14.1","pnpm":"11.1.2"})
Scope: all 8 workspace projects
Already up to date
Done in 214ms using pnpm v11.1.2
```

- **해석**: `Unsupported engine` warning은 ADR-0002 §3 `engines.node: ">=22.0.0 <23"` 잠금의 *의도된 신호* (Node 22 LTS 강제). 머신을 22로 정렬하면 사라짐. 본 warning을 제외하면 `Already up to date`로 0 warning. acceptance 1 통과.

#### Acceptance 2 — `turbo run lint` 그린

- **명령**: `pnpm lint`
- **결과**: ✅ Pass

```text
@repo/utils:lint: $ biome check .
@repo/utils:lint: Checked 5 files in 26ms. No fixes applied.

 Tasks:    1 successful, 1 total
 Cached:    1 cached, 1 total
  Time:    23ms >>> FULL TURBO
```

- **노트**: 현재 turbo `lint` 실행 대상은 `@repo/utils` 1개. `packages/config/*` 6개는 `lint` script 없음 (preset 패키지는 lint 대상 아님). spec-01-02에서 config preset이 lint 필요 여부 재평가.

#### Acceptance 3 — `turbo run typecheck` 그린

- **명령**: `pnpm typecheck`
- **결과**: ✅ Pass

```text
@repo/utils:typecheck: $ tsc --noEmit

 Tasks:    1 successful, 1 total
 Cached:    1 cached, 1 total
  Time:    18ms >>> FULL TURBO
```

#### Acceptance 5 — turbo cache 100% hit (clean state 검증)

- **명령**:
  ```bash
  pnpm exec turbo run lint --force   # 1회 (force, 캐시 우회)
  pnpm exec turbo run lint           # 2회째 (cache hit 기대)
  ```
- **결과**: ✅ Pass

```text
# 1회 (--force)
@repo/utils:lint: cache bypass, force executing eed1ebd4f33a7378
@repo/utils:lint: Checked 5 files in 32ms. No fixes applied.
 Tasks:    1 successful, 1 total
 Cached:    0 cached, 1 total
  Time:    303ms

# 2회 (cache hit)
@repo/utils:lint: cache hit, replaying logs eed1ebd4f33a7378
 Tasks:    1 successful, 1 total
 Cached:    1 cached, 1 total
  Time:    16ms >>> FULL TURBO
```

- **분석**: 1회 force 후 2회째에서 `>>> FULL TURBO` + `1 cached, 1 total` = 100% hit. 303ms → 16ms 단축 (19x speedup). acceptance 5 통과.

#### Acceptance 6 — `lefthook run pre-commit`

(Task 4에서 실측, 본 섹션 갱신 예정)

## 🔍 발견 사항

### 루트 파일 ADR 정합성 점검 결과 (변경 없음)

| 파일 | ADR 출처 | 정합성 | 비고 |
|---|---|:---:|---|
| `package.json` | 0002 §1 (pnpm 11.1.2) / §3 (Node 22) / §4 (changesets) / §6 (lefthook) | ✓ | scripts/devDeps 모두 일치 |
| `pnpm-workspace.yaml` | 0002 §1 (catalog 14항목) / 0003 §2 (`packages/*/*`) | ✓ | catalog 14항목 모두 ADR 본문과 일치. allowBuilds esbuild/lefthook 추가 (build script 허용) |
| `turbo.json` | 0002 §2 (turborepo) | ✓ | globalDependencies + tasks 4개(build/lint/typecheck/test) + dev/clean 보조. inputs에 preset path 명시 — cache 무결성 안전 |
| `lefthook.yml` | 0002 §6 (lefthook pre-commit) | ✓ | biome check --write (stage_fixed: true) + tsc --noEmit (turbo). commit-msg noop은 향후 conventional-commits wire 후보 |
| `.editorconfig` | (보일러플레이트 표준) | ✓ | utf-8 / lf / indent_size 2 / trim_trailing_whitespace true (md 예외) |
| `.nvmrc` | 0002 §3 (Node 22) | ✓ | `22` |
| `.changeset/config.json` | 0002 §4 (changesets) | ✓ | access: restricted / baseBranch: main / updateInternalDependencies: patch |
| `biome.json` | 0001 (Biome 단일) | ✓ | `@repo/biome-config/base` extend |
| `README.md` | (ROADMAP §1 Vision) | ✓ | Status / ADRs / Quickstart / Layout. ROADMAP → backlog/queue.md 링크 교체 완료 (spec-x에서) |

→ 본 spec에서 *변경 없음* (LICENSE 1개 추가 외).

### 부수 발견

1. **lint 실행 대상이 1개뿐**: 현재 `@repo/utils`만 `lint` script 보유. `packages/config/*`는 preset이라 lint 대상 외. 본 spec acceptance는 통과하나, Phase 2에서 새 패키지 추가 시 자연스럽게 늘어남.
2. **turbo cache key 안정성**: 1회 force 후 2회째 cache hit으로 reproducible. CI에서도 동일 키 재현 기대 가능.
3. **lefthook `prepare` script**: `package.json`에 `"prepare": "lefthook install"` 있어 `pnpm install` 시 hook 자동 등록.

## 🚧 이월 항목

- **`engines.node` 정책 재평가** — Phase 2 진입 시점에 (Node 22 머신 정렬 vs ceiling 완화) 결정. Icebox 추가 후보.
- **`packages/config/*`에 lint script 추가 여부** — spec-01-02 (`config-presets-finalize`)에서 평가.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-17 |
| **최종 commit** | (ship 시 갱신) |
