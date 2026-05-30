# Implementation Plan: spec-11-04

## 📋 Branch Strategy
- 신규 브랜치: `spec-11-04-grafana-dashboards-alerts` (from `phase-11-observability`)
- base 모드: PR target = `phase-11-observability`

## 🛑 사용자 검토 필요
> [!IMPORTANT]
> - [ ] alert 범위 = **brute force(login_failure) 만** — refresh-reuse 등은 메트릭 미구현으로 후속.
> - [ ] alertmanager 없이 prometheus rule 평가까지 (firing 확인은 API). 통지는 후속.

> [!WARNING]
> - [ ] grafana env(admin password) → secret 가드 warn 예상 (`HARNESS_HOOK_MODE_SECRETS=warn`).
> - [ ] 통합 테스트가 grafana+prometheus(docker) 기동 → 느림, 포트 override.

## 🎯 핵심 전략

| 컴포넌트 | 전략 | 이유 |
|:---:|:---|:---|
| grafana datasource | provisioning yaml (prometheus url) | 코드화·재현성 |
| grafana dashboard | provisioning provider + dashboard JSON | 자동 로드 |
| prometheus alert | rule file + `rule_files` 연결 | login_failure rate |
| compose | grafana provisioning + prometheus rules 마운트 | 파일 기반 |
| 테스트 | 통합(기동→datasource API + rule API 확인) | 설정 검증 |

## 📂 Proposed Changes

### tooling/docker/observability
- [NEW] `grafana/provisioning/datasources/prometheus.yml` — prometheus datasource
- [NEW] `grafana/provisioning/dashboards/dashboards.yml` — dashboard provider
- [NEW] `grafana/dashboards/auth.json` — auth login 대시보드(attempts/success/failure rate 패널)
- [NEW] `prometheus-rules.yml` — brute force alert rule
- [MODIFY] `prometheus.yml` — `rule_files: [prometheus-rules.yml]`

### tooling/docker/compose.yaml
- [MODIFY] grafana — provisioning/dashboards 볼륨 마운트
- [MODIFY] prometheus — rules 파일 마운트

### 통합 테스트
- [NEW] `tooling/docker/observability/smoke-obs.sh` — prometheus+grafana 기동(포트 override) → grafana `/api/datasources` 에 prometheus 존재 + prometheus `/api/v1/rules` 에 brute force rule 존재 확인 → 정리

## 🧪 검증 계획

### 구성
```bash
docker compose -f tooling/docker/compose.yaml config --quiet
```

### 통합 (Integration Test Required = yes)
```bash
bash tooling/docker/observability/smoke-obs.sh
```
grafana datasource provisioned + prometheus rule loaded 확인.

### 수동
1. `pnpm infra:up` → grafana(:3000) 로그인 → auth 대시보드 + datasource 확인.
2. prometheus `/alerts` 에 brute force rule 표시.

## 🔁 Rollback
- provisioning/rule/대시보드 파일 + compose 마운트 + prometheus rule_files 뿐. 파일·마운트 제거로 롤백. 메트릭(11-03)/trace(11-02) 영향 없음.

## 📦 Deliverables
- [ ] task.md 작성
- [ ] Plan Accept
- [ ] (실행 후) walkthrough / pr_description ship
