# Walkthrough: spec-x-auth-foundation-prep

> **순수 docs spec-x** — phase-03 진입 *전제* 작업. ADR-0005/0006 블로커 해소 + Auth Foundation 2차안 박기 + 9 phase 재조정 + design note. *코드 변경 0건*.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 작업 형식 | spec-x / 일반 spec / FF | **spec-x** | active phase 없음 (phase-02 done) + 순수 docs 작업 — chore/docs scope 적합 |
| PR 단위 | 1 PR / 분할 | **1 PR** | 결정 응집 — ADR ↔ phase.md cross-ref 정합 (분리 시 dangling reference) |
| ADR 수 | 단일 거대 ADR / 분할 | **5개 분할** | 각 ADR 단일 책임. 향후 갱신 단위 명확 (0005 framework / 0006 전략 / 0012 error / 0013 session / 0014 security) |
| phase 수 | 본래 6 → 9 (옵션 A) / 8 (B) / 7 (C) | **9 (옵션 A)** | 2차안 완전판. Provider Adapters phase로 Core Surface 컨벤션 *실증* |
| ORM | Prisma+Drizzle 둘 다 (memory) / Drizzle 단일 (2차안) | **Drizzle 단일** | auth-session storage 강결합 + 두 ORM 운영 비용 + 2차안 권장. memory 정정 |
| `auth-errors` 별 패키지 | 신규 / @repo/errors 흡수 | **흡수** | ADR-0009 flat code 일관 (`AuthError extends AppError` ❌). AuthErrorCode 13개를 `@repo/errors` 도메인 코드로 등록 |
| `auth-session` 별 패키지 | 신규 / auth-jwt 흡수 | **별 패키지** | rotation/revocation 응집 — jwt는 *pure JWT* 책임 |
| ADR-0005/0006 본문 처리 | 전면 재작성 / 상단 갱신+보류 본문 보존 | **상단 갱신 + 보류 보존** | 보류 분석 자료가 *결정 근거*로 가치. git history만이 아닌 *문서로* 보존 |
| design note 분리 | ADR 한 문서로 / design note 별도 | **분리** | ADR=결정(권위) / design note=방향성+플로우+예시(참조) |
| memory 정정 | 본 spec-x / 별 spec-x | **본 spec-x** | 결정 박는 시점에 memory도 함께 갱신 — drift 방지 |

### ADR 승격 가이드

- [x] **5 ADR 승격** (전부 새로 박힘):
  - ADR-0005 (Accepted) — NestJS + Drizzle
  - ADR-0006 (Accepted) — Auth Platform 전략 (Consistent Wrapped SDK)
  - ADR-0012 (신규, convention) — Auth Error Normalize
  - ADR-0013 (신규, convention) — Session Lifecycle
  - ADR-0014 (신규, convention) — Security Baseline

## 💬 사용자 협의

- **주제 1**: phase-02 회고 vs Phase 3 직진 → 사용자가 *자체 자문 자료* 가져옴 → Auth Foundation 1차안 검토
- **주제 2**: 1차안 vs 2차안 분석 → **2차안 채택** (LCD 함정 회피 + Provider 강점 살림). 옵션 A (9 phase 완전판) 선택
- **주제 3**: 선행 docs 작업 필요성 → 사용자 명시 *"지금 조사한 내용은 먼저 선행되어야 할 것 같은데?"* → spec-x로 박기
- **주제 4**: 모델 비용 우려 (이전 세션 Opus 사용) → 안전 중단 + Sonnet 전환 후 재개

> 본 spec-x는 *사용자 명시 결정*이 많은 작업 — agent 자체 분석은 phase 분할 옵션 비교 + ADR 분할 권장 정도. 최종 채택은 모두 사용자.

## 🛡 lefthook race fix 검증 (RCA-001)

본 spec-x는 *.md 파일만* 변경 → lefthook typecheck trigger *0건* (glob `*.{ts,tsx,cts,mts}` 매칭 안 함). RCA-001 fix(`parallel: false` + `piped: true` + typecheck `glob`)의 *글로브 한정* 동작 검증:

- 9 commit 모두 biome (skip) + typecheck (skip) → 정상 통과
- 0건의 typecheck trigger — *불필요 trigger 회피* 가치 확인 (RCA-001 §Prevention 3rd fix)

## 🔍 발견 사항

### 1. ADR 상단 Decision + 보류 본문 보존 패턴이 효과적

ADR-0005/0006이 *보류 상태*에서 풍부한 분석 자료(403줄/354줄)를 가지고 있었음. *전면 재작성* 대신 *상단에 §A Decision 섹션 추가 + §1~§N은 보류 분석 자료로 보존* 패턴 채택. 이유:
- 보류 분석은 *결정의 근거* — git history만이 아닌 *문서로* 보존 가치
- 재참조 가능 — 결정 변경 시 분석 재활용
- 변경량 작음 — 리뷰 부담 낮음

향후 *보류 상태 ADR을 확정*할 때 본 패턴 답습 권장.

### 2. ADR 분할이 *cross-ref 친화*

