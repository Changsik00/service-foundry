/**
 * Shared dependency-cruiser preset.
 *
 * Authored as CJS because dependency-cruiser loads its config via require()
 * even from ESM workspaces (as of v17). Rules below enforce the layer
 * boundaries defined in ARCHITECTURE.md §3.
 */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Circular dependencies between modules are not allowed.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Orphan source files are usually dead code.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(?:js|cjs|mjs|ts|cts|mts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "(^|/)(?:babel|webpack|vitest|tsup)\\.config\\.(?:js|cjs|mjs|ts)$",
        ],
      },
      to: {},
    },
    {
      name: "packages-no-app-imports",
      severity: "error",
      comment: "packages/* must never depend on apps/*.",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "shared-no-backend-imports",
      severity: "error",
      comment: "packages/shared/* must not depend on Node-only backend packages.",
      from: { path: "^packages/shared/" },
      to: { path: "^packages/backend/" },
    },
    {
      name: "frontend-no-backend-imports",
      severity: "error",
      comment: "packages/frontend/* must not import packages/backend/*.",
      from: { path: "^packages/frontend/" },
      to: { path: "^packages/backend/" },
    },
    {
      name: "config-pure",
      severity: "error",
      comment: "packages/config/* must not depend on internal packages.",
      from: { path: "^packages/config/" },
      to: { path: "^packages/(?!config/)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    // tsConfig intentionally omitted from base: per ADR-004 we have no root tsconfig.
    // Each package's depcruise invocation should pass --ts-config tsconfig.json
    // (or use a wrapper that runs depcruise per workspace).
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types"],
    },
    reporterOptions: {
      dot: { collapsePattern: "node_modules/(@[^/]+/[^/]+|[^/]+)" },
    },
  },
};
