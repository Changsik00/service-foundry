#!/usr/bin/env bash
#
# smoke-queue.sh — queue round-trip 통합 스모크 (redis).
#
# redis 기동 → producer.enqueue → consumer 핸들러 수신 확인 → 정리.
# 호스트 포트 충돌 회피용 REDIS_PORT override.
#
# 종료 코드: 수신 0, 실패 1.

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
  pnpm --filter @repo/backend-queue exec tsx roundtrip.ts 2>/dev/null)"
if [ "${out}" = "OK" ]; then
  ok "queue round-trip — consumer 가 작업 수신"
  ok "queue 스모크 통과"
else
  fail "round-trip 실패 (out=${out})"
  exit 1
fi