ADR-0006(전략) + ADR-0012(error) + ADR-0013(session) + ADR-0014(security) 4분할 결과:
- 각 ADR이 *단일 책임* 명확
- 향후 갱신 시 *영향 범위 한정* (예: rate limit 조정 시 ADR-0014만)
- ADR-0006이 *허브* 역할 — §A.3 Cross-ref 표로 0012/13/14 연결
- 단점: 4 PR로 분리 시 dangling reference — 본 spec-x에서 *1 PR*로 박힘

### 3. 13 패키지 + 9 phase는 *야심차지만 실현 가능*

본래 phase-02에서 *최소 골격*(`@repo/auth-contracts` 핵심 4 schema)만 박혔음. 본 spec-x로 *확장 계획*이 박혀, phase-05~10에 분산:
- phase-05~07: 직접 구축 (Foundation / Integration / Extension)
- phase-08: Provider Adapters (실증)
- phase-09~10: Apps + Admin + Ops

각 phase 4~7 spec 예상 — 총 spec 수 *30+*. 본 boilerplate scope를 *YAGNI 면제* 원칙(memory)으로 정당화. 향후 phase 진입 시점에 *각 spec scope 재검토* 가능.

### 4. design note + ADR 분리의 효과

design note는 *방향성+플로우+예시 코드* 박음 (~1000줄). ADR은 *결정 본문*만 (~150~250줄 each). 분리 효과:
- ADR을 *짧고 명확*하게 유지 (Decision 중심)
- design note에서 *전체 그림* 한 번에 파악 가능
- ADR cross-ref 표가 *각 결정 → 어느 ADR* 매핑 명확

향후 *큰 결정 영역*(예: phase-05 Auth Core 진입 시) 동일 패턴 답습 가능.

### 5. memory와 ADR의 *동기화 부담* 인지

memory `project_boilerplate_locked_stack`이 *"Prisma+Drizzle 둘 다"* 박혀있었음. ADR-0005 Accepted 결정 시 *memory 정정 필요*. 본 spec-x에서 T8에 *memory 갱신 task* 포함했으나, 향후 ADR 결정 시 *memory drift 자동 검출 메커니즘* 부재.

→ Icebox 후보: "memory ↔ ADR 동기화 검출 도구" (phase-10 tooling 영역).

### 6. spec-x는 *active phase 없을 때* 적합

본 spec-x는 *phase-02 done* 직후 진행. active phase 없는 시점이라 *spec-x 형식 자연*. 만약 *active phase 안에서* 동일 작업(phase 재조정)이 필요했다면 *FF 또는 phase 외부 spec-x*로 처리해야 했을 것 — 그 경우 ADR 작업의 *결정 응집*이 더 어려움.

→ phase 전환 시점이 *대규모 결정 박기*의 최적 타이밍.

## 📚 산출물

- **ADR (5)**:
  - [docs/adr/0005-backend-framework-and-orm-strategy.md](../../docs/adr/0005-backend-framework-and-orm-strategy.md) — 보류 → Accepted (NestJS + Drizzle)
  - [docs/adr/0006-auth-strategy.md](../../docs/adr/0006-auth-strategy.md) — 보류 → Accepted (Auth Platform 전략)
  - [docs/adr/0012-auth-error-normalize.md](../../docs/adr/0012-auth-error-normalize.md) — 신규
  - [docs/adr/0013-session-lifecycle.md](../../docs/adr/0013-session-lifecycle.md) — 신규
  - [docs/adr/0014-auth-security-baseline.md](../../docs/adr/0014-auth-security-baseline.md) — 신규
- **design note**: [docs/notes/auth-foundation-architecture.md](../../docs/notes/auth-foundation-architecture.md) — 2차안 본문 ~1000줄
- **phase.md (9)**: `backlog/phase-03.md` ~ `backlog/phase-11.md` 재조정
- **queue.md**: 대기 phase 9개로 갱신 + Icebox 정리
- **memory**: `project_boilerplate_locked_stack` (정정) + `auth_foundation_architecture` (신규) + `MEMORY.md` (index)
- **commit 흐름** (9 commit):
  - `3801fcd` T1 scaffold
  - `19553fb` T2 9 phase 재조정
  - `63eccc3` T3 ADR-0005 Accepted
  - `84cd88a` task.md sync (post-session)
  - `8a519d6` T4 ADR-0006 Accepted
  - `39016f3` T5 ADR-0012
  - `1f19460` T6 ADR-0013
  - `bffc89e` T7 ADR-0014
  - `6827d4a` T8 design note + memory
  - (예정) T9 ship commit
- **검증**: lint / typecheck / test FULL TURBO 그린 (코드 변경 0 → 회귀 0)

## 🔗 후속

- **즉시**: 본 PR 머지 → phase-03 (Backend Foundation) 진입 가능 (블로커 해소)
- **phase-03 첫 spec**: spec-03-01 backend-settings (node-settings wrap)
- **phase-05 진입 시점에**: AuthErrorCode export 위치 결정 (`@repo/errors/auth` sub-path 검토)
- **Icebox 신규 후보**:
  - memory ↔ ADR drift 검출 도구 (phase-10 tooling)
  - `@repo/auth-contracts` 확장 시 codegen 검토 (phase-05 진입 시)
