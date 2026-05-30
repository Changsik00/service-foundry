#!/usr/bin/env bash
#
# app-smoke-test.sh — app 생성기 통합 스모크 테스트
#
# turbo gen 으로 임시 api 앱 생성 → pnpm install → typecheck/lint → 정리.
# (api 가 가장 복잡한 타입 — 대표로 게이트. next/vite 도 동일 패턴.)
# 종료 코드: 통과 0, 실패 1.
#
# 사용법:  bash turbo/generators/app-smoke-test.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TYPE="${SMOKE_APP_TYPE:-api}"
NAME="${SMOKE_APP_NAME:-smoketmpapp}"
PORT="${SMOKE_APP_PORT:-2039}"
DIR="${ROOT}/apps/${NAME}"
PKG="@apps/${NAME}"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }

cleanup() {
  rm -rf "${DIR}"
  (cd "${ROOT}" && pnpm install >/dev/null 2>&1) || true
}
trap cleanup EXIT

cd "${ROOT}"
rm -rf "${DIR}"

if ! pnpm exec turbo gen app --args "${TYPE}" "${NAME}" "${PORT}" >/dev/null 2>&1; then
  fail "turbo gen app 실패"
  exit 1
fi
[ -f "${DIR}/package.json" ] || { fail "생성물 없음: ${DIR}"; exit 1; }
ok "생성: ${PKG} (${TYPE}, :${PORT})"

if ! pnpm install >/dev/null 2>&1; then
  fail "pnpm install 실패"
  exit 1
fi
ok "pnpm install"

for task in lint typecheck test; do
  if pnpm --filter "${PKG}" "${task}" >/dev/null 2>&1; then
    ok "${task}"
  else
    fail "${task} 실패 — 상세:"
    pnpm --filter "${PKG}" "${task}" 2>&1 | tail -20 >&2
    exit 1
  fi
done

ok "app 스모크 테스트 통과 — ${PKG} lint/typecheck/test 0 error"
