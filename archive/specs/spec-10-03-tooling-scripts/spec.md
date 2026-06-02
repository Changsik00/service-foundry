# spec-10-03: tooling 스크립트 번들 (manifest / startup-report / config-graph / security-linter 결정)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-10-03` |
| **Phase** | `phase-10` |
| **Branch** | `spec-10-03-tooling-scripts` |
| **상태** | Planning |
| **타입** | Feature (+ Research 결정 1건) |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

phase-10 의 소형 `tooling/scripts` 유틸 3종(service-manifest / startup-report / config-graph)과 보안 linter 도입 결정(구 spec-10-07)이 각각 별도 spec 으로 흩어져 있었다. 각 작업이 1–3 commit 규모라 full SDD ceremony 대비 ROI 가 낮다 (§11.2).

### 문제점

- 앱마다 포트/노출/의존을 **선언적으로 기술한 곳이 없어** 운영·문서화·docker 연동이 암묵지에 의존.
- `apps/api` 부트 시 어떤 config 가 로드됐는지 **가시성 없음** (디버깅·온보딩 비용). 시크릿은 노출되면 안 됨.
- backend/settings 의 config 스키마가 **그래프로 보이지 않아** 의존/구조 파악이 어려움.
- 보안 linter(semgrep/socket.dev) 도입 여부가 **미결**(Icebox).

### 해결 방안 (요약)

§11.4 bundle 로 4건을 한 spec 에 묶는다:
1. **service-manifest**: 각 app 의 `service.yaml` + zod 기반 validator (`pnpm tooling:manifest`).
2. **startup-report**: `apps/api` 부트 시 masked config dump (시크릿 redact 재사용).
3. **config-graph**: backend/settings 스키마 → mermaid 트리 export (`pnpm tooling:config-graph`).
4. **security-linter 결정**: semgrep / socket.dev / 없음 평가 + Go/No-Go 결정 기록 (Go 시 경량 도입, No-Go 시 근거 ADR/노트).

각 스크립트의 **핵심 로직은 순수 함수로 분리**해 단위 테스트한다.

## 🎯 요구사항

### Functional Requirements

**A. service-manifest**
1. `apps/{api,web-next,web-vite}/service.yaml` — `name` / `port` / `expose` / `depends` 필드 선언.
2. `pnpm tooling:manifest` 가 모든 `service.yaml` 을 zod 로 검증 + 교차 검증(포트 중복 없음, `depends` 가 실재 서비스 참조).
3. 검증 실패 시 비-0 종료 + 명확한 에러.

**B. startup-report**
4. `apps/api` 부트 시 로드된 config 를 **시크릿 마스킹**하여 stdout/log 로 1회 출력.
5. 마스킹 대상은 redact 경로(`*SECRET*` / `*PASSWORD*` / `DATABASE_URL` 등)로, `@repo/backend-logger` 의 redact 컨벤션을 재사용/정합.
6. 마스킹 순수 함수 `maskConfig` 단위 테스트.

**C. config-graph**
7. `pnpm tooling:config-graph` 가 backend/settings 스키마(Base + app 확장)의 필드 트리를 **mermaid** 로 출력(stdout 또는 파일).
8. 그래프 생성 순수 함수 단위 테스트.

**D. security-linter 결정**
9. semgrep / socket.dev / 없음 3안 비교(설치비용·CI 통합·노이즈·가치) + **Go/No-Go 결정**을 `docs/decisions/` ADR 또는 walkthrough 결정 기록으로 남김.
10. Go 결정 시에만 경량 설정 1개 추가(범위 폭주 방지); No-Go 시 근거만 기록.

### Non-Functional Requirements

1. 스크립트는 `tsx` 로 실행, 핵심 로직은 순수 함수 분리(테스트 가능).
2. 신규 외부 런타임 의존 최소화 (yaml 파서 등 필요한 것만 catalog 경유).
3. 시크릿은 어떤 출력에도 평문 노출 금지 (startup-report 마스킹 강제).

## 🚫 Out of Scope

- **auth observability**(prometheus metric/grafana/alert) → spec-10-06 (별도, 규모 큼).
- **`pnpm new app`** → 별도 후속 spec.
- config-graph 의 풀 의존성 그래프(패키지 간) — 본 spec 은 settings 스키마 **필드 트리**까지.
- security-linter 의 본격 도입/룰셋 튜닝 — 본 spec 은 결정 + (Go 시) 최소 설정까지.

## 📑 ADR 후보

- [x] ADR 가치 있는 결정 있음 → 후보: `security-linter-decision` (type: decision/tradeoff) — semgrep/socket/없음 Go-No-Go. + `service-manifest-format` (type: convention) — service.yaml 스키마.
- [ ] 없음

## 🔗 관련 문서 (Related)

- 관련 phase: `backlog/phase-10.md` (§성공 기준 3·4·5, 구 10-03/04/05/07 흡수)
- 관련 ADR: ADR-0003, locked stack (node-settings)
- 관련 이슈: harness-kit#161 (보안 linter 결정 시 참고 가능)
- 직전 spec: `spec-10-02` (tooling-generators)

## ✅ Definition of Done

- [ ] manifest validator / maskConfig / config-graph 순수 함수 단위 테스트 PASS
- [ ] 통합: `pnpm tooling:manifest` 0 error, `apps/api` 부트 시 masked dump 출력, `pnpm tooling:config-graph` mermaid 출력
- [ ] security-linter Go/No-Go 결정 기록(ADR 또는 walkthrough)
- [ ] `walkthrough.md` / `pr_description.md` ship commit
- [ ] `spec-10-03-tooling-scripts` 브랜치 push 완료
- [ ] 사용자 검토 요청 알림 완료
