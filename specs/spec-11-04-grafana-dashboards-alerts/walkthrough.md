# Walkthrough: spec-11-04

> Grafana 대시보드/datasource provisioning + prometheus brute force alert.

## 📌 결정 기록

| 이슈 | 선택지 | 결정 | 이유 |
|---|---|---|---|
| grafana 설정 | 수동 / provisioning | **provisioning(파일)** | 재현성 — datasource/dashboard 코드화 |
| alert 엔진 | grafana managed / prometheus rule | **prometheus rule** | 데이터원(prometheus) 근처, alertmanager 없이 평가 |
| alert 범위 | 4종 / brute force만 | **brute force(login_failure)만** | 유일하게 메트릭 존재(11-03). refresh-reuse/geo 는 메트릭 미구현 → 후속 |
| 통지 | alertmanager / 없음 | **rule 평가까지** | 통지 라우팅은 후속. firing 은 /api/v1/rules·/alerts 로 확인 |

### ADR 승격
- [x] 없음 (설정 — 11-03 연장)

## 💬 사용자 협의
- phase-11 관측 코어 마지막 조각. 머지 시 phase-11 ship 가능.

## 🧪 검증 결과

### 구성
- `docker compose -f tooling/docker/compose.yaml config --quiet` ✅

### 통합 (Integration Test Required = yes)
- **명령**: `bash tooling/docker/observability/smoke-obs.sh`
- **결과**: ✅
```text
✓ prometheus + grafana healthy
✓ grafana — prometheus datasource provisioned
✓ prometheus — AuthBruteForce alert rule loaded
```

### 수동
1. `pnpm infra:up` → grafana(:3000, admin/admin) → Auth Overview 대시보드 + Prometheus datasource
2. prometheus `/alerts` 에 AuthBruteForce

## 🔍 발견 사항
- grafana datasource uid 를 "Prometheus" 로 고정(대시보드 JSON 의 datasource.uid 와 일치) — provisioning 시 uid 미지정이면 자동생성되어 대시보드와 어긋날 수 있음.
- alertmanager 없이도 prometheus 가 rule 을 로드/평가 → firing 상태를 API 로 검증 가능(통지만 후속).

## 🚧 이월 항목
- refresh-reuse / impossible-travel / mass-revocation alert → 메트릭 추가(후속) 후 rule.
- alertmanager(통지 라우팅) → 후속.
- 전체 brute force 시나리오(apps/api 실패 N회 → 실제 firing) live → phase-11 ship 통합 검증/후속.

## 🔗 관련
- 관련 phase: `backlog/phase-11.md` (§성공 기준 4·5, §시나리오 2)
- 직전 spec: spec-11-03 (metrics — 카운터 데이터원)

## 📅 메타
| 항목 | 값 |
|---|---|
| 작성자 | Agent + dennis |
| 작성일 | 2026-05-30 |
| 최종 commit | ship 시 갱신 |
