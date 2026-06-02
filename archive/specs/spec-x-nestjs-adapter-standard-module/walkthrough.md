# Walkthrough: spec-x-nestjs-adapter-standard-module

> phase-bound 아닌 *governance* spec. ADR-0015 5회 반복 후 reviewer 의견 → 어댑터 패키지의 *내부 모듈 구현 패턴* 정정. 코드 변경 0. 본 spec ship 후 별 spec (재구성 spec) 에서 5 어댑터 실제 코드 정정.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| 어댑터 모듈 구현 패턴 | (A) 객체 리터럴 강제 / (B) @Module 강제 / (C) 둘 다 허용 / (D) 절충안 | **D** | NestJS 표준 친화 + pragmatic governance. 기본 @Module class / 허용 예외 ultra-thin |
| ultra-thin 예외 조건 | 자유 / 명확 기준 | **명확 기준 3** | token-only + lifecycle 없음 + ecosystem 기능 불필요 — 셋 모두 만족 시 객체 리터럴 OK |
| core 패키지 영향 | 함께 변경 / 변경 0 | **변경 0** | ADR-0015 §4-bis (framework-agnostic) 그대로. 본 ADR 은 *adapter 내부 한정* |
| symbol injection token | 유지 / 변경 | **유지** | 호출자 코드 영향 0. 객체 리터럴 ↔ class 전환 시 token export 변경 없음 |
| lifecycle hook 박는 방식 | 우회 class (DatabaseShutdownService) / Module class 자체 | **Module class 자체** | implements OnModuleDestroy — 우회 class 제거 → 자연 |
| ADR 분리 | ADR-0015 안에 통합 / 별 ADR-0016 | **별 ADR-0016** | 책임 분리 (ADR-0015 카테고리/명명 / ADR-0016 모듈 패턴). 미래 변경 영향 최소 |
| 기존 5 어댑터 처리 | 본 spec 안에 정정 / 별 spec | **별 spec** | 룰 박는 spec 과 코드 변경 spec 분리 (spec-x-governance-reset 패턴 답습) |
| depcruise 룰 추가 | 패턴 강제 / 추가 0 | **추가 0** | 객체 리터럴 ↔ @Module class 는 *코드 패턴* — depcruise 영역 아님. 사람 review + ADR 가이드로 충분 |

### ADR 승격 가이드

- [x] ADR 승격 대상 있음 → **ADR-0016** (type: convention) — 박힘.

## 💬 사용자 협의

본 spec 의 트리거는 *외부 (또는 다른 AI) reviewer 의견*. 사용자가 그 의견을 *나에게 던지고* 내 반론 / 검토를 받음:

- **주제 1 — Reviewer 의견 (5회 반복 후)**: 
  > 객체 리터럴은 *허용 가능한 최적화* 이지만 *조직 표준으로 강제* 할 정도는 아니다. *기본 권장: @Module class / 허용 예외: ultra-thin wrapper* 가 건강한 governance.

- **주제 2 — 내 본 입장 재검토 (내부 critique)**: 객체 리터럴 채택 사유 ("runtime dep 0" / "framework-agnostic adapter") 를 진솔하게 *재고*:
  - "runtime dep 0" 은 *어댑터 패키지에서 환상* — `@nestjs/common` 어차피 `dependencies` 박힘
  - 비-NestJS app 에서 `@repo/nestjs-*` import 가능성 *0* — bundle 가벼움 가치 없음
  - Lifecycle 우회 (`DatabaseShutdownService`) 가 *불필요 복잡*
  - Onboarding / AI / ecosystem 친화 모두 표준 @Module class 우세
  - 우리는 *사실상 NestJS monorepo* (Fastify 어댑터 현실 가능성 낮음)
  - → reviewer 비판 *대부분 valid*. 반박할 부분은 *유일하게* "core vs adapter 책임 분리 명확화" 뿐 — 그것도 reviewer 본인이 *정확히 framing* 함.

- **주제 3 — 사용자 결정**: *"1 채택"* (절충안 D — core pure / adapter standard `@Module`).

- **주제 4 — 진행 절차 합의**: spec-x-governance-reset-package-layout 패턴 답습 — ADR 박는 spec 과 코드 변경 spec 분리. 본 spec (룰) → 후속 재구성 spec (코드).

## 🔁 진행 과정

### T1 — 브랜치 생성

- `git checkout main && git pull --ff-only` (main 최신, spec-x-governance-reset 이미 반영)
- `git checkout -b spec-x-nestjs-adapter-standard-module`
- queue.md 충돌 resolution (main 의 *active 없음* 유지, specx 섹션은 staged 신규 추가)

### T2 — ADR-0016 신규 작성 (`5703e1e`)

- `docs/adr/0016-nestjs-adapter-standard-module-pattern.md` 작성:
  - frontmatter (id: ADR-0016, type: convention, status: accepted, date: 2026-05-19)
  - Context: ADR-0015 5회 반복 후 6가지 문제 (runtime dep 0 환상 / lifecycle 우회 / onboarding / ecosystem / AI / NestJS-locked monorepo)
  - Decision: 표준 `@Module` class 기본 + ultra-thin 예외 + 코드 예시
  - Alternatives: 4 옵션 (A 객체 리터럴 강제 / B @Module 강제 / C 둘 다 허용 / D 절충안 채택)
  - Consequences: 장점 5 + 단점 4 + tradeoff 요약
  - Revisit Triggers: 4 시나리오 (NestJS major / 다른 framework adapter / decorator spec / NestJS ecosystem 불사용)
  - 관련 문서 (ADR-0005 / 0015 / memory)
