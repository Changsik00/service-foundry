# docs(spec-x-roadmap-migration): migrate ROADMAP.md to harness-kit backlog

## 📋 Summary

### 배경 및 목적

본 레포는 harness-kit 거버넌스(constitution + agent.md) 위에 SDD 워크플로를 운용하지만, 작업 계획은 여전히 레거시 `ROADMAP.md`(188줄 단일 파일)에 있었다. sdd CLI / 훅 / 에이전트는 `backlog/queue.md` + `backlog/phase-{N}.md`만 인식하므로 두 SoT가 공존하는 상태였다. 본 PR은 ROADMAP의 모든 의미 단위를 harness-kit 자산으로 1:1 분배하고 원본을 제거한다.

### 주요 변경 사항

- [x] `backlog/phase-01.md` ~ `backlog/phase-06.md` 6개 신규 작성 (각 phase의 메타 / 성공 기준 / SPEC 표 마커 / 통합 테스트 시나리오 / 의존성 / 위험 / Done 조건)
- [x] `backlog/queue.md` 신규 작성: phase-01 active 마커 + spec-x 마커 + Icebox 9 항목(ROADMAP §4.2) + 대기 Phase 5개
- [x] Phase 1 활성화 (`sdd phase activate phase-01`)
- [x] 외부 ROADMAP 참조 갱신: `README.md` / `ARCHITECTURE.md` 2건 / `docs/adr/0005` 2건 / `docs/adr/0007` 2건 + 보너스로 phase-01.md / phase-05.md 본문 3건 (dead reference 방지)
- [x] `ROADMAP.md` 삭제
- [x] §4.3 Resolved decisions(15 항목)는 ADR로 위임 — phase-N.md "연관 ADR" 필드에 링크만 (DRY)
- [x] §3 차별화 포인트(9 항목)는 관련 phase에 분산 흡수

### Phase 컨텍스트

- **Phase**: 없음 (Solo Spec / SDD-x). 본 PR merge 후 `phase-01`이 active 상태로 자연스럽게 다음 작업(spec-01-01 root-files)으로 이어진다.
- **본 SPEC의 역할**: 작업 추적 시스템 자체의 마이그레이션. 후속 모든 Phase의 SDD 워크플로 기반.

## 🎯 Key Review Points

1. **의미 손실 0**: `walkthrough.md`의 "ROADMAP → backlog 의미 단위 매핑 표" 참조 — 각 ROADMAP 섹션이 어디에 보존되었는지 1:1 추적 가능.
2. **§4.3 Resolved 미복제 (DRY)**: 15개 결정 표를 phase-N.md에 복제하지 않음. ADR이 SoT이며 phase-N.md는 ADR 링크만. 빠른 결정 조회는 ADR 직접 참조.
3. **§3 차별화 포인트 분산 배치**: "한눈 뷰" 표가 사라지고 관련 phase 본문/SPEC 요점으로 흩어짐. 이는 phase 컨텍스트가 작업 시 더 유용하다는 trade-off 판단.
4. **`sdd phase activate` 부작용 발견 및 대응**: 본 spec 실행 중 `sdd phase activate phase-01`이 spec-x state(spec / planAccepted)를 리셋함. 사용자 임시 권한으로 state.json 수기 복원. 상세는 `walkthrough.md` §발견 사항 #1. 재발 시 RCA-001 후보.
5. **sdd-managed 마커 보존**: `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 마커는 본 spec에서 빈 상태로 유지 (sdd가 ship/spec new 시점에 자동 채움).

## 🧪 Verification

### 자동 테스트

```bash
pnpm lint && pnpm typecheck && pnpm test
```

**결과 요약**:
- ✅ `@repo/utils:lint`: cache hit (Biome 5 files, 0 fixes)
- ✅ `@repo/utils:typecheck`: cache hit (`tsc --noEmit`)
- ✅ `@repo/utils:test`: 1 test passed (1ms)

부수 검증: Phase 1 acceptance §1.5 (두 번째 lint 캐시 100% hit) 자연스럽게 통과.

### 수동 검증 시나리오

1. **sdd 상태 확인**: `bash .harness-kit/bin/sdd status` → Active Phase=phase-01, Active Spec=spec-x-roadmap-migration, Plan Accept=yes, Artifacts ✓ spec ✓ plan ✓ task ✓ walkthrough.
2. **ROADMAP 참조 검사**: `grep -rn "ROADMAP" --include="*.md" .` → 의도된 spec-x 슬러그 외 0건.
3. **파일 삭제 검증**: `ls ROADMAP.md` → `No such file or directory`.

## 📦 Files Changed

### 🆕 New Files

- `backlog/phase-01.md`: 모노레포 골격 (In Progress) + spec-01-01~08 요점
- `backlog/phase-02.md`: shared primitives (Backlog) + spec-02-01~05
- `backlog/phase-03.md`: backend (Planning, ADR-0005/0006 블로커) + spec-03-01~10
- `backlog/phase-04.md`: apps (Backlog) + spec-04-01~09 + vertical-slice acceptance
- `backlog/phase-05.md`: 운영/도구 (Backlog) + spec-05-01~06 + 차별화 포인트 흡수
- `backlog/phase-06.md`: CI/CD (Backlog) + spec-06-01~04
- `backlog/queue.md`: 대시보드 + Icebox 9 + 대기 Phase 5
- `specs/spec-x-roadmap-migration/{spec,plan,task,walkthrough,pr_description}.md`: SDD 산출물

### 🛠 Modified Files

- `README.md`: ROADMAP.md → backlog/queue.md 링크 교체
- `ARCHITECTURE.md`: ROADMAP 2건 → backlog/queue.md + phase-01~06.md 포인터
- `docs/adr/0005-backend-framework-and-orm-strategy.md`: ROADMAP Phase 3 → `backlog/phase-03.md` (2건)
- `docs/adr/0007-polyglot-strategy.md`: ROADMAP Phase 1–6 / ROADMAP.md → `backlog/phase-01~06.md` / `backlog/queue.md` (2건)

### 🗑 Deleted Files

- `ROADMAP.md` (188줄): 내용은 backlog/phase-01~06.md + queue.md + ADR 참조로 분산 보존. 회수 필요 시 `git show 2e3469c:ROADMAP.md`.

**Total**: 14 files changed (+8 new / +4 modified / -1 deleted / +1 task.md 갱신)

## ✅ Definition of Done

- [x] 모든 단위 테스트 통과 (turbo cache hit)
- [x] (해당 시) 통합 테스트 통과 — N/A
- [x] `walkthrough.md` ship commit 완료 (본 commit)
- [x] `pr_description.md` ship commit 완료 (본 commit)
- [x] lint / type check 통과
- [x] 사용자 검토 요청 알림 완료

## 🔗 관련 자료

- Active Phase: `backlog/phase-01.md`
- Queue Dashboard: `backlog/queue.md`
- Walkthrough: `specs/spec-x-roadmap-migration/walkthrough.md` (특히 §발견 사항 — `sdd phase activate` 부작용 학습)
- 관련 ADR: 본 spec은 새 ADR 없음. phase-N.md "연관 ADR" 필드에서 0001~0007 참조.
