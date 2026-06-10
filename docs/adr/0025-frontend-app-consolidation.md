---
id: ADR-0025
type: decision
date: 2026-06-10
status: accepted
---

# ADR-0025: frontend 앱 단일화 — web-vite 삭제, depcruise 정적 가드로 대체

## 📚 Context

확정 스택은 frontend 앱 2개(Next + Vite 둘 다)였다. `apps/web-vite`(Vite 8 + TanStack Router SPA)의 존재 명분은 두 가지:

1. SPA 소비자 관점의 데모/레퍼런스
2. **`packages/frontend/*` 가 Next 없이도 동작한다는 살아있는 검증장** — frontend 패키지 framework-agnostic 규칙(ADR-0015)의 증명

그러나 운용 결과:

- **검증 범위가 부분적** — web-vite 가 실제 조립하는 frontend 패키지는 `http-client`·`ui`·`errors` 3개뿐. `auth-store`·`auth-react`·`auth-supabase` 등 핵심 패키지는 web-vite 를 거치지 않아 "증명"이 성립하지 않음.
- **유지 비용은 전역적** — frontend 패키지·env 체계·CSRF wiring(spec-15-02/16-03)·CI 변경마다 두 앱 정합 작업 이중 발생.
- 주력 기능(인증 SDK 통합, Supabase full-stack e2e)은 모두 `apps/web-next` 에 축적됨.
- 디자인 시스템 + auth 화면 작업(design-md 합성)의 타깃 단일화 필요.

핵심 통찰: **"Next 의존이 스며들지 않는다"는 보장은 살아있는 앱보다 정적 의존성 룰이 더 싸고 완전하다.** 앱은 import 한 패키지만 검증하지만, depcruise 룰은 전 패키지를 CI 에서 항상 커버한다.

## 🎯 Decision

1. **frontend 앱을 `apps/web-next` 단일로 통합한다.** `apps/web-vite` 와 그 레퍼런스 문서를 삭제한다.
2. **framework-agnostic 보장은 depcruise 정적 룰로 대체한다.** `@repo/depcruise-config` base 프리셋에 추가:
   - `frontend-no-next-imports` (error): `packages/(frontend|react)/*` → `next` 패키지 의존 금지.
   - Next 전용 어댑터가 필요해지면 `packages/next/<name>` 카테고리를 신설한다 (ADR-0015 의 framework adapter 패턴 그대로).
3. 본 결정은 다음 문서의 "Next+Vite 둘 다" 전제를 **번복**한다: ADR-0004(컴파일 대상 앱 목록), ADR-0006·ADR-0021(web-vite 인증/CSRF 시나리오). 해당 ADR 본문은 point-in-time 기록으로 보존하고 상단에 본 ADR 참조 노트만 추가한다.

## 📊 Consequences

- **긍정**: 문서·구현·CI 비용이 단일 앱 기준으로 절감. framework-agnostic 가드의 커버리지가 "조립된 3개 패키지" → "전 frontend/react 패키지"로 확대. 디자인 시스템 작업 타깃 명확화.
- **부정 (상실)**: Vite 소비자 관점의 번들링/HMR smoke 가 사라짐 — frontend 패키지의 번들러 호환성 회귀(예: ESM 조건부 export 실수)는 depcruise 가 못 잡는다. 단, 이는 web-vite 시절에도 3개 패키지에 한정된 보호였고, 필요 시 패키지 단위 번들 smoke 테스트로 보강 가능.
- **부정 (복원 비용)**: SPA 데모가 다시 필요해지면 재구축 필요. 삭제 commit 을 단독 revert 가능하게 응집해 완화.
- **중립**: `@repo/typescript-config/react-app.json` 등 Vite 호환 preset 은 유지 (react/* 어댑터 패키지가 계속 사용).

## 🔀 Alternatives

- **web-vite 동결 유지 (최소 유지)**: 유지 비용은 줄지만 "부분적 증명" 문제는 그대로 — 가드 역할을 못 하는 앱을 남길 이유가 없음. 비채택.
- **web-vite 를 전 패키지 조립장으로 확장**: 검증 범위 문제는 해결되나 유지 비용이 역방향으로 폭증 (auth e2e 이중화). 비채택.
- **앱 유지 + depcruise 룰 병행**: 룰이 있으면 앱의 가드 역할은 잉여 — 데모 가치만 남는데 그 수요가 현재 없음. 비채택.

## 🔗 Related

- [[ADR-0003]] 패키지 레이아웃 · [[ADR-0015]] framework adapter 카테고리 · [[ADR-0004]]·[[ADR-0006]]·[[ADR-0021]] (부분 번복 대상)
- spec-x-web-consolidation (본 결정 구현)
