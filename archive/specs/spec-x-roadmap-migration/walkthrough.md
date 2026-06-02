# Walkthrough: spec-x-roadmap-migration

> ROADMAP.md (188줄, 단일 파일) → harness-kit `backlog/` 자산(phase-01~06.md + queue.md) 마이그레이션 작업 기록.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 작업 모드 (Alignment) | FF / SDD-x / SDD-P | SDD-x | 사용자가 처음 FF를 선택했으나 §11.2 6+ 파일 임계 + 절차 일관성 고려해 SDD-x로 재선택 |
| Phase 본문 분배 단위 | Phase당 파일 1개 / 큰 디렉토리 | Phase당 파일 1개 | constitution §6.3 — `backlog/phase-{N}.md`는 phase당 단일 파일 |
| §4.2 Pending decisions 위치 | queue.md Icebox / 각 phase의 위험 표 / ADR | queue.md Icebox | constitution §3.4 — Icebox = "실행 불가, 결정 대기" 정확히 일치 |
| §4.3 Resolved decisions 위치 | phase-N.md에 복제 / ADR 링크만 | ADR 링크만 (DRY) | ADR이 SoT — 복제 시 stale 위험. phase-N.md "연관 ADR" 필드로 위임 |
| §3 차별화 포인트 (9개) 위치 | 별도 표로 모음 / 관련 phase에 분산 | 관련 phase에 분산 | phase 컨텍스트가 작업 시 더 유용. "한눈 뷰"는 의도적으로 포기 |
| §5 참고 자산 위치 | 관련 phase에 inline | 그대로 | aiagent-monorepo / node-settings / lat.md 각 적절 phase 본문에 흡수 |
| Phase 1 활성화를 본 spec에 포함 vs 분리 | 포함 / merge 후 분리 | 포함 (Task 8) | 자연스러운 후속 흐름 (ROADMAP이 Phase 1을 "진행 중"으로 기재) |
| **(예상 외)** `sdd phase activate`가 spec-x state를 리셋함 | A. state.json 수기 복원 후 진행 / B. phase activate를 별도 액션으로 분리 / C. 신규 spec-01-01으로 재구성 | **A. 수기 복원** (사용자 임시 권한) | 7 commit 이미 진행, B는 phase 활성 의도 분리 비용, C는 비용 과대 |
| commit 분할 | 모두 한 커밋 / Task별 분할 | Task별 분할 (총 10 commit) | constitution §8 — One Task = One Commit |

### ADR 승격 가이드

- [ ] ADR 승격 대상 있음
- [x] 없음 — 기존 자산을 harness-kit 형식으로 재배치한 작업. 새 아키텍처 결정 없음. 단, 학습 사항(아래 "발견 사항")이 RCA 후보가 될 수 있음 (≥2회 반복 시).

## 💬 사용자 협의

- **주제 1**: 작업 모드 선택 (Alignment Phase)
  - **사용자 의견**: 초기 FF 선택 → 본 에이전트가 §11.2 임계 + Git Law §10.1 충돌을 surface → 사용자가 SDD-x로 재선택
  - **합의**: SDD-x (`spec-x-roadmap-migration`, type=docs). Plan Accept 후 Strict Loop.

- **주제 2**: Task 8의 `sdd phase activate phase-01` 부작용 (state.json reset)
  - **사용자 의견**: "일단 임시권한 줄터이니.. 최적의 방법으로 처리해놔"
  - **합의**: state.json 수기 복원(`phase=phase-01`, `spec=spec-x-roadmap-migration`, `planAccepted=true`), specx 마커 수기 채움. Ship 시 `sdd ship`이 정상 흐름 회복. 학습은 본 문서 §발견 사항으로 박음.

## 🧪 검증 결과

### 1. 자동화 테스트

#### 단위 테스트
- **명령**: `pnpm lint && pnpm typecheck && pnpm test` (turbo)
- **결과**: ✅ All PASS (turbo cache hit)
- **로그 요약**:

```text
@repo/utils:lint: cache hit, replaying logs eed1ebd4f33a7378
@repo/utils:lint: Checked 5 files in 26ms. No fixes applied.

@repo/utils:typecheck: cache hit, replaying logs 4d260ba66253a820
@repo/utils:typecheck: $ tsc --noEmit

@repo/utils:test: cache hit, replaying logs 2851a2f07972a9e7
@repo/utils:test: ✓ src/index.test.ts (1 test) 1ms
@repo/utils:test:  Test Files  1 passed (1)
@repo/utils:test:       Tests  1 passed (1)
```

Phase 1 acceptance §1.5 (두 번째 lint 캐시 100% hit)도 부수적으로 확인됨.

#### 통합 테스트

해당 없음 (Integration Test Required = no).

### 2. 수동 검증

1. **Action**: `bash .harness-kit/bin/sdd status` (Task 8 직후)
   - **Result**: Active Phase=phase-01, Active Spec=spec-x-roadmap-migration, Plan Accept=yes, Branch=spec-x-roadmap-migration (SDD-x). Artifacts ✓ spec ✓ plan ✓ task ✓ walkthrough ✗ pr_description (Executing).

2. **Action**: `grep -rn "ROADMAP" --include="*.md" .` (Task 10 직후)
   - **Result**: `ROADMAP.md` 자체 1건만 검출 → `git rm` 후 0건. `spec-x-roadmap-migration` 슬러그(specs/, queue.md, plan 본문)는 의도된 잔존.

