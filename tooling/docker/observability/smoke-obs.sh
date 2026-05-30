#!/usr/bin/env bash
#
# smoke-obs.sh — 관측 provisioning 통합 스모크 (spec-11-04).
#
# prometheus + grafana 기동 → grafana 에 prometheus datasource 자동 등록 +
# prometheus 에 brute force alert rule 로드 확인 → 정리.
# (alertmanager 없이 rule 로드까지. 호스트 포트 충돌 회피 override.)
#
# 종료 코드: 통과 0, 실패 1.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE="${ROOT}/tooling/docker/compose.yaml"

export PROMETHEUS_PORT="${PROMETHEUS_PORT:-19090}"
export GRAFANA_PORT="${GRAFANA_PORT:-13000}"
export GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin}"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }
compose() { docker compose -f "${COMPOSE}" "$@"; }

cleanup() { compose stop prometheus grafana >/dev/null 2>&1 || true; compose rm -f prometheus grafana >/dev/null 2>&1 || true; }
trap cleanup EXIT

cd "${ROOT}"
compose up -d prometheus grafana >/dev/null 2>&1 || { fail "기동 실패"; exit 1; }

# healthy 대기
deadline=$(( $(date +%s) + 90 ))
until curl -sf "http://localhost:${PROMETHEUS_PORT}/-/healthy" >/dev/null 2>&1 \
   && curl -sf "http://localhost:${GRAFANA_PORT}/api/health" >/dev/null 2>&1; do
  [ "$(date +%s)" -ge "${deadline}" ] && { fail "prometheus/grafana healthy 타임아웃"; exit 1; }
  sleep 3
done
ok "prometheus(:${PROMETHEUS_PORT}) + grafana(:${GRAFANA_PORT}) healthy"

# 1) grafana datasource provisioned 확인 (provisioning 반영까지 폴링)
deadline=$(( $(date +%s) + 40 ))
until curl -sf -u "admin:${GRAFANA_ADMIN_PASSWORD}" "http://localhost:${GRAFANA_PORT}/api/datasources" 2>/dev/null | grep -qi "prometheus"; do
  [ "$(date +%s)" -ge "${deadline}" ] && { fail "grafana 에 prometheus datasource 미등록"; exit 1; }
  sleep 3
done
ok "grafana — prometheus datasource provisioned"

# 2) prometheus brute force rule 로드 확인
deadline=$(( $(date +%s) + 30 ))
until curl -sf "http://localhost:${PROMETHEUS_PORT}/api/v1/rules" 2>/dev/null | grep -q "AuthBruteForce"; do
  [ "$(date +%s)" -ge "${deadline}" ] && { fail "prometheus 에 AuthBruteForce rule 미로드"; exit 1; }
  sleep 3
done
ok "prometheus — AuthBruteForce alert rule loaded"

ok "관측 provisioning 스모크 통과"