- spec-x 문서 (spec/plan/task) + queue.md spec-x 진입 갱신 포함

### T3 — ADR-0015 갱신 + cross-link (`f1659fe`)

- 상단 IMPORTANT note: 2026-05-19 갱신 + 모듈 패턴 ADR-0016 분리 명시
- 관련 문서에 ADR-0016 cross-link
- *결정 자체 변경 0* — 책임 분리만

### T4 — memory + ARCHITECTURE 갱신 (`f17cf14`)

- memory `feedback_platform_agnostic_packages` (git 외부):
  - "core 패키지 framework-agnostic — 그대로" 강조
  - "어댑터 패키지 *내부 구현* framework 친화 OK (ADR-0016)" 신규 절
  - 관련 ADR 에 ADR-0016 cross-link
- `MEMORY.md` index: description 갱신
- `ARCHITECTURE.md §3.2`: framework adapter 룰 절에 한 줄 추가 (ADR-0016 cross-link)

### T5 — Ship (본 commit)

- walkthrough + pr_description 작성
- sdd ship + push + PR

## 🧪 검증 결과

본 spec 은 *문서/룰만*. 단위 test 0.

```bash
ls docs/adr/0016-*.md   # → 신규 ADR 존재 확인
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
# → 0 violations (변경 없음 — 룰 추가 0, 코드 변경 0)
```

## 🔍 발견 사항

1. **"runtime dep 0" 의 환상**: 어댑터 패키지의 type-only import 가치가 *실제로 거의 0* 임을 reviewer 의견으로 catch. 비-NestJS app 에서 `@repo/nestjs-*` import 가능성 0 — bundle 가벼움 *의미 없음*. 내가 spec-03-02 시점에 박은 *주된 사유* 였는데 *재고 필요*.
2. **NestJS lifecycle hook 의 작지만 중요한 디테일** (spec-03-05 에서 발견): `useValue` 객체에 lifecycle hook 안 박힘 → `useFactory` + 별 class 우회 패턴. 표준 `@Module` class 면 *자연 해결*. 본 ADR 채택의 *실용 동기 1* 위치.
3. **ADR 책임 분리 가치**: ADR-0015 (카테고리/명명) + ADR-0016 (모듈 구현 패턴) 분리 — *미래 변경 시 영향 최소*. ADR-0015 폐기 ≠ ADR-0016 폐기. governance 단단함 ↑.
4. **AI/copilot 친화성**: reviewer 가 지적 — 표준 패턴은 *AI 가 잘 만듦*. 우리 컨벤션은 *매번 환기*. 본 작업에서도 spec-03-02 작성 시 내가 *처음엔 표준 @Module class 생각하다 객체 리터럴로 수정* 한 흔적이 있었음. **AI/copilot 표준 친화 = 작업 효율** 직결.
5. **"NestJS-locked monorepo" 자기 인식**: ADR-0005 NestJS locked + `apps/*` 전부 NestJS. *다른 framework adapter (Fastify / Hono) 가능성 = 현실적 낮음*. 객체 리터럴이 박는 *추상 가치* (framework-agnostic adapter) 가 *실 사용처 없음* → over-engineering 인정.
6. **5회 반복 후 정정의 가치**: 패턴 박힌 후 *5회 반복했을 때* 정정하는 것이 *건강한 review cycle*. 1~2회에서 catch 못 한 게 *부끄러움이 아니라 정상* — sufficient evidence 가 모인 후 *재고*.
7. **사용자 발화 *"1 채택"* 의 본질**: 짧지만 *내 옵션 1 (Option 1: 절충안 + 기존 5 어댑터 재구성)* 채택 명확. 빠른 의사결정 + scope 분리 (룰 spec → 코드 spec) 합의.

## 🚧 이월 항목

- **5 어댑터 실 코드 재구성 spec** (즉시 후속, phase-03 안):
  - `@repo/nestjs-settings` / `nestjs-logger` / `nestjs-http-client` / `nestjs-database` — 객체 리터럴 → `@Module` class 전환
  - `DatabaseShutdownService` 제거 → `DatabaseModule implements OnModuleDestroy`
  - test 그대로 + 일부 mock 단순화 가능
  - 슬러그 후보: `spec-03-XX-rework-nestjs-adapters` (spec-03-03 답습)
- **ADR-0015 객체 리터럴 강제 표현 정정** (선택): 본 ADR 로 격리됐으나 ADR-0015 본문에 *객체 리터럴* 강조 표현 남아있음. 후속 정리 spec 가능.
- **다른 framework adapter 추가 시 본 ADR 일반화** — 필요 시점 (현재 미래 spec).

## 📅 메타

| 항목 | 값 |
|---|---|
| **작성자** | Agent + dennis + 외부 reviewer |
| **작성 기간** | 2026-05-19 |
| **commits** | 3 (T2 5703e1e + T3 f1659fe + T4 f17cf14) + T5 ship (본 commit) |
| **memory 갱신** | 1 (`feedback_platform_agnostic_packages` + `MEMORY.md` index) |
| **이월 spec** | spec-03-XX-rework-nestjs-adapters (즉시 후속) |
