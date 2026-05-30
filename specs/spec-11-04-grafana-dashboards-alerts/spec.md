# spec-11-04: Grafana 대시보드 + brute force alert

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-11-04` |
| **Phase** | `phase-11` |
| **Branch** | `spec-11-04-grafana-dashboards-alerts` |
| **상태** | Planning |
| **타입** | Feature |
| **Integration Test Required** | yes |
| **작성일** | 2026-05-30 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황
11-03 으로 apps/api 가 `auth_login_{attempts,success,failure}_total` 을 노출하고 prometheus 가 scrape 하지만, (1) grafana 가 prometheus 를 datasource 로 모르고(provisioning 없음), (2) 대시보드/alert 가 없어 수치를 *보거나 경보*할 수 없다.

### 문제점
- 메트릭이 있어도 사람이 볼 대시보드·자동 경보가 없으면 관측성의 가치가 미완.
- phase-11 시나리오 2(brute force → alert)가 닫히지 않음.

### 해결 방안 (요약)
grafana provisioning(datasource=prometheus + auth 대시보드 JSON) + prometheus **alert rule(brute force: login_failure rate 급증)** 을 추가. compose 에 provisioning/rule 마운트. alertmanager 없이 prometheus 가 rule 을 평가(firing 상태는 `/api/v1/rules`·`/api/v1/alerts` 로 확인 가능).

## 🎯 요구사항

### Functional Requirements
1. grafana datasource provisioning — prometheus 자동 등록 (`tooling/docker/observability/grafana/provisioning/datasources/`).
2. grafana dashboard provisioning — auth 대시보드(login attempts/success/failure rate 패널) 자동 로드.
3. prometheus alert rule — **brute force**: `rate(auth_login_failure_total[1m])` 임계 초과 시 firing. `prometheus.yml` `rule_files` 연결.
4. `pnpm infra:up` 시 grafana 가 datasource·대시보드를 갖추고, prometheus 가 rule 을 로드한다.

### Non-Functional Requirements
1. provisioning 은 코드(파일)로 — 수동 grafana 설정 금지 (재현성).
2. grafana 관리자 비밀번호 등 시크릿은 env 보간 (기존 패턴, secret 가드 warn 예상).
3. 임계/평가주기는 합리적 기본값 + 주석.

## 🚫 Out of Scope
- **refresh-reuse / impossible-travel / mass-revocation alert** — 해당 메트릭 미구현(11-03 은 login 3종) → 후속(메트릭 추가 + alert).
- alertmanager(라우팅/통지) — 본 spec 은 rule 평가·firing 까지. 통지는 후속.
- 풍부한 대시보드(다수 패널/변수) — auth login 핵심 패널 위주.

## 📑 ADR 후보
- [ ] 있음
- [x] 없음 (provisioning/alert 는 설정 — 11-03 연장)

## 🔗 관련 문서 (Related)
- 관련 phase: `backlog/phase-11.md` (§성공 기준 4·5, §시나리오 2)
- 직전 spec: spec-11-03 (metrics — 카운터 데이터원)

## ✅ Definition of Done
- [ ] grafana datasource + 대시보드 provisioning 파일
- [ ] prometheus brute force alert rule + rule_files 연결
- [ ] 통합: grafana+prometheus 기동 → datasource provisioned(API) + rule loaded(`/api/v1/rules`) 확인
- [ ] walkthrough / pr_description ship
- [ ] push + PR (base `phase-11-observability`)
- [ ] 사용자 알림
