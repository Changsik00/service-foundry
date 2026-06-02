# feat(spec-11-04): Grafana 대시보드 + brute force alert

## 📋 Summary

### 배경 및 목적
11-03 으로 `auth_login_*` 메트릭이 prometheus 에 수집되지만 볼 대시보드·경보가 없었다. 본 spec 은 grafana provisioning(datasource + auth 대시보드) + prometheus brute force alert rule 을 추가해 phase-11 관측 코어(trace→metric→**dashboard/alert**)를 닫는다.

### 주요 변경
- [x] grafana **datasource provisioning**(prometheus 자동 등록) + **dashboard provisioning**(Auth Overview: login attempts/success/failure rate)
- [x] prometheus **AuthBruteForce alert rule** (`rate(auth_login_failure_total[1m]) > 0.2`, for 1m) + `rule_files` 연결
- [x] compose grafana/prometheus 볼륨 마운트
- [x] 통합 스모크: 기동 → grafana datasource API + prometheus rules API 확인

### Phase 컨텍스트
- **Phase**: `phase-11` — 관측 코어 3/3 (마지막). 머지 시 4 spec 완료 → phase-11 ship 가능.
- **역할**: 성공 기준 4(grafana dashboard)·5(alert) 충족, 시나리오 2 기반.

## 🎯 Key Review Points
1. **provisioning 코드화**: 수동 grafana 설정 없이 datasource/dashboard 파일로 재현.
2. **datasource uid 고정**("Prometheus") — 대시보드 JSON 과 일치시켜 패널 깨짐 방지.
3. **alert 범위**: brute force(데이터 있는 것)만. refresh-reuse/geo 는 메트릭 미구현 → 후속.
4. **alertmanager 없음**: prometheus rule 평가/firing 까지. 통지 라우팅은 후속.

## 🧪 Verification
```bash
docker compose -f tooling/docker/compose.yaml config --quiet
bash tooling/docker/observability/smoke-obs.sh
```
✅ grafana datasource provisioned + prometheus AuthBruteForce rule loaded.

## 📦 Files Changed
### 🆕 New
- `grafana/provisioning/datasources/prometheus.yml`, `provisioning/dashboards/dashboards.yml`, `dashboards/auth.json`
- `prometheus-rules.yml`, `smoke-obs.sh`
### 🛠 Modified
- `prometheus.yml` (rule_files), `compose.yaml` (grafana/prometheus 볼륨)

**Total**: 7 files (+146)

## ✅ Definition of Done
- [x] grafana datasource + 대시보드 provisioning
- [x] prometheus brute force rule + 연결
- [x] 통합 스모크 PASS
- [x] walkthrough / pr_description ship

## 🔗 관련
- Phase: `backlog/phase-11.md` — 본 머지 후 phase-11 ship 후보
- 후속: refresh-reuse alert(메트릭 추가), alertmanager 통지
