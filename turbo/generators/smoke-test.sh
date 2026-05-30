#!/usr/bin/env bash
#
# smoke-test.sh — package 생성기 통합 스모크 테스트
#
# 절차: turbo gen 으로 임시 패키지 생성 → pnpm install → lint/typecheck/test
#       → 생성물 삭제 + lockfile 복구.
# 종료 코드: 모두 통과 시 0, 실패 시 1.
#
# 사용법:  bash turbo/generators/smoke-test.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CATEGORY="${SMOKE_CATEGORY:-shared}"
NAME="${SMOKE_NAME:-smoketmp}"
DIR="${ROOT}/packages/${CATEGORY}/${NAME}"
PKG="@repo/${NAME}"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }

cleanup() {
  rm -rf "${DIR}"
  (cd "${ROOT}" && pnpm install >/dev/null 2>&1) || true
}
trap cleanup EXIT

cd "${ROOT}"

# 0) 사전 정리 (이전 잔재 방지)
rm -rf "${DIR}"

# 1) 생성
if ! pnpm exec turbo gen package --args "${CATEGORY}" "${NAME}" >/dev/null 2>&1; then
  fail "turbo gen 실패"
  exit 1
fi
[ -f "${DIR}/package.json" ] || { fail "생성물 없음: ${DIR}"; exit 1; }
ok "생성: ${PKG} (${CATEGORY})"

# 2) install (워크스페이스 편입)
if ! pnpm install >/dev/null 2>&1; then
  fail "pnpm install 실패"
  exit 1
fi
ok "pnpm install"

# 3) lint / typecheck / test
for task in lint typecheck test; do
  if pnpm --filter "${PKG}" "${task}" >/dev/null 2>&1; then
    ok "${task}"
  else
    fail "${task} 실패 — 상세:"
    pnpm --filter "${PKG}" "${task}" 2>&1 | tail -20 >&2
    exit 1
  fi
done

ok "스모크 테스트 통과 — 생성 패키지 ${PKG} lint/typecheck/test 0 error"
