---
id: ADR-0019
type: tradeoff
date: 2026-05-30
status: accepted
---

# ADR-0019: 보안 linter (semgrep / socket.dev) — phase-15(CI) 까지 No-Go

## 📚 Context

phase-10 Icebox 에 "보안 linter (semgrep / socket.dev) 도입 여부"가 ADR 후보로 남아 있었다 (구 spec-10-07). 현재 보안 관련 자동 검사는 (1) harness `check-secrets` 훅(시크릿 패턴), (2) `biome` lint, (3) `dependency-cruiser` 경계 검사로 구성된다. 아직 **CI 파이프라인이 없다**(phase-15 예정) — 즉 어떤 도구를 도입해도 *강제 게이트*로 작동할 곳이 없고 로컬 실행은 옵트인에 그친다.

## 🎯 Decision

semgrep / socket.dev **둘 다 지금은 도입하지 않는다 (No-Go)**. 대신 **phase-15(CI) 도입 후보**로 명시 등록한다. 본 spec(spec-10-03)은 결정 기록까지만 — 신규 설정/의존 추가 없음.

## 📊 Consequences

- **긍정**: phase-10 범위 폭주 방지. CI 부재 상태에서 강제력 없는 도구의 노이즈/유지비를 피함. 기존 3중 레이어(check-secrets / biome / depcruise)로 기본선 유지.
- **부정**: SAST(코드 취약 패턴) 및 공급망(악성 의존) 검사 공백이 phase-15 까지 남음. 그 사이 의존성 추가는 수동 주의에 의존.
- **중립**: 결정이 phase-15 에서 재평가됨 — 그때는 CI 라는 강제 지점이 생겨 ROI 가 달라진다.

## 🔀 Alternatives

- **semgrep 즉시 Go (최소 ruleset)**: 코드 SAST. 비채택 이유: CI 없이 로컬 옵트인이라 강제력 0, 룰셋 튜닝 비용 대비 가치 낮음. phase-15 에서 CI job 으로 도입이 적합.
- **socket.dev 즉시 Go**: 공급망(악성/위험 패키지) 탐지. 비채택 이유: GitHub App + org 설정 의존, 로컬 CLI 만으론 가치 제한. phase-15 의 dependency review 와 함께 평가.
- **영구 No-Go**: 비채택 이유: 공급망/SAST 공백을 영구 방치하는 건 boilerplate "운영 가능" 목표와 배치. 재평가 시점(phase-15)을 못박는 편이 정직.

## 📌 Status

Accepted (2026-05-30, spec-10-03 머지 시점). phase-15(CI/CD) 진입 시 재평가 — `backlog/queue.md` 대기 Phase phase-15 항목에 "보안 linter (semgrep/socket) 평가" 연결.

## 🔗 Related

- spec-10-03 (tooling-scripts 번들 — 구 spec-10-07 흡수)
- phase-15 (CI/CD) — 재평가 시점
- harness-kit#161 (hook/lint 인프라 관련)
