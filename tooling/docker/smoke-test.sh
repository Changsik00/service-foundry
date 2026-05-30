#!/usr/bin/env bash
#
# smoke-test.sh — 로컬 인프라 compose 스택 통합 스모크 테스트
#
# 절차: compose config 검증 → up -d → 전 서비스 healthy 폴링
#       → pg_isready / redis PONG / 관측 health 검증 → down -v
#
# 종료 코드: 모든 검증 통과 시 0, 실패 시 1.
#
# 사용법:
#   bash tooling/docker/smoke-test.sh
#   HEALTH_TIMEOUT=120 bash tooling/docker/smoke-test.sh   # 폴링 타임아웃(초) override
#   KEEP_UP=1 bash tooling/docker/smoke-test.sh            # 실패 디버깅 시 down 생략

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/compose.yaml"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
KEEP_UP="${KEEP_UP:-0}"

# 기대 서비스 목록 (compose.yaml 의 service 명과 일치)
SERVICES=(postgres redis prometheus grafana tempo loki)

compose() {
  docker compose -f "${COMPOSE_FILE}" "$@"
}

log()  { printf '  %s\n' "$*"; }
ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }

cleanup() {
  if [[ "${KEEP_UP}" != "1" ]]; then
    log "정리: compose down -v"
    compose down -v --remove-orphans >/dev/null 2>&1 || true
  else
    log "KEEP_UP=1 — 스택 유지 (수동 정리: docker compose -f ${COMPOSE_FILE} down -v)"
  fi
}
trap cleanup EXIT

# 1) compose 스키마 유효성
if ! compose config --quiet; then
  fail "compose config 검증 실패 (${COMPOSE_FILE})"
  exit 1
fi
ok "compose config 유효"

# 2) 스택 기동
log "compose up -d ..."
compose up -d

# 3) 전 서비스 healthy 폴링
log "헬스 폴링 (타임아웃 ${HEALTH_TIMEOUT}s) ..."
deadline=$(( $(date +%s) + HEALTH_TIMEOUT ))
while true; do
  unhealthy=()
  for svc in "${SERVICES[@]}"; do
    cid="$(compose ps -q "${svc}" 2>/dev/null || true)"
    if [[ -z "${cid}" ]]; then
      unhealthy+=("${svc}:없음")
      continue
    fi
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${cid}" 2>/dev/null || echo unknown)"
    if [[ "${status}" != "healthy" && "${status}" != "running" ]]; then
      unhealthy+=("${svc}:${status}")
    fi
  done

  if [[ ${#unhealthy[@]} -eq 0 ]]; then
    ok "전 서비스 healthy"
    break
  fi

  if [[ $(date +%s) -ge ${deadline} ]]; then
    fail "헬스 타임아웃 — 미준비: ${unhealthy[*]}"
    compose ps
    exit 1
  fi
  sleep 3
done

# 4) 기능 검증
log "기능 검증 ..."

if compose exec -T postgres pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; then
  ok "postgres: pg_isready"
else
  fail "postgres: pg_isready 실패"
  exit 1
fi

if [[ "$(compose exec -T redis redis-cli ping 2>/dev/null | tr -d '\r')" == "PONG" ]]; then
  ok "redis: PONG"
else
  fail "redis: ping 실패"
  exit 1
fi

# 관측 스택 health 엔드포인트 (컨테이너 내부에서 wget)
check_http() {
  local svc="$1" port="$2" path="$3"
  if compose exec -T "${svc}" wget -q -O /dev/null "http://localhost:${port}${path}" 2>/dev/null; then
    ok "${svc}: http ${path}"
  else
    fail "${svc}: http ${path} 실패"
    exit 1
  fi
}

check_http prometheus 9090 /-/healthy
check_http grafana    3000 /api/health
check_http tempo      3200 /ready
check_http loki       3100 /ready

ok "스모크 테스트 통과 — 6개 서비스 정상"
