#!/usr/bin/env bash
#
# smoke-trace.sh — OTEL trace export 통합 스모크 (패키지 → tempo).
#
# tempo 기동 → @repo/backend-observability 로 known span 방출 → flush
# → tempo query API 에서 traceId 재조회 → 확인 → 정리.
# full apps/api 부트 없이 export 경로만 검증.
#
# 종료 코드: trace 확인 0, 실패 1.
# 호스트 포트 충돌 회피용 override 가능 (TEMPO_PORT/TEMPO_OTLP_HTTP_PORT).

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE="${ROOT}/tooling/docker/compose.yaml"

export TEMPO_PORT="${TEMPO_PORT:-13200}"
export TEMPO_OTLP_HTTP_PORT="${TEMPO_OTLP_HTTP_PORT:-14318}"
export TEMPO_OTLP_GRPC_PORT="${TEMPO_OTLP_GRPC_PORT:-14317}"
QUERY_TIMEOUT="${QUERY_TIMEOUT:-60}"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }

compose() { docker compose -f "${COMPOSE}" "$@"; }

cleanup() { compose stop tempo >/dev/null 2>&1 || true; compose rm -f tempo >/dev/null 2>&1 || true; }
trap cleanup EXIT

cd "${ROOT}"

# 1) tempo 기동
compose up -d tempo >/dev/null 2>&1 || { fail "tempo 기동 실패"; exit 1; }
# healthy 대기
deadline=$(( $(date +%s) + 60 ))
until curl -sf "http://localhost:${TEMPO_PORT}/ready" >/dev/null 2>&1; do
  [ "$(date +%s)" -ge "${deadline}" ] && { fail "tempo /ready 타임아웃"; exit 1; }
  sleep 2
done
ok "tempo ready (:${TEMPO_PORT})"

# 2) span 방출 → traceId 획득
traceId="$(OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:${TEMPO_OTLP_HTTP_PORT}" \
  pnpm --filter @repo/backend-observability exec tsx emit-span.ts 2>/dev/null)"
if [ -z "${traceId}" ]; then fail "span 방출/traceId 획득 실패"; exit 1; fi
ok "span 방출 — traceId=${traceId}"

# 3) tempo query API 폴링 조회 (tempo 는 traceId 를 base64 로 반환 → 본문 존재로 판정)
deadline=$(( $(date +%s) + QUERY_TIMEOUT ))
found=0
while [ "$(date +%s)" -lt "${deadline}" ]; do
  resp="$(curl -sf "http://localhost:${TEMPO_PORT}/api/traces/${traceId}" 2>/dev/null)" || resp=""
  # 200 + batch 데이터 존재 (미발견은 404 또는 빈 {} )
  if [ "${#resp}" -gt 50 ] && printf '%s' "${resp}" | grep -q "batches\|resourceSpans\|smoke-span"; then
    found=1
    break
  fi
  sleep 3
done
[ "${found}" -eq 1 ] || { fail "tempo 에서 trace 미발견 (타임아웃 ${QUERY_TIMEOUT}s)"; exit 1; }
ok "tempo 에서 trace 확인 — export 경로 정상"

ok "trace export 스모크 통과"
