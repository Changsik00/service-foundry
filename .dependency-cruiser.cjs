/**
 * Root dependency-cruiser config.
 *
 * 공유 프리셋(@repo/depcruise-config/base)을 그대로 소비한다.
 * 프리셋은 ARCHITECTURE.md §3 레이어 경계 규칙(frontend↛backend,
 * config-pure, backend↛nestjs 어댑터 방향 등)을 강제한다.
 */
const base = require("@repo/depcruise-config/base");

module.exports = base;
