#!/usr/bin/env bash
#
# smoke-cache.sh — redis 캐시 어댑터 set→get round-trip 통합 스모크.
# redis 기동 → createRedisCache set/get → 정리. 종료 코드: 성공 0, 실패 1.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE="${ROOT}/tooling/docker/compose.yaml"

export REDIS_PORT="${REDIS_PORT:-16379}"
export REDIS_HOST="localhost"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }
compose() { docker compose -f "${COMPOSE}" "$@"; }

cleanup() { compose stop redis >/dev/null 2>&1 || true; compose rm -f redis >/dev/null 2>&1 || true; }
trap cleanup EXIT

cd "${ROOT}"
compose up -d redis >/dev/null 2>&1 || { fail "redis 기동 실패"; exit 1; }

deadline=$(( $(date +%s) + 40 ))
until docker compose -f "${COMPOSE}" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
  [ "$(date +%s)" -ge "${deadline}" ] && { fail "redis ping 타임아웃"; exit 1; }
  sleep 2
done
ok "redis ready (:${REDIS_PORT})"

out="$(REDIS_HOST="${REDIS_HOST}" REDIS_PORT="${REDIS_PORT}" \
  pnpm --filter @repo/backend-cache exec tsx roundtrip.ts 2>/dev/null)"
if [ "${out}" = "OK" ]; then
  ok "cache round-trip — set→get 일치"
  ok "cache 스모크 통과"
else
  fail "round-trip 실패 (out=${out})"
  exit 1
fi
