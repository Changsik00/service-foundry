#!/usr/bin/env bash
#
# smoke-test.sh — tooling 스크립트 통합 스모크 테스트
#
# manifest 검증 + config-graph mermaid 출력을 실제 실행해 확인한다.
# 종료 코드: 모두 통과 시 0, 실패 시 1.
#
# 사용법:  bash tooling/scripts/smoke-test.sh

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT}"

ok()   { printf '✓ %s\n' "$*"; }
fail() { printf '✗ %s\n' "$*" >&2; }

# 1) service manifest 검증
if pnpm tooling:manifest >/dev/null 2>&1; then
  ok "tooling:manifest — service.yaml 검증 통과"
else
  fail "tooling:manifest 실패"
  pnpm tooling:manifest 2>&1 | tail -10 >&2
  exit 1
fi

# 2) config-graph mermaid 출력
graph_out="$(pnpm tooling:config-graph 2>/dev/null)"
if printf '%s' "${graph_out}" | grep -q "flowchart"; then
  ok "tooling:config-graph — mermaid flowchart 출력"
else
  fail "tooling:config-graph — flowchart 출력 없음"
  exit 1
fi

ok "tooling 스크립트 스모크 테스트 통과"
