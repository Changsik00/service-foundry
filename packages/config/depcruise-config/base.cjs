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
          "(^|/)(?:babel|webpack|vitest|tsup|next|postcss)\\.config\\.(?:js|cjs|mjs|ts)$",
          "^packages/config/.+\\.(?:cjs|mjs|cts|mts|js|ts)$",
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
    // === Framework adapter rules (ADR-0015, 2026-05-19) ===
    // packages/<tier>/* (backend, frontend) must stay framework-agnostic.
    // packages/<framework>/* (nestjs, react, fastify, ...) are the only place for framework deps.
    // Adapter → pure (single direction). Pure → adapter is forbidden.
    {
      name: "backend-no-nestjs-imports",
      severity: "error",
      comment:
        "packages/backend/* must remain framework-agnostic — no @nestjs/* dep. NestJS adapter goes in packages/nestjs/<name> (ADR-0015).",
      from: { path: "^packages/backend/" },
      to: { path: "^packages/nestjs/" },
    },
    {
      name: "frontend-no-react-adapter-imports",
      severity: "error",
      comment:
        "packages/frontend/* must remain framework-agnostic — no packages/react/* dep. React adapter goes in packages/react/<name> (ADR-0015).",
      from: { path: "^packages/frontend/" },
      to: { path: "^packages/react/" },
    },
    {
      name: "nestjs-no-frontend-imports",
      severity: "error",
      comment:
        "packages/nestjs/* (backend tier adapter) must not depend on packages/frontend/* or packages/react/* (browser tier).",
      from: { path: "^packages/nestjs/" },
      to: { path: "^packages/(frontend|react)/" },
    },
    {
      name: "react-no-backend-imports",
      severity: "error",
      comment:
        "packages/react/* (frontend tier adapter) must not depend on packages/backend/* or packages/nestjs/* (server tier).",
      from: { path: "^packages/react/" },
      to: { path: "^packages/(backend|nestjs)/" },
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
