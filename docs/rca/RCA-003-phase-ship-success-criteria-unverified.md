---
id: RCA-003
type: failure-pattern
date: 2026-06-01
severity: high
status: active
---

# RCA-003: phase-ship 성공기준을 문자 단위 대조 없이 PASS 판정

## 🔍 Symptom

Phase 가 "성공 기준 충족"으로 ship 됐으나, 일부 성공기준이 **실제로는 미충족**이거나 **요구한 검증 방식과 다른 것으로 대체**된 채 통과됐다. 결함이 다음 phase 에서야 표면화된다.

```
phase-14 성공기준5: "verify CI 가 knip + dependency-cruiser 실행"
  → ship 시 PASS 판정, 그러나 verify.yml 에 knip/depcruise step 부재
  → phase-15(spec-15-01)에서 "미충족분 완성"으로 재작업
```

## 🔁 Reproduction

1. phase.md 성공기준이 정량 문구(예: "X 가 Y 를 실행", "통합 테스트로 Z 확인")로 선언됨.
2. phase-ship 시 에이전트가 기준을 **요약/인상으로** 검증("게이트 PASS 했으니 충족") — 문구의 각 동사·대상을 코드/CI/테스트 증거에 1:1 대조하지 않음.
3. "구현됨" 과 "동작 경로에 배선됨", "테스트 존재" 와 "그 테스트가 대상 코드를 실제로 실행함" 의 차이가 검증에서 누락됨.

발생 이력 (≥2회 → RCA trigger):
- **phase-14 성공기준5** — `verify.yml` 의 knip/depcruise 실행이 선언만 되고 미배선. phase-15 에서 재작업(spec-15-01).
- **phase-15 성공기준4 (review C1, 2026-06-01)** — "통합 테스트로 reqId 비-undefined 확인" 은 충족했으나, 그 e2e 가 `apps/api/src/main.ts` 배선이 아닌 **테스트 하네스가 복제한 미들웨어**를 검증 → main.ts 배선을 제거해도 GREEN. "테스트 존재" 가 "배선 검증" 으로 오인됨.

## 🎯 Root Cause

phase-ship 성공기준 검증이 **선언적 요약**에 의존하고 **증거 기반 문자 대조**를 강제하지 않는다. 성공기준의 핵심 동사("실행한다", "거부한다", "배선된다")가 가리키는 **실제 동작 경로**(CI step / 부트스트랩 파일 / 거부 응답)를 짚지 않으면, "구현/테스트 존재" 라는 약한 증거로 "충족" 을 판정하게 된다. 이 phase 의 본질("구현됐으나 미배선" 해소)과 정확히 같은 함정이 *검증 단계 자체*에 재현된다.

## 🛡 Invariant Violated

> phase-ship 의 성공기준 검증은 각 기준 문구를 **실행 가능한 증거(파일:라인 / CI step / 실패하는 테스트)** 에 1:1 대조해야 한다. "구현됨"·"테스트 있음" 은 "배선됨"·"그 코드를 검증함" 의 증거가 아니다.

이 불변식이 깨지면 success-criteria 게이트가 형식화되어, 미충족 결함이 다음 phase 로 누수된다(이번 RCA 의 두 사례 모두 다음 phase 에서 비용 발생).

## 🚧 Prevention

- **규약(즉시)**: `/hk-phase-ship` 절차에 **"성공기준 문자 단위 대조 체크리스트"** 단계 추가 — 각 기준마다 (1) 동사/대상 파악 → (2) 동작 경로 식별 → (3) 증거 인용(파일:라인 / CI step) → (4) **부정 검증**(해당 코드/배선 제거 시 실패하는 테스트가 존재하는가) 기록.
- **테스트 패턴**: 배선/적용을 검증하는 테스트는 **실제 부트스트랩 경로**(예: `configureApp` 같은 SoT)를 타야 하며, 테스트 하네스가 배선을 복제하면 안 된다. 제거 시 prod·test 동시 실패해야 한다 (phase-15 C1 fix 가 적용한 패턴).
- **phase-review 게이트**: phase-ship 전 독립 감사자(`/hk-phase-review`)가 성공기준별 증거를 재검증 — 이번 RCA 의 두 번째 사례(C1)는 이 경로로 ship 前 포착됨(검증된 효과).

## 🔗 Related

- [[RCA-002-check-secrets-false-positive|RCA-002]] — 가드 형식화(alert fatigue) 계열의 "검증 실효성" 주제
- 트리거: phase-14 성공기준5, phase-15 성공기준4(review C1)
- phase-15 결정 기록: `backlog/phase-15.md` "CI 갭 책임 = phase-ship 검증 누락"
- C1 fix: `apps/api/src/app.setup.ts` (배선 SoT), commit `d6e43d8`
- 절차: `.harness-kit/agent/commands/hk-phase-ship.md` (체크리스트 반영 대상 — harness 로컬 영역)
