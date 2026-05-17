# ADR-003: Package Layout & Naming Conventions

* Status: Accepted
* Date: 2026-05-17
* Scope: Folder structure, npm scope, package and tool-config naming

---

# Context

The monorepo will house dozens of packages spanning config / shared / backend / frontend / testing layers. A flat layout becomes unmanageable past ~10 packages. Multiple npm scopes (`@backend/*`, `@frontend/*`) break Turborepo conventions and complicate publishing.

Goals:

* Easy file-system navigation
* Single, predictable import scope
* Refactor-friendly — moving a package between categories should not break imports
* Compatible with Turborepo's workspace expectations
* Enforceable dependency boundaries (frontend → backend forbidden, etc.)

---

# Decision

```txt
npm scope:           @repo/*  (single)
Folder layout:       packages/<category>/<pkg>
Categories:          config, shared, backend, frontend, testing
Workspace glob:      ["apps/*", "packages/*/*"]
Tool config naming:  *-config suffix
Import path:         @repo/<pkg>   (flat — category never appears in scope)
```

---

# Detailed Decisions

## 1. npm scope — single `@repo/*`

### Decision

All internal packages use `@repo/<pkg-name>`. No `@backend/`, `@frontend/`, `@shared/`.

### Why

* Turborepo official examples use `@repo/*`
* npm scopes are organization identifiers, not categorization
* Uniform `pnpm` filters, generator templates, codemods
* Easy global rename later if we need a real org scope

## 2. Folder layout — category grouping

### Decision

```
packages/
  config/    # tool configs (biome-config, typescript-config, ...)
  shared/    # FE+BE-safe (contracts, errors, validation, utils)
  backend/   # Node-only (settings, logger, http-client, auth, ...)
  frontend/  # browser-only (ui, sdk, auth)
  testing/   # test helpers, fixtures
```

Each `packages/<category>/<pkg>/` is a real workspace package with its own `package.json`. **Category folders themselves must NOT contain a `package.json`** (Turborepo workspace resolution requirement; confirmed in `docs/turborepo-rules.md`).

### Why

* File explorer instantly shows category
* Refactor: move a folder, keep the import (`@repo/<pkg>`) — no rename across consumers
* dependency-cruiser can target rules at category level (`frontend/** cannot import backend/**`)

## 3. Workspace glob — `packages/*/*`

### Decision

```yaml
packages:
  - "apps/*"
  - "packages/*/*"
```

### Why

* Matches the category structure
* Turborepo confirmed it works as long as category dirs have no `package.json`

## 4. Tool config naming — `*-config` suffix

### Decision

All packages that provide tooling configuration use the `*-config` suffix:

```
@repo/biome-config
@repo/typescript-config
@repo/vitest-config
@repo/tsup-config
@repo/knip-config
@repo/depcruise-config
```

NOT `@repo/config-biome` (prefix).

### Why

* Turborepo official examples (`@repo/eslint-config`, `@repo/typescript-config`) use suffix
* npm ecosystem convention (`eslint-config-airbnb`, etc.)
* Sorts/groups well alphabetically in IDEs

## 5. Import path stays flat

### Decision

Category lives only in the folder path. Imports are always `@repo/<pkg>`. Never `@repo/backend/<pkg>`.

### Why

* Category changes don't break import sites
* Shorter imports
* Compatible with Turborepo / pnpm / TS resolution defaults

## 6. Category placement rules

* Clear backend (Node-only APIs)? → `backend/`
* Clear browser (DOM/React)? → `frontend/`
* Both? → `shared/` — must be browser-safe by default
* Tool config → `config/`
* Test utility / fixture / harness → `testing/`
* When ambiguous → prefer `shared/`, split later if forced

Pre-splitting is allowed only when a server/client divergence is certain from day 1.

### Locked exception

`auth` is split into 3 packages from day 1: `shared/auth-contracts` + `backend/auth` + `frontend/auth`. Server/client divergence is essentially certain.

`logger` stays as a single `backend/logger` until frontend logging becomes a real requirement (lazy split).

---

# Consequences

## Positive

* Navigable, immediately greppable structure
* Imports survive refactors
* Single scope keeps Turborepo / npm / generators simple
* Enforceable boundary rules

## Negative

* One extra folder level (slightly longer paths in IDE)
* Newcomers need this doc to know where to place a new package
* `packages/*/*` is technically nested — a handful of older tools may not handle it (none in our locked stack)

---

# Alternatives Considered

| Alternative | Rejected because |
|---|---|
| Multiple npm scopes (`@backend/x`, `@frontend/x`) | Breaks Turborepo conventions, complicates publishing, refactor-hostile |
| Flat `packages/*` | Becomes a wall of packages once we exceed ~10 |
| `config-*` prefix | aiagent-monorepo style; non-standard vs Turborepo; fights ESLint's historical `*-config` discovery convention |
| Encode category in package name (`@repo/be-logger`) | Verbose imports, doesn't help file-explorer, refactor-hostile |

---

# Future Re-evaluation Criteria

* >5 distinct categories — reconsider the schema
* A tool we adopt cannot handle `packages/*/*` glob — reconsider
* Public npm publishing — scope rename

---

# Related

* [ADR-002](./0002-monorepo-foundations.md) — Foundations
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — TS & compilation