3. **Action**: `ls ROADMAP.md`
   - **Result**: `No such file or directory` ✓.

### ROADMAP → backlog 의미 단위 매핑 표

| ROADMAP 섹션 | 행수 | 이전 위치 | 의미 손실 |
|---|---:|---|:---:|
| §1 Vision (원칙) | 7 | README.md (기존 동일 내용 유지) | 0 |
| §2 Phase 1 (모노레포 골격) | 35 | `backlog/phase-01.md` 메타+성공기준+SPEC 요점 | 0 |
| §2 Phase 2 (shared) | 9 | `backlog/phase-02.md` | 0 |
| §2 Phase 3 (backend) | 27 | `backlog/phase-03.md` (블로커 명시) | 0 |
| §2 Phase 4 (apps) | 12 | `backlog/phase-04.md` (vertical-slice acceptance 보존) | 0 |
| §2 Phase 5 (운영/도구) | 6 | `backlog/phase-05.md` | 0 |
| §2 Phase 6 (CI/CD) | 6 | `backlog/phase-06.md` | 0 |
| §3 차별화 포인트 (9 항목) | 14 | 관련 phase 본문에 분산 (의도적 — "한눈 뷰" 포기) | 0 (재구성) |
| §4.1 Active blockers (3) | 3 | `backlog/phase-03.md` "선행 결정 (블로커)" 섹션 | 0 |
| §4.2 Pending decisions (9) | 9 | `backlog/queue.md` Icebox 9 항목 | 0 |
| §4.3 Resolved decisions (15) | 17 | 각 phase-N.md "연관 ADR" 필드 + ADR이 SoT | 0 (DRY, ADR 직접 참조) |
| §5 참고 자산 (3) | 4 | 관련 phase 본문(aiagent → ADR-0003 참조 / node-settings → phase-03 / lat.md → phase-02 위험 노트) | 0 |
| §6 상태 표기 (범례) | 5 | 불필요 (각 phase.md 상태 컬럼은 sdd 표준) | 의도적 제거 |

총 ROADMAP 188줄 → backlog/* 약 950줄 (6 phase + queue, 의도된 확장: 각 phase의 통합 테스트 시나리오 + 위험 표 + 의존성 표가 추가됨).

## 🔍 발견 사항

1. **`sdd phase activate`가 spec-x 컨텍스트를 리셋함** — 본 spec의 가장 큰 *예상 외* 부작용. `phase=phase-01` 활성화 시 `spec` / `planAccepted`가 null/false로 초기화됨. 이는 sdd 모델상 "새 phase는 새 spec 컨텍스트로 들어간다"는 전제를 따른 것이나, *spec-x 실행 중*에는 부적합. **재발 시 RCA-001 후보** (constitution §6.4 `failure-pattern`). 권장 대응:
   - 단기: spec-x 실행 중 `sdd phase activate`를 호출하지 않음. Phase 활성화는 spec-x merge 후 별도 액션.
   - 장기: `sdd phase activate --preserve-spec` 같은 옵션을 sdd CLI에 추가 (harness-kit 본체 개선 후보).

2. **queue.md의 specx 마커 자동 채움 실패** — `sdd specx new`는 specx 마커에 spec을 등록하는 것을 기대했으나, `queue.md`가 *없는 상태에서* 호출되어 마커 채움이 누락됨. 본 spec에서 수기 채움. `sdd ship` 또는 사용 시점에 idempotent 동기화가 필요할 수 있음.

3. **hook `check-plan-accept.sh`의 안전 화이트리스트** — `*.md`, `backlog/`, `docs/`, `specs/`, `.claude/`는 plan-accept 무관하게 통과. 즉 docs 마이그레이션은 plan-accept 없이도 기술적으로 가능하나, sdd ship 절차 일관성을 위해 SDD-x로 진행한 것이 결과적으로 정답.

4. **lefthook pre-commit의 typecheck는 turbo 전체 의존**. 매 commit마다 turbo 캐시 hit이지만, 비-turbo 프로젝트에는 일반화하기 어려운 패턴. ADR-0002 / phase-06의 CI에서 동일 명령 재사용 예정 — 일관성 OK.

5. **`engines.node`(>=22 <23)와 현재 머신(v24.14.1)의 불일치** — 매 commit `[WARN] Unsupported engine` 출력. 본 spec 범위 외이나 phase-01 spec-01-01 작업 시 `engines.node` 또는 .nvmrc 정렬 필요.

## 🚧 이월 항목

- **`sdd phase activate` 부작용 학습** → 단발 RCA 후보 (2회째 발견 시 `docs/rca/RCA-001-sdd-phase-activate-resets-spec.md` 작성).
- **`engines.node` vs 실행 머신 Node 24 불일치 경고** → Phase 1 spec-01-01 (root-files)에서 처리.
- **`.gitignore` modified / `.claude/` untracked / `CLAUDE.md` untracked** drift → 본 spec 외. 별도 FF로 정리 권장.

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent (Opus 4.7) + dennis |
| **작성 기간** | 2026-05-17 |
| **최종 commit** | (ship 시 갱신) |
| **총 commit 수** | 10 (T1 브랜치 생성은 commit 없음) |
| **변경 파일 수** | 신규 8 / 수정 4 / 삭제 1 |
