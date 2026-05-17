# ADR-002: Monorepo Foundations

* Status: Accepted
* Date: 2026-05-17
* Scope: Repository toolchain baseline (package manager, orchestrator, runtime, hooks, versioning)

---

# Context

Building an AI-first Node/TS monorepo (see ADR-001). Before any package or app is written, the foundation layer must be locked. These tools gate every other decision.

Constraints:

* Single repository housing apps + libraries
* Future MSA evolution path planned (separate ADR)
* CI performance is first-class
* Reproducible installs across dev/CI
* "Latest trend within stability" — modern but not bleeding edge

---

# Decision

```txt
Package manager:  pnpm 11.1.2 (catalogs enabled)
Orchestrator:     turborepo (latest 2.x)
Runtime:          Node 22 LTS
Module system:    ESM only (NodeNext)
Commit hooks:     lefthook
Versioning:       changesets
```

Pinned via root `package.json` (`packageManager`, `engines.node`) and root devDependencies.

---

# Detailed Decisions

## 1. Package manager — pnpm 11 with catalogs

### Decision

Use pnpm `^11.0.0` (pinned to 11.1.2 via `packageManager` field). Use the `catalog:` protocol in `pnpm-workspace.yaml` to centralize shared dependency versions.

```yaml
packageManager: pnpm@11.1.2
packages:
  - "apps/*"
  - "packages/*/*"
catalog:
  # runtime
  zod: ^4.4.3
  pino: ^10.3.1
  # types
  "@types/node": ^22.19.19
  # toolchain
  typescript: ^6.0.3
  tsx: ^4.22.1
  "@biomejs/biome": ^2.4.15
  vitest: ^4.1.6
  tsup: ^8.5.1
  knip: ^6.14.1
  dependency-cruiser: ^17.4.0
  turbo: ^2.9.14
  lefthook: ^2.1.6
  "@changesets/cli": ^2.31.0
```

Packages reference shared versions with `"zod": "catalog:"`. The catalog above shows current pins (as of repo bootstrap, 2026-05-17); update via Renovate/Dependabot and bump the version here in lockstep with the actual `pnpm-workspace.yaml`.

> **Convention**: code is written against the *installed* version's API. ADR examples document intent at the time of writing — when a major version bumps and an API shifts, update the code first, then refresh examples here. See ARCHITECTURE.md §0.

### Why

* Single source of truth — no syncpack required
* Identical resolution across packages → CI cache stability
* Renovate/Dependabot updates one line, not N
* pnpm 11 GA April 2026; performance gains over v10

## 2. Workspace orchestrator — Turborepo 2.x

### Decision

All cross-package tasks (`build`, `lint`, `test`, `typecheck`) flow through `turbo run`. Adopted patterns documented in `docs/turborepo-rules.md`.

### Why

* Native pnpm workspace support
* Task graph, caching, affected detection
* JSON-only config — no vendor lock-in

## 3. Runtime — Node 22 LTS

### Decision

Node 22 LTS. Pinned in root `package.json`:

```json
{ "engines": { "node": ">=22.0.0 <23" } }
```

### Why

* LTS until 2027-04
* Native ESM, native `--watch`, native `fetch`
* Turborepo 2.x hashes `engines.node` into the global cache key
* Not Node 24 — stability over latest

## 4. Module system — ESM only (NodeNext)

### Decision

Every package: `"type": "module"`. tsconfig: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`.

### Why

* Long-term direction of Node
* NodeNext matches runtime resolution semantics
* No dual CJS/ESM publishing burden for internal packages

## 5. Commit hooks — lefthook

### Decision

`lefthook` over `husky + lint-staged`.

```yaml
pre-commit:
  parallel: true
  commands:
    biome:
      glob: "*.{js,jsx,ts,tsx,json,jsonc}"
      run: pnpm exec biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}
      stage_fixed: true
    typecheck:
      run: pnpm turbo run typecheck --output-logs=errors-only
```

> Biome 2.x renamed `--apply` to `--write`. `typecheck` flows through Turborepo so it benefits from per-package cache rather than re-checking the whole tree on every commit.

### Why

* Single binary (Go), no npm dep chain
* Native parallel hook execution
* Cleaner config than two tools

## 5b. TS script runner — tsx

### Decision

`tsx` ships as a root devDependency (and a catalog entry). Any non-trivial repo script under `tooling/scripts/*` is authored in TypeScript and executed via:

```bash
pnpm tsx ./tooling/scripts/foo.ts
# or
node --import tsx ./tooling/scripts/foo.ts
```

Bash is reserved for thin lifecycle glue (lefthook hook bodies, CI orchestration). See ARCHITECTURE.md §0.

### Why

* No separate "scripts toolchain" needed — same TS strict settings as production code
* `tsx` is the smallest viable Node TS loader in the current ecosystem (ts-node has been superseded for our use cases)
* Aligns with TS-first principle in ARCHITECTURE §0

---

## 6. Versioning — changesets

### Decision

`@changesets/cli` for internal package versioning and changelog generation. PR-time intent capture via `.changeset/*.md`.

### Why

* De facto standard for pnpm/turborepo monorepos
* Independent versioning per package
* Works for private and public publishing

---

# Consequences

## Positive

* Reproducible installs
* Fast CI (turborepo + pnpm caches)
* Modern but stable foundation
* Each tool replaceable independently

## Negative

* pnpm catalogs are recent — some niche tools may lag
* lefthook is less ubiquitous than husky — small onboarding friction
* Node 22 means no Node 23/24-only APIs

---

# Alternatives Considered

| Alternative | Rejected because |
|---|---|
| npm / yarn workspaces | pnpm faster, stricter, has catalogs |
| nx | Heavier, more opinionated, vendor coupling |
| Bun runtime | Too early for production backend |
| Node 24 (current) | Not LTS until late 2026 |
| husky + lint-staged | Two tools, two configs; lefthook simpler |
| nx release / lerna | changesets is the modern focused tool |

---

# Future Re-evaluation Criteria

* Bun reaches stable production parity → reconsider runtime
* pnpm v12 substantive changes → upgrade plan
* Turborepo replaced by something materially better

---

# Related

* [ADR-001](./0001-linting-formatting-strategy.md) — Linting / formatting
* [ADR-003](./0003-package-layout-and-naming.md) — Package layout & naming
* [ADR-004](./0004-typescript-and-compilation-strategy.md) — TS & compilation
* `docs/turborepo-rules.md` — source of derived rules
