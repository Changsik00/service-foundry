# spec-x-roadmap-migration: ROADMAP.md → harness-kit backlog 마이그레이션

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-roadmap-migration` |
| **Phase** | 없음 (Solo Spec) |
| **Branch** | `spec-x-roadmap-migration` |
| **상태** | Planning |
| **타입** | Docs |
| **Integration Test Required** | no |
| **작성일** | 2026-05-17 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

- 본 레포는 `harness-kit` 거버넌스(constitution + agent.md)를 채택하고 SDD(Spec-Driven Development) 워크플로를 운용한다.
- 그러나 작업 계획은 여전히 레포 루트의 `ROADMAP.md`(188줄, 6 Phase + 차별화 포인트 + Open Questions + Resolved decisions)에 있다.
- harness-kit의 정식 계획 자산은 다음과 같다 (→ constitution §6.3):
  - `backlog/queue.md` — 대시보드(active / specx / done은 sdd가 관리, Icebox / 대기 Phase는 사람이 관리)
  - `backlog/phase-{N}.md` — Phase 1개당 단일 파일 (요점 + 방향성 + Spec 표 + 통합 테스트 시나리오 + ADR 참조)
- 결과적으로 두 개의 계획 출처가 공존하며, sdd CLI / 훅 / 에이전트는 `backlog/`만 인식한다.

### 문제점

1. **이중 SoT**: ROADMAP.md(레거시)와 harness-kit `backlog/`(현재)가 동시 존재하면 어느 쪽이 권위인지 모호하다.
2. **자동화 인지 불가**: `sdd status` / `sdd phase activate` / drift 감지 모두 `backlog/phase-{N}.md`를 전제로 한다. ROADMAP.md는 본 도구 체인에서 보이지 않는다.
3. **§4.2 Pending decisions의 위치 부적합**: harness-kit 모델에서 "실행 불가, 결정 대기" 항목은 `queue.md` Icebox에 두는 것이 정의(constitution §3.4)와 일치한다.
4. **참조 깨짐 위험**: 본 마이그레이션 후 `ROADMAP.md` 삭제 시 README/ARCHITECTURE/ADR-0005/ADR-0007에 박힌 ROADMAP 참조가 끊긴다. 동일 PR(스펙)에서 함께 갱신해야 한다.

### 해결 방안 (요약)

ROADMAP.md의 내용을 1:1 의미 보존하면서 harness-kit 자산으로 분해 — Phase 1~6 본문은 각 `backlog/phase-{N}.md`에, §4.2 Pending decisions는 `backlog/queue.md` Icebox에, §4.3 Resolved decisions는 각 phase 파일의 "연관 ADR" 필드에 링크만 남기고 본문은 ADR로 위임. 동시에 ROADMAP을 가리키는 외부 참조(README / ARCHITECTURE / ADR-0005 / ADR-0007)를 새 경로로 갱신하고 ROADMAP.md를 삭제한다.

## 📊 개념도

```mermaid
flowchart LR
    OLD[ROADMAP.md<br/>188줄 단일 파일] --> P1[backlog/phase-01.md<br/>모노레포 골격]
    OLD --> P2[backlog/phase-02.md<br/>shared primitives]
    OLD --> P3[backlog/phase-03.md<br/>backend]
    OLD --> P4[backlog/phase-04.md<br/>apps]
    OLD --> P5[backlog/phase-05.md<br/>운영/도구]
    OLD --> P6[backlog/phase-06.md<br/>CI/CD]
    OLD --> Q[backlog/queue.md<br/>대시보드 + Icebox]
    OLD -.->|§4.3 결정| ADR[docs/adr/*<br/>이미 존재 — 링크만]
    OLD -.->|§4.2 미결| Q
    REF[README/ARCHITECTURE/<br/>ADR-0005/0007<br/>ROADMAP 참조] --> NEW[새 경로로 교체]
    OLD -.x DEL[삭제]
```

## 🎯 요구사항

### Functional Requirements

1. **Phase 파일 6개 신규 작성**: `backlog/phase-01.md` ~ `backlog/phase-06.md`
   - 각 파일은 `.harness-kit/agent/templates/phase.md`의 구조 준수(메타 표 / 배경·목표 / 성공 기준 / SPEC 표 / 통합 테스트 시나리오 / 의존성 / 위험 / Done 조건).
   - **SPEC 표**(`<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 마커 구역)는 sdd가 관리하므로 본 spec에서는 **빈 마커만** 남긴다 — Spec 행 수기 추가 금지.
   - SPEC 표 *아래*의 "spec-{N}-XX — 슬러그" 요점 섹션은 ROADMAP의 Phase 본문(Phase 1의 Root files / config 6종, Phase 2의 7개 패키지 등)을 *작업 단위로 분해*하여 작성한다. 이는 sdd 마커와 무관한 자유 영역.
2. **Queue 대시보드 신규 작성**: `backlog/queue.md`를 `.harness-kit/agent/templates/queue.md` 기반으로 생성.
   - **자동 갱신 마커 4개**(`active`, `specx`, `done`)는 sdd가 채우므로 *템플릿의 빈 상태* 그대로 둔다. `sdd phase activate phase-01`이 active 마커를 채우고, `sdd specx new`(이미 실행됨)가 specx 마커에 본 spec을 등록함.
   - **Icebox 섹션**: ROADMAP §4.2 Pending decisions 9개 항목을 한 줄씩 옮긴다 (예: `- [ ] apps/admin 별도 앱 vs apps/web-vite route 결정`).
   - **대기 Phase 섹션**: Phase 2~6을 1줄씩 (Phase 1은 active로 분리).
3. **Phase 1 활성화**: 본 spec ship *이전*까지 `sdd phase activate phase-01` 실행 — `queue.md`의 `active` 마커가 `phase-01`로 채워지고 `state.json`이 갱신된다.
4. **§4.3 Resolved decisions 처리**: ROADMAP 표 15개 항목은 *전부 이미 ADR-0001~0007 어딘가에 박혀 있다.* phase-N.md의 "연관 ADR" 필드에 해당 ADR 링크만 남기고, ROADMAP의 표 자체는 복제하지 않는다 (DRY — ADR이 SoT).
5. **차별화 포인트 (§3) 분산**: 9개 항목을 적절한 phase의 "성공 기준" 또는 "SPEC 표 행" 또는 phase-05.md 본문으로 분산. 표 자체는 옮기지 않는다.
6. **외부 참조 갱신**: 7개 참조 위치를 갱신.

   | 파일 | 줄 | 현재 표현 | 변경 후 |
   |---|---|---|---|
   | `README.md` | 13 | `자세한 상태는 [ROADMAP.md](./ROADMAP.md) 참조` | `자세한 상태는 [backlog/queue.md](./backlog/queue.md) 참조` |
   | `ARCHITECTURE.md` | 14 | `* [ROADMAP.md](./ROADMAP.md) — Phase, 비전, open question` | `* [backlog/queue.md](./backlog/queue.md) — Phase 대시보드, Icebox` |
   | `ARCHITECTURE.md` | 174 | `(분리 여부는 ROADMAP §4.2)` | `(분리 여부는 backlog/queue.md Icebox)` |
   | `docs/adr/0007-polyglot-strategy.md` | 16 | `ROADMAP의 Phase 1–6` | `backlog/phase-01~06.md` |
   | `docs/adr/0007-polyglot-strategy.md` | 184 | `[ROADMAP.md](../../ROADMAP.md)` | `[backlog/queue.md](../../backlog/queue.md)` |
   | `docs/adr/0005-backend-framework-and-orm-strategy.md` | 5 | `ROADMAP의 Phase 3` | `backlog/phase-03.md` |
   | `docs/adr/0005-backend-framework-and-orm-strategy.md` | 43 | `ROADMAP Phase 3` | `backlog/phase-03.md` |

7. **ROADMAP.md 삭제**: 모든 참조 갱신 + 신규 파일 작성 완료 후 `git rm ROADMAP.md`.

### Non-Functional Requirements

1. **의미 손실 0**: ROADMAP의 모든 정보 단위(Phase 본문, §3 차별화 표, §4.2 Pending, §4.3 Resolved, §5 참고 자산)가 최소 1곳에 보존되어야 한다. 의미 단위별 1:1 매핑 표를 `walkthrough.md`에 남긴다.
2. **DRY**: §4.3 Resolved 표는 ADR로 위임(복제 금지). 차별화 포인트의 ADR 참조 열도 복제 금지.
3. **템플릿 준수**: 모든 phase 파일은 템플릿 헤딩 순서와 마커 위치를 유지한다 (`<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 마커 누락 시 sdd가 깨짐).
4. **한국어**: 모든 신규/수정 본문 한국어 (영문 ADR 본문은 손대지 않음).
5. **`state.json` 영향 인지**: `sdd phase activate phase-01`은 state.json을 변경한다 — spec-x 작업의 자연스러운 부산물이며 본 spec ship 시 `sdd ship`이 state를 정상 갱신.

## 🚫 Out of Scope

- **ARCHITECTURE.md 본문 재작성**: §1의 폴더 구조 / §2의 패키지 표 갱신은 ARCHITECTURE 상단 배너에 따라 *Phase 3 직전*에 별도 spec으로 수행. 본 spec은 ROADMAP 링크만 교체.
- **ADR 본문 수정**: ADR-0005/0007의 ROADMAP 참조 문자열만 교체. ADR 결정 내용은 손대지 않음.
- **Phase 1 본문의 acceptance 변경**: ROADMAP의 Phase 1 acceptance 7개 항목을 그대로 phase-01.md "성공 기준" 으로 옮긴다 — 항목 추가/삭제 금지.
- **신규 ADR 작성**: ROADMAP §4.2의 Pending decisions를 ADR로 promote하지 않음 — Icebox에만 남긴다.
- **Spec 행 자동 추가**: `<!-- sdd:specs:start --> ~ <!-- sdd:specs:end -->` 마커 안에 수기로 Spec 행을 넣지 않는다 — sdd가 채운다.
- **archive 정리**: `ROADMAP.md` 단순 삭제(git rm). `archive/` 이동 불필요.
- **워킹트리의 기존 drift** (`.gitignore` modified / `.claude/` / `CLAUDE.md` untracked) — 본 spec과 무관, 별도 처리.

## 📑 ADR 후보 (Architecture Decision Records)

> 본 SPEC의 결정 중 *장기 자산* 으로 박을 가치 있는 것이 있는가? (constitution §6.3)

- [ ] ADR 가치 있는 결정 있음
- [x] 없음 — 본 spec은 기존 자산을 harness-kit 형식으로 재배치하는 작업. 새로운 아키텍처 결정 없음.

## 🔍 Critique 결과 (선택)

미실행 (단순 docs 마이그레이션이라 critique 가치 낮음).

## ✅ Definition of Done

- [ ] `backlog/phase-01.md` ~ `backlog/phase-06.md` 6개 작성 완료 (템플릿 준수, 마커 포함)
- [ ] `backlog/queue.md` 작성 완료 (Icebox에 §4.2의 9개 항목, 대기 Phase에 phase-02~06)
- [ ] `sdd phase activate phase-01` 실행 — queue.md의 active 마커가 phase-01로 채워짐 확인
- [ ] 외부 참조 7개 위치 모두 새 경로로 교체
- [ ] `ROADMAP.md` 삭제
- [ ] 본 spec의 단위 테스트는 없음 (docs-only) — `pnpm lint` / `pnpm typecheck` / `pnpm test` 그대로 그린 유지 확인
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-x-roadmap-migration` 브랜치 push 완료
- [ ] PR 생성 및 사용자 알림
