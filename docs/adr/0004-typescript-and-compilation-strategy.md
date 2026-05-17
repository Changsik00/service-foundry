# ADR-004: TypeScript & Compilation Strategy

* Status: Accepted
* Date: 2026-05-17
* Scope: TypeScript configuration, package compilation, dist output

---

# Context

Decisions about TypeScript layout (project references? root tsconfig? `paths`?) and per-package compilation (`tsc` / `tsup` / unbuilt?) ripple across every package. Turborepo official docs (digested in `docs/turborepo-rules.md`) push specific patterns. We adopt them with our stack's particulars.

Goals:

* Mechanical "how do I add a new package?" rules
* Honest fit to ESM/NodeNext runtime
* Maximize Turborepo cache effectiveness
* Avoid known footguns of `paths`, project references, dual CJS/ESM publishing

---

# Decision

```txt
TS config:    @repo/typescript-config (presets only)
              Each package extends a preset
              No root tsconfig.json
              No project references
              No `paths` mapping  (use Node subpath imports if needed)
              strict: true everywhere

ESM:          "type": "module" everywhere
              "module": "NodeNext", "moduleResolution": "NodeNext"

Compilation:
   Compiled (tsup):  apps/api, apps/worker, all packages/backend/*
   JIT (TS source):  packages/shared/*, packages/frontend/*,
                     packages/testing/*, packages/config/*
```

---

# Detailed Decisions

## 1. `@repo/typescript-config` provides presets only

### Decision

The package exports tsconfig JSON presets via the `files` and `exports` fields:

```json
{
  "name": "@repo/typescript-config",
  "files": ["base.json", "library.json", "node-app.json", "react-app.json"]
}
```

Consuming package picks a preset:

```jsonc
// packages/shared/contracts/tsconfig.json
{ "extends": "@repo/typescript-config/library.json" }
```

### Why

* Single source of truth for compiler options
* Each package retains a real local tsconfig — no magic
* Matches Turborepo official pattern

## 2. No root `tsconfig.json`

### Decision

Repository root has **no** `tsconfig.json`.

### Why

* Turborepo docs explicitly discourage it
* Prevents implicit "open project" inclusion in editors
* Removes confusion about which config governs which file

## 3. No TS project references

### Decision

No `references` field in any tsconfig.

### Why

* Duplicates the dependency graph already expressed in pnpm workspace
* Causes subtle build-order issues alongside Turborepo
* Maintenance tax when packages move
* Explicitly discouraged by Turborepo docs

## 4. No `paths` mapping

### Decision

No `"paths"` in tsconfig. Cross-package imports use the package name (`@repo/<pkg>`). Intra-package: relative paths or — if large — Node subpath imports (`#internal/*` via `package.json` `imports`).

### Why

* `paths` only affects type-check, not runtime — fragile
* Forces dev/runtime resolution consistency
* Aligns with NodeNext semantics

## 5. `strict: true` everywhere

### Decision

Every preset enables `"strict": true`, plus:

* `noUncheckedIndexedAccess: true`
* `exactOptionalPropertyTypes: true`
* `noImplicitOverride: true`
* `noFallthroughCasesInSwitch: true`
* `noImplicitReturns: true`
* `verbatimModuleSyntax: true` — paired with `isolatedModules: true` so every file states its import/export semantics literally (ESM-friendly; required for bundler-independent JIT export of `.ts` source)
* `isolatedModules: true`

### Why

* ADR-001 uses strict types as substitute for heavy lint rules
* AI-generated code benefits massively from strict checks
* These catch bugs no Biome rule could

## 6. ESM only — NodeNext resolution

### Decision

`"type": "module"` everywhere. `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### Why

* See ADR-002 §4
* NodeNext matches Node's runtime resolution most accurately

## 7. Compilation split — compiled backend, JIT frontend/shared

### Decision

| Category | Mode | Tooling |
|---|---|---|
| `packages/config/*` | JIT (`.ts` / `.json` / `.cjs`) | consumed by tools that load configs via Node — tsx-importable for `.ts`, JSON for JSON-only tools (Biome, Knip), `.cjs` only where the tool refuses ESM (dependency-cruiser as of v17) |
| `packages/shared/*` | JIT (TS source export) | — |
| `packages/frontend/*` | JIT | (bundler compiles) |
| `packages/testing/*` | JIT | — |
| `packages/backend/*` | **Compiled** | tsup → `dist/` |
| `apps/api`, `apps/worker` | Compiled at deploy | tsup or framework build |
| `apps/web-next`, `web-vite`, `admin` | Bundler-compiled | Next / Vite |

> **TS-first convention for config packages**: prefer `.ts` (loaded via tsx by the consuming tool) for anything with non-trivial logic — vitest presets, tsup presets, generator scripts. Use JSON only for tools that demand it (Biome, Knip, tsconfig itself). Use `.cjs` only as an escape hatch for tools that cannot load ESM. See ARCHITECTURE §0.

Compiled packages reference dist in `exports`:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

JIT packages export source directly:

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### Why

* Node-runtime consumers cannot import `.ts` directly without a custom loader → must consume compiled output
* Bundler-consumed packages can take TS source — bundler handles it
* This is Turborepo's official "compiled vs JIT" recommendation
* Compiled backend packages benefit from Turborepo cache on `dist/`
* JIT packages have zero build step — faster iteration

## 8. tsup config baseline

### Decision

`@repo/tsup-config` provides a single preset for backend packages, parameterised so each consumer can override:

```ts
import { defineConfig, type Options } from "tsup";

export const nodeLibPreset = (overrides: Partial<Options> = {}): Options =>
  defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "node22",
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    ...overrides,
  }) as Options;
```

### Why

* Single ESM output — no dual publishing
* `dts: true` — types ship with package
* Treeshake preserves consumer tree-shaking

---

# Consequences

## Positive

* Mechanical decision tree for new packages
* No editor confusion (no root tsconfig)
* Cache-friendly (dist hashable, JIT no build to cache)
* Strict types catch most AI errors before tests

## Negative

* Backend package authors run a build (or `tsup --watch`) — heavier than JIT
* No `tsc --build` (no project references) — rely on Turborepo task graph
* JIT TS source export breaks if a consumer is raw Node — universally fine for our consumers (Vitest, Vite, Next, tsup), would break for an external CJS Node script

## Mitigations

* `apps/api` (Node runtime) imports `packages/backend/*` (compiled) → safe
* `apps/web-*` (bundlers) imports `packages/shared/*` and `packages/frontend/*` (JIT) → safe
* Tests run via Vitest → JIT consumption fine

---

# Alternatives Considered

| Alternative | Rejected because |
|---|---|
| TS project references | Duplicates pnpm graph, build-order pitfalls, Turborepo handles graph |
| Root tsconfig with `paths` | Editor inclusion footgun; `paths` not runtime — Turborepo discourages |
| `tsc` instead of `tsup` for backend | Slower, no dts bundling, no treeshake hints |
| Compile every package | Wasteful for shared/frontend (bundler-consumed) |
| Leave every package JIT | Breaks Node-runtime consumers |
| Dual CJS/ESM output | We're new — no CJS consumers exist |

---

# Future Re-evaluation Criteria

* Publishing backend packages to npm for external CJS consumers → revisit dual-publish
* TS adds first-class "workspace" feature superseding Turborepo for graph → revisit
* A bundler we depend on drops TS source support → revisit JIT

---

# Related

* [ADR-002](./0002-monorepo-foundations.md) — Foundations
* [ADR-003](./0003-package-layout-and-naming.md) — Package layout & naming
* `docs/turborepo-rules.md` — sources for these decisions
