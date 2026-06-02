# Task List: spec-11-04

> One Task = One Commit. (설정 중심 spec — TDD 보다 구성+통합검증)

## Pre-flight
- [x] Spec ID 확정 및 디렉토리 생성
- [x] spec.md / plan.md / task.md 작성
- [x] 백로그 업데이트 (phase-11.md spec 표 자동)
- [ ] 사용자 Plan Accept

---

## Task 1: 브랜치 + grafana provisioning

### 1-1. 브랜치 + datasource/dashboard
- [x] `git checkout -b spec-11-04-grafana-dashboards-alerts`
- [x] `grafana/provisioning/datasources/prometheus.yml`
- [x] `grafana/provisioning/dashboards/dashboards.yml` + `grafana/dashboards/auth.json`
- [x] compose grafana 볼륨 마운트 + `compose config` 검증
- [x] Commit: `feat(spec-11-04): add grafana datasource and auth dashboard provisioning`

---

## Task 2: prometheus brute force alert rule

### 2-1. rule + 연결
- [x] `prometheus-rules.yml` — brute force(login_failure rate) alert
- [x] `prometheus.yml` `rule_files` 연결 + compose prometheus rules 마운트
- [x] `compose config` 검증
- [x] Commit: `feat(spec-11-04): add prometheus brute force alert rule`

---

## Task 3: 통합 스모크

### 3-1. obs 스모크
- [x] `tooling/docker/observability/smoke-obs.sh` — prometheus+grafana 기동 → grafana datasource API + prometheus rules API 확인 → 정리
- [x] `bash ...smoke-obs.sh` → PASS
- [x] Commit: `feat(spec-11-04): add observability provisioning smoke test`

---

## Task 4: Ship
- [x] compose config + 통합 스모크 PASS
- [x] walkthrough / pr_description
- [x] Ship Commit: `docs(spec-11-04): ship walkthrough and pr description`
- [x] Push + PR (base `phase-11-observability`)
- [x] 사용자 알림

---

## 진행 요약
| 항목 | 값 |
|---|---|
| 총 Task | 4 (작업 3 + Ship) |
| 예상 commit | feat 3 + ship 1 |
| 현재 단계 | Planning |
