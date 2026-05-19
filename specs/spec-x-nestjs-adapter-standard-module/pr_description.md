# docs(spec-x): ADR-0016 NestJS adapter standard `@Module` class pattern

> phase-bound 아닌 *governance* spec. ADR-0015 5회 반복 후 reviewer 의견 → 어댑터 패키지의 *내부 모듈 구현 패턴* 정정. 코드 변경 0. 후속 spec (재구성) 에서 5 어댑터 실제 코드 정정.

## 📋 Summary

### 배경 및 목적

ADR-0015 (PR #11) 로 *framework adapter 카테고리/명명* 컨벤션 박힌 후, 5 어댑터 패키지 (spec-03-02~05) 가 모두 *"객체 리터럴 DynamicModule + symbol injection token"* 패턴 답습.

5회 반복 후 *내부/외부 reviewer 의견*:

> 객체 리터럴은 *허용 가능한 최적화* 이지만 *조직 표준으로 강제* 할 정도는 아니다.
> *기본 권장: `@Module` class / 허용 예외: ultra-thin wrapper* 가 건강한 governance.

내부 critique 결과 reviewer 비판이 *대부분 valid*:
1. **"runtime dep 0" 환상**: 어댑터 패키지가 어차피 `@nestjs/common` 박음. type-only import 가치 거의 0.
2. **Lifecycle 우회 복잡**: `DatabaseShutdownService` 같은 별 class — 표준 `@Module` class + `implements OnModuleDestroy` 면 *자연*.
3. **Onboarding ↓**: 표준 패턴은 *NestJS 공식* — dev 즉시 이해.
4. **NestJS ecosystem 친화성 ↓**: `DiscoveryService` / `Reflector` / CQRS / lifecycle / interceptor auto-registration 등 *class metadata 기반*.
5. **AI/copilot 부정확**: 표준 패턴은 *AI 가 잘 만듦*.
6. **NestJS-locked monorepo**: ADR-0005 + `apps/*` 전부 NestJS — Fastify/Hono 어댑터 현실 가능성 낮음.

본 spec 은 ADR-0016 신규 + ADR-0015 갱신 + memory + ARCHITECTURE 갱신으로 **표준 `@Module` class 패턴 채택** + **ultra-thin 예외 명시**. 실제 코드 재구성은 *별 spec* (phase-03 안 후속).

### 주요 변경 사항

- [x] **ADR-0016 신규** (`docs/adr/0016-nestjs-adapter-standard-module-pattern.md`)
  - 기본 권장: 표준 `@Module` decorator class + `implements OnModuleDestroy` (lifecycle 자연)
  - 허용 예외: ultra-thin adapter (token-only + lifecycle 없음 + ecosystem 기능 불필요 — 3 조건 모두 만족)
  - Symbol injection token 유지 (ADR-0015 일관)
  - core 패키지 framework-agnostic 그대로 (ADR-0015 §4-bis 변경 없음)
  - 검토한 대안 4 + Consequences (장점 5 / 단점 4) + Revisit Triggers 4

- [x] **ADR-0015 갱신** — 상단 IMPORTANT note + 관련 문서 cross-link. 결정 자체 변경 0 (책임 분리만).

- [x] **memory `feedback_platform_agnostic_packages` 갱신** (git 외부) — *어댑터 내부 구현* 은 framework 친화 OK 절 신규 추가. core 패키지 룰 변경 0.

- [x] **`ARCHITECTURE.md §3.2` 갱신** — framework adapter 룰 절에 ADR-0016 cross-link 한 줄.

### Phase 컨텍스트

- **Phase**: governance (phase-bound 아님)
- **PR Target**: `main`
- **트리거**: ADR-0015 5회 반복 → reviewer 의견
- **본 SPEC 역할**: 룰 명문화 (코드 0 변경). 후속 spec (재구성) 에서 5 어댑터 실 정정.

## 🎯 Key Review Points

1. **🎯 절충안 (옵션 D) 채택**: 4 옵션 (A 객체 리터럴 강제 / B `@Module` 강제 / C 둘 다 허용 / D 절충안) 검토 후 *기본 권장 + 명확 예외 조건* 채택. *pragmatic governance* — 강제 안 함, 단 ultra-thin 기준 명확.

2. **core vs adapter 책임 분리 *명확화***: ADR-0015 의 *framework-agnostic 원칙* 은 **core 패키지** (`packages/backend/*`) 한정. **어댑터 패키지** (`packages/nestjs/*`) 의 *내부 구현 패턴* 은 별 결정. 본 ADR 이 *그 책임 분리* 를 명문화.

3. **"runtime dep 0" 환상 인정**: 내 spec-03-02 시점의 *주된 사유* 였는데 *재고 후 인정*. 어댑터 패키지가 어차피 `@nestjs/common` `dependencies` 박음 + 비-NestJS app 에서 본 어댑터 import 가능성 0 → bundle 가벼움 *가치 없음*.

4. **Lifecycle hook 자연 해결**: spec-03-05 의 `DatabaseShutdownService` 우회 class 가 *불필요* — 표준 `@Module class implements OnModuleDestroy` 면 자연. 후속 재구성 spec 에서 우회 class 제거.

5. **ADR 분리 (0015 / 0016)**: 책임 분리 — *미래 변경 시 영향 최소*. ADR-0015 폐기 ≠ ADR-0016 폐기. governance 단단함 ↑.

6. **Symbol token 유지**: 호출자 코드 영향 0. 객체 리터럴 ↔ `@Module` class 전환 시 `BACKEND_*` / `DATABASE` 등 token export *변경 없음* — 후속 재구성 spec 가능성 낮음.

7. **5 어댑터 임시 위반 인정 — depcruise 룰 추가 0**: 본 ADR ship 후 5 어댑터는 *위반 상태*. depcruise allowList 박지 않음 (위반 *드러내야* 후속 spec motivation). 객체 리터럴 ↔ `@Module` class 는 *코드 패턴* 영역 — depcruise 영역 아님.

8. **scope 최소화** — 본 spec 은 룰만, 코드는 별 spec: spec-x-governance-reset-package-layout (PR #11) 패턴 답습. 본 PR 머지 후 `spec-03-XX-rework-nestjs-adapters` 진입.

9. **AI/copilot 표준 친화 효과**: reviewer 가 *명시* — 표준 패턴 = AI 가 잘 만듦 = 작업 효율 ↑. 본 작업 중에도 *내가 처음엔 표준 패턴 생각하다 객체 리터럴로 수정한 흔적* 이 있었음 (walkthrough §발견 사항 #4).

10. **재검토 기준 4개 명시** (ADR-0016 §Revisit): NestJS major upgrade / 다른 framework adapter / decorator spec 변화 / NestJS ecosystem 불사용. *룰이 영구가 아닌 조건부* 임을 명문화.

## 🧪 Verification

### 자동 테스트

본 spec 은 *문서/룰만* — 단위 test 없음.

```bash
ls docs/adr/0016-*.md   # → 신규 ADR 존재 확인
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs packages/
```

**결과**: ✔ no dependency violations found (변경 없음 — 룰 추가 0, 코드 변경 0)

### 수동 검증

1. ADR-0016 마크다운 정상 (frontmatter + 절 구조 + 코드 예시) ✓
2. ADR-0015 갱신 — 결정 자체 변경 없음 (책임 분리만, cross-link 박힘) ✓
3. memory 갱신 — `feedback_platform_agnostic_packages` core vs adapter 구분 명시 ✓
4. ARCHITECTURE.md §3.2 — framework adapter 룰 절에 ADR-0016 cross-link ✓
5. 5 어댑터 코드 — *변경 0* (재구성은 별 spec 예정) ✓

## 🔗 참조

- **ADR**: `docs/adr/0016-nestjs-adapter-standard-module-pattern.md` (신규) + `docs/adr/0015-framework-adapter-naming-and-layout.md` (cross-link)
- **walkthrough**: `specs/spec-x-nestjs-adapter-standard-module/walkthrough.md` (결정 8 + 사용자 협의 4 + 발견 7)
- **선행 PR**: #11 (spec-x-governance-reset-package-layout — ADR-0015 박은 PR. 본 spec 트리거 카운트 5회)
- **선행 spec 작업**: spec-03-02 (logger) / 03-03 (relocate) / 03-04 (http-client) / 03-05 (database) — 5 어댑터 박힌 작업
- **memory**: `feedback_platform_agnostic_packages` + `MEMORY.md` index
- **후속 spec (즉시)**: `spec-03-XX-rework-nestjs-adapters` — 5 어댑터 코드 재구성

## 📝 Post-Merge

- [ ] Merge → `main` (spec-x → main 직접)
- [ ] phase-03-backend-foundation 브랜치에서 후속 재구성 spec 진입 시 본 PR 의 ADR 이 *base 룰*
- [ ] 사용자 알림 + 다음 spec (`spec-03-XX-rework-nestjs-adapters`) 진입 옵션

## ✅ Definition of Done

- [x] ADR-0016 신규 작성
- [x] ADR-0015 갱신 (cross-link)
- [x] memory `feedback_platform_agnostic_packages` 갱신
- [x] ARCHITECTURE.md §3.2 갱신
- [x] `walkthrough.md` / `pr_description.md` ship commit (본 commit)
- [ ] PR 생성 (base = `main`)
- [ ] 사용자 알림
- [x] **후속 spec 명시**: 5 어댑터 재구성 (Icebox / 이월 항목)
