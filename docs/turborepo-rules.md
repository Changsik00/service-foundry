# Turborepo Rules for service-foundry

Distilled from the official Turborepo docs (v2). Citations are inline; every rule has a `[docs]` link to its source page. Where a section is unaddressed by docs, it is marked `N/A` rather than padded.

---

## 1. Workspace structure

### 1.1 Required top-level layout ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))

Every monorepo MUST have:

1. Root `package.json` with `"private": true`
2. Package manager lockfile (`pnpm-lock.yaml`)
3. Root `turbo.json`
4. A `package.json` in every package directory
5. Workspace declaration in `pnpm-workspace.yaml`

### 1.2 apps/ vs packages/

Docs split into two folders:

- `apps/` — runnable applications/services (Next.js, Vite, Fastify, BullMQ worker)
- `packages/` — libraries and tooling

Rule of thumb (paraphrased): "Never include shared code in Application Packages; use separate Internal Packages instead." Apps should be leaves in the dependency graph.

### 1.3 Naming and scope

- Use a namespace prefix: *"It's best practice to use a namespace prefix for your Internal Packages to avoid conflicts with other packages on the npm registry."* ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))
- We use `@repo/*` as agreed.
- The `name` field is the import identifier — `@repo/math` is what consumers import.

### 1.4 Nested workspace globs — supported, with rules

Docs are explicit: *"Turborepo does not support nested packages like `apps/**` or `packages/**` due to ambiguous behavior among package managers."* ([docs](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository))

BUT you may use multiple distinct globs like `packages/*` and `packages/group/*` provided:

- No `package.json` exists at the intermediate "category" directory (e.g. `packages/backend/package.json` MUST NOT exist).
- No package nests inside another package (no `packages/foo/bar` where both `foo` and `bar` have `package.json`).

Our planned `pnpm-workspace.yaml` is fine:

```yaml
packages:
  - apps/*
  - packages/*/*
```

Important consequence: `packages/config`, `packages/shared`, `packages/backend`, `packages/frontend`, `packages/testing` are NOT packages — they are just directories. Do not place a `package.json` in them.

### 1.5 Required root `package.json` fields

```json
{
  "name": "service-foundry",
  "private": true,
  "packageManager": "pnpm@11.1.2",
  "engines": { "node": ">=22" }
}
```

- `packageManager` is mandatory since turbo 2.0 ([docs](https://turborepo.dev/docs/crafting-your-repository/upgrading)).
- `engines.node` is now part of the global hash ([docs](https://turborepo.dev/docs/crafting-your-repository/upgrading)): *"The `engines` field in root `package.json` now factors into cache hashing."*

---

## 2. Internal package conventions

### 2.1 Required `package.json` fields ([docs](https://turborepo.dev/docs/crafting-your-repository/creating-an-internal-package))

```json
{
  "name": "@repo/logger",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "check-types": "tsc --noEmit",
    "lint": "biome check .",
    "test": "vitest run"
  }
}
```

Key points from docs:

- `name` is the import identifier; it must be unique inside the workspace.
- `type: "module"` for ESM (matches our NodeNext decision).
- Prefer `exports` over `main`. *"Exports field defines multiple entry points using sub-paths and conditions."*
- `private: true` keeps it out of npm by default; flip per-package when publishing.

### 2.2 `exports` field patterns

Sub-path with TypeScript condition (recommended in docs):

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./errors": {
      "types": "./dist/errors.d.ts",
      "default": "./dist/errors.js"
    },
    "./package.json": "./package.json"
  }
}
```

Consumers import as `import { ... } from "@repo/logger/errors"`.

### 2.3 Compiled vs Just-in-Time packages

Docs distinguish two strategies ([docs](https://turborepo.dev/docs/guides/tools/typescript)):

| Mode | When to use | TS settings |
| --- | --- | --- |
| **Just-in-Time** | Internal-only, never published; consumed by bundled apps (Next.js, Vite) | Point `exports` directly at `./src/index.ts` under `"types"` AND `"default"`; no build step |
| **Compiled** | Published libs OR consumed by Node runtimes (Fastify api, worker) | `exports` points at `./dist`; build with `tsc` or `tsup`; set `declaration: true`, `declarationMap: true` |

For our stack:

- `shared/*`, `frontend/ui`, `frontend/sdk` → Just-in-Time is fine (Next/Vite bundles them).
- `backend/*` (consumed by `apps/api`, `apps/worker` which run with `node`) → **Compiled** (tsup) is required, because Node will not load `.ts`.
- `config/*` packages are just-JSON or `.js`/`.ts` configs consumed by tools; no build needed.

### 2.4 tsconfig: project references vs path mapping

Docs explicitly discourage TS Project References ([docs](https://turborepo.dev/docs/guides/tools/typescript)): *"They introduce both another point of configuration as well as another caching layer to your workspace."*

Docs also discourage TS `paths`: *"We recommend Node.js subpath imports instead via package.json `imports` field. This approach is more robust."*

Rules:

- No root `tsconfig.json`. *"Monorepos should avoid root-level `tsconfig.json` files. Each package maintains its own configuration."*
- Each package extends `@repo/typescript-config/base.json`.
- Cross-package references happen via `@repo/<pkg>` resolution by pnpm; the bundler / `tsc` resolves through the `exports` map. No `paths`.

### 2.5 Build tooling (tsc vs tsup vs unbuilt)

Docs say of `tsc`: *"Using `tsc` directly for compilation rather than bundlers, which adds extra complexity to your build process."* ([docs](https://turborepo.dev/docs/guides/tools/typescript))

But the publishing guide promotes `tsup` for libraries ([docs](https://turborepo.dev/docs/guides/publishing-libraries)):

```json
"build": "tsup src/index.ts --format cjs,esm --dts"
```

Our resolution:

- `packages/config/*` — no build (just JSON / TS configs read by tools).
- `packages/shared/*`, `packages/frontend/{ui,sdk,auth}` — Just-in-Time, no build (consumed by bundled apps).
- `packages/backend/*` — `tsup` (ESM only, `--dts`, watch in dev). Output to `dist/`.
- Apps — use their framework's build (Next/Vite/Fastify-as-Node).

---

## 3. turbo.json patterns

### 3.1 Field reference summary ([docs](https://turborepo.dev/docs/reference/configuration))

| Field | Meaning | Default |
| --- | --- | --- |
| `tasks.<task>.dependsOn` | Tasks that must finish first | `[]` |
| `tasks.<task>.outputs` | Files cached on success | `[]` (nothing cached) |
| `tasks.<task>.inputs` | Files in task hash | all git-tracked |
| `tasks.<task>.env` | Env vars affecting hash (wildcards `FOO*`, negation `!X`) | `[]` |
| `tasks.<task>.passThroughEnv` | Env vars exposed to task (no hash impact) | `[]` |
| `tasks.<task>.cache` | Whether to cache outputs | `true` |
| `tasks.<task>.persistent` | Long-running task; nothing may `dependsOn` it | `false` |
| `tasks.<task>.interruptible` | Restartable by `turbo watch` | `false` |
| `tasks.<task>.outputLogs` | `full` \| `hash-only` \| `new-only` \| `errors-only` \| `none` | `full` |
| `tasks.<task>.with` | Sibling tasks to run alongside | `[]` |
| `globalDependencies` | Files in every task's hash | `[]` |
| `globalEnv` | Env vars in every task's hash | `[]` |
| `globalPassThroughEnv` | Env vars exposed to every task | `[]` |
| `ui` | `tui` \| `stream` | `stream` |
| `concurrency` | Integer or `"50%"` | `"10"` |
| `cacheDir` | Local cache directory | `.turbo/cache` |
| `envMode` | `strict` \| `loose` | `strict` (since 2.0) |

### 3.2 dependsOn syntax ([docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks))

- `"^build"` — run `build` in every direct dependency first. The `^` *"tells Turborepo to run the task in direct dependencies before the target package."*
- `"build"` — run `build` in the same package first.
- `"@repo/contracts#build"` — run a specific task in a specific package.
- `[]` — no dependencies.

### 3.3 `$TURBO_DEFAULT$` microsyntax

Refines git-default inputs without losing them:

```json
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "!README.md", "!**/*.test.ts"]
    }
  }
}
```

Use this in preference to writing an explicit input list — you keep git-awareness.

### 3.4 `persistent` + `cache: false` for dev ([docs](https://turborepo.dev/docs/crafting-your-repository/developing-applications))

Every dev task MUST set both:

```json
"dev": { "cache": false, "persistent": true }
```

### 3.5 Concrete root `turbo.json` for this stack

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalDependencies": [
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    "tsconfig.base.json",
    ".env",
    ".env.*"
  ],
  "globalEnv": ["NODE_ENV", "CI"],
  "globalPassThroughEnv": ["PATH", "HOME", "SHELL", "TERM"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "!**/*.test.ts",
        "!**/*.spec.ts",
        "!**/__tests__/**"
      ],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "build/**"],
      "outputLogs": "new-only"
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "interruptible": true
    },
    "check-types": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"],
      "outputs": []
    },
    "lint": {
      "inputs": [
        "$TURBO_DEFAULT$",
        "$TURBO_ROOT$/biome.jsonc"
      ],
      "outputs": []
    },
    "lint:fix": {
      "cache": false,
      "inputs": ["$TURBO_DEFAULT$"]
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "vitest.config.*",
        "$TURBO_ROOT$/packages/config/vitest-config/**"
      ],
      "outputs": ["coverage/**"],
      "env": ["VITEST_*"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true,
      "interruptible": true
    },
    "knip": {
      "inputs": ["$TURBO_DEFAULT$", "knip.json", "knip.config.*"],
      "outputs": []
    },
    "depcruise": {
      "inputs": ["$TURBO_DEFAULT$", ".dependency-cruiser.cjs"],
      "outputs": []
    },
    "//#format-and-lint": {},
    "//#format-and-lint:fix": { "cache": false }
  }
}
```

Notes:

- `lint`, `check-types`, `knip`, `depcruise` declare `outputs: []` because they only produce a pass/fail; we still want the *log* cached, which turbo does regardless of `outputs`.
- Biome lives as a **root task** (`//#format-and-lint`) per the official Biome guide — see §6.1.
- `$TURBO_ROOT$` makes a glob relative to the workspace root, so packages picking up the shared biome / vitest config still invalidate when those files change ([docs](https://turborepo.dev/docs/reference/configuration)).

---

## 4. Task graph & caching

### 4.1 What goes into the cache key ([docs](https://turborepo.dev/docs/crafting-your-repository/caching))

Two hashes:

1. **Global hash** — root `turbo.json`, lockfile at root, `globalDependencies` files, `globalEnv` values, behavior-changing CLI flags (`--cache-dir`, `--framework-inference`, `--env-mode`), passthrough args.
2. **Task hash** — package's `turbo.json`, package lockfile changes, package `package.json`, files matching `inputs`.

Either changes ⇒ cache miss.

### 4.2 inputs vs globalDependencies — placement rules

- Put a file in `inputs` if it affects a single task in a single package.
- Put a file in `globalDependencies` only if it genuinely affects *every* task in *every* package (e.g. lockfile, root tsconfig base, biome config).
- Keep `globalDependencies` minimal — *"If any file matching these globs changes, all tasks will miss cache."* ([docs](https://turborepo.dev/docs/reference/configuration))

### 4.3 Determinism is assumed

Docs warning ([docs](https://turborepo.dev/docs/crafting-your-repository/caching)): *"Turborepo assumes that your tasks are deterministic. Different outputs from identical inputs break caching reliability."*

Implication: do not bake timestamps, randomized IDs, or `Date.now()` into build outputs.

### 4.4 Selective execution / `--filter` ([docs](https://turborepo.dev/docs/reference/run))

For our category layout (`packages/<category>/<pkg>`), useful filters:

| Goal | Command |
| --- | --- |
| One package | `turbo build --filter=@repo/logger` |
| All backend packages | `turbo build --filter="./packages/backend/*"` |
| All apps | `turbo build --filter="./apps/*"` |
| `web-next` + its deps | `turbo build --filter=web-next...` |
| `@repo/contracts` + its dependents | `turbo build --filter=...@repo/contracts` |
| Changed since main | `turbo build --filter="[main...HEAD]"` |
| Changed in last commit | `turbo build --filter="[HEAD^1]"` |
| Apps changed in PR | `turbo build --filter="./apps/*" --filter="[origin/main...HEAD]"` |
| Exclude admin | `turbo build --filter="./apps/*" --filter="!./apps/admin"` |

Multiple `--filter` flags are OR-unioned. Negation uses `!`.

### 4.5 Automatic scoping

*"When you're in a package's directory, `turbo` will automatically scope commands to the Package Graph for that package."* ([docs](https://turborepo.dev/docs/crafting-your-repository/running-tasks)) — `cd apps/api && turbo dev` does what you mean.

### 4.6 Remote cache (deferred)

Local cache lives at `.turbo/cache`. When we enable remote later we will need:

- `TURBO_TOKEN` (secret) and `TURBO_TEAM` (variable) ([docs](https://turborepo.dev/docs/guides/ci-vendors/github-actions))
- `remoteCache.signature: true` + `TURBO_REMOTE_CACHE_SIGNATURE_KEY` if we want artifact signing
- Consider `remoteCache.timeout` / `uploadTimeout` overrides for slow networks
- Future flag `longerSignatureKey` (enforces ≥32-byte keys) ([docs](https://turborepo.dev/docs/reference/configuration))

No remote-cache work needed at scaffold time, but keep `globalDependencies` and `inputs` honest so a future enable-day Just Works.

---

## 5. Framework integration

### 5.1 Next.js (`apps/web-next`, `apps/admin`) ([docs](https://turborepo.dev/docs/guides/frameworks/nextjs))

```jsonc
// apps/web-next/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"],
      "env": ["NEXT_PUBLIC_*"]
    }
  }
}
```

- `!.next/cache/**` is mandatory — Next's internal cache is not part of the build output and bloats the artifact.
- Use `env: ["NEXT_PUBLIC_*"]` wildcard so all public env vars factor into the hash.
- For Docker: enable `output: "standalone"` in `next.config.ts` to play nicely with `turbo prune` (§8.2).

### 5.2 Vite (`apps/web-vite`) ([docs](https://turborepo.dev/docs/guides/frameworks/vite))

```jsonc
// apps/web-vite/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

- Vite's default `outDir` is `dist`. Match.
- For dev no special task is needed; the root `dev` (cache:false, persistent:true) suffices.

### 5.3 Fastify / Node apps (`apps/api`, `apps/worker`)

Docs do not have a dedicated Fastify/Node guide. Apply the general Node app pattern:

- `build` runs `tsup` (or `tsc`) → `dist/`
- `start` runs `node dist/index.js`
- `dev` runs `tsx watch src/index.ts` (or `tsup --watch` + `node --watch`)

```jsonc
// apps/api/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    }
  }
}
```

### 5.4 tsup for libraries

From the publishing guide ([docs](https://turborepo.dev/docs/guides/publishing-libraries)):

- `dist/**` must be in the task's `outputs`
- `dist/` is gitignored
- Dev mode: `tsup --watch` (Turbo will not duplicate the watcher)

For our ESM-only backend packages:

```jsonc
// packages/backend/logger/package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --sourcemap",
    "dev":   "tsup src/index.ts --format esm --dts --watch"
  }
}
```

---

## 6. Stack adaptation notes

### 6.1 Biome ([docs](https://turborepo.dev/docs/guides/tools/biome))

Docs explicitly recommend running Biome as a **root task** because it is fast enough that splitting buys little:

```jsonc
// turbo.json (already shown above)
"//#format-and-lint": {},
"//#format-and-lint:fix": { "cache": false }
```

```jsonc
// root package.json
{
  "scripts": {
    "format-and-lint":     "biome check .",
    "format-and-lint:fix": "biome check . --write"
  }
}
```

Caveat from docs: *"Root-level Biome configuration causes cache misses when upgrading Biome or modifying its config."* If we later want better cache hit ratios, split into per-package `lint` task and put `biome.jsonc` in `globalDependencies`.

For our setup we still include a per-package `lint` task in §3.5 so individual packages can be linted via `--filter`. Biome at root is the orchestration entry; per-package is the granular one. Pick one in practice — recommended: start with **root only**, add per-package later if needed.

### 6.2 Vitest ([docs](https://turborepo.dev/docs/guides/tools/vitest))

Docs document three approaches. Our pick: **Approach 1 — per-package cached `test`** with a shared config package:

```jsonc
// turbo.json (already shown)
"test":       { "dependsOn": ["^build"], "outputs": ["coverage/**"], "env": ["VITEST_*"] },
"test:watch": { "cache": false, "persistent": true, "interruptible": true }
```

```jsonc
// package script
"test":       "vitest run",
"test:watch": "vitest --watch"
```

- Shared config: `@repo/vitest-config` exposes `vitest.base.ts`; each package's `vitest.config.ts` imports it.
- Caveat: coverage report merging is manual if you want a unified report — use `nyc merge` if/when needed.
- Do NOT use Vitest's `projects` feature at the root: docs warn *"Any change in any package will result in a cache miss"* since the root test task is hashed against everything.

### 6.3 Knip

No official Turborepo guide. Apply general dead-code task pattern:

- Place per-package `knip` script: `"knip": "knip"`.
- Each package has its own `knip.json` (or extends `@repo/knip-config`).
- Task config from §3.5 hashes `knip.json` + `knip.config.*`.
- `outputs: []` (knip just emits a report to stdout / exits non-zero).

### 6.4 dependency-cruiser

No official Turborepo guide. Pattern:

- Single root `.dependency-cruiser.cjs` shared across packages from `@repo/depcruise-config`.
- Root script: `"depcruise": "depcruise apps packages --config .dependency-cruiser.cjs"`.
- Register as a root task in `turbo.json`: `"//#depcruise": {}`.
- Add `.dependency-cruiser.cjs` to the root task's inputs (or rely on `$TURBO_DEFAULT$`).
- Alternative for boundaries-as-tags: turbo also has its own experimental `boundaries` feature ([docs](https://turborepo.dev/docs/reference/boundaries)), but we have already decided on dependency-cruiser per ADR.

### 6.5 tsup

See §5.4. Caveats:

- Add `dist/**` to `build.outputs`. Without `outputs`, *"Hitting cache on subsequent runs will not restore any file outputs."* ([docs](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks))
- Add `dist/` to root `.gitignore`.
- For watch mode, use tsup's native `--watch` and pair the task with `persistent: true, cache: false`.

### 6.6 lefthook

No official guide. Lefthook is invoked by git hooks, not by turbo. Recommended pattern:

- Hooks call `turbo run lint check-types --filter="[HEAD]"` on pre-commit (only-changed scoping).
- Pre-push: `turbo run test --filter="[origin/main...HEAD]"`.
- Lefthook itself is configured via `lefthook.yml` at the root; not in turbo's hash unless added to `globalDependencies`.

### 6.7 changesets ([docs](https://turborepo.dev/docs/guides/publishing-libraries))

- Install at the root: `@changesets/cli`.
- Recommended publish flow: `"publish-packages": "turbo run build lint test && changeset version && changeset publish"`.
- Set `"commit": true` in `.changeset/config.json` for auto-commit of version bumps.
- Add `.changeset/**` to `globalDependencies`? **No** — that would invalidate all task caches every changeset. Leave it out.

### 6.8 pnpm catalogs

Docs mention catalogs (pnpm 9.5+) as a recommended version-sync mechanism, but document **no special Turborepo handling**.

Implications we can infer:

- Catalog versions live in `pnpm-workspace.yaml`. That file is already in `globalDependencies` in our config (§3.5), so catalog changes invalidate everything — correct behavior.
- `pnpm-lock.yaml` is already hashed at the global level; catalog version bumps surface through the lockfile too.
- No per-package config needed for turbo to "see" catalogs.

---

## 7. Generators (`turbo gen`) ([docs](https://turborepo.dev/docs/guides/generating-code))

### 7.1 Mechanics

- Built on Plop; no Plop dep needed in our repo.
- Install `@turbo/gen` as a root devDependency (for TypeScript types).
- Discovery: turbo auto-loads:
  - `./turbo/generators/config.ts` at the monorepo root
  - `./<workspace>/turbo/generators/config.ts` per package
- Generators run from their workspace root.
- ESM dependencies inside custom generators are not supported (CJS only).
- Built-in `turbo gen workspace` and `turbo gen workspace --copy` exist for ad-hoc new packages.

### 7.2 Generators we want

| Generator | Purpose | Template location |
| --- | --- | --- |
| `new-package` | Scaffold `packages/<category>/<name>` with `package.json` (name, exports, scripts), `tsconfig.json`, `src/index.ts`, optional `turbo.json` | `turbo/generators/templates/package/**` |
| `new-app`     | Scaffold `apps/<name>` (parameterized framework: next \| vite \| fastify \| worker) | `turbo/generators/templates/app/<framework>/**` |
| `new-backend-package` | Same as `new-package` but pre-wires tsup, dist outputs, ESM | `turbo/generators/templates/backend-package/**` |

Generator config skeleton:

```ts
// turbo/generators/config.ts
import type { PlopTypes } from "@turbo/gen";

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("new-package", {
    description: "Create a new internal package under packages/<category>",
    prompts: [
      { type: "list", name: "category", message: "Category", choices: ["config", "shared", "backend", "frontend", "testing"] },
      { type: "input", name: "name", message: "Package name (without @repo/ prefix)" },
    ],
    actions: [
      { type: "addMany", destination: "packages/{{category}}/{{name}}", base: "templates/package", templateFiles: "templates/package/**" }
    ],
  });
}
```

---

## 8. CI integration ([docs](https://turborepo.dev/docs/guides/ci-vendors), [docs](https://turborepo.dev/docs/guides/ci-vendors/github-actions))

### 8.1 GitHub Actions skeleton

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  ci:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}     # for later remote cache
      TURBO_TEAM:  ${{ vars.TURBO_TEAM }}         # repo VARIABLE not secret, to avoid log censoring
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }                  # required for [HEAD^1] filter
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec turbo run lint check-types test build --output-logs=new-only
```

For affected-only PR builds add: `--filter="[origin/${{ github.base_ref }}...HEAD]"`.

### 8.2 Useful flags

- `--summarize` → `.turbo/runs/*.json` for debugging cache misses ([docs](https://turborepo.dev/docs/reference/run))
- `--dry=json` → preview without execution; great for "what would change?" jobs
- `--output-logs=new-only` → don't replay cached logs in CI, keeps logs short
- `--cache-dir=./.turbo/cache` → if using `actions/cache@v4` with key `${{ runner.os }}-turbo-${{ github.sha }}`
- `--concurrency=100%` if the runner has spare cores
- `turbo query affected --packages <name> --exit-code` for skipping setup entirely when nothing changed ([docs](https://turborepo.dev/docs/guides/skipping-tasks))

### 8.3 Local-only cache (no Vercel) fallback

```yaml
- uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: ${{ runner.os }}-turbo-
```

### 8.4 Docker / deploy

Use `turbo prune <app> --docker` ([docs](https://turborepo.dev/docs/reference/prune)):

- Output dir `./out`
- `./out/json` — only `package.json`s (use as Docker layer 1 for `pnpm install`)
- `./out/full` — full source for the target subgraph
- Pruned lockfile at the root

Standard multi-stage Dockerfile pattern (per docs):

1. `FROM node AS deps` — copy `./out/json` + lockfile → `pnpm install`
2. `FROM node AS builder` — copy `./out/full` + node_modules → `pnpm turbo run build --filter=<app>`
3. `FROM node AS runner` — copy build output (`apps/<app>/.next/standalone` for Next, `dist/` for Node)

---

## 9. Anti-patterns explicitly called out by docs

| Anti-pattern | Quote | Source |
| --- | --- | --- |
| Nested workspace packages | "Turborepo does not support nested packages like `apps/**` or `packages/**` due to ambiguous behavior among package managers." | [structuring](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) |
| Installing deps at the root | "Avoid installing excessive dependencies at the workspace root, as changing the workspace root whenever you add, update, or delete a dependency causes unnecessary cache misses." | [managing-dependencies](https://turborepo.dev/docs/crafting-your-repository/managing-dependencies) |
| Referencing `node_modules` paths in code | "The location of the dependency on disk can change with other dependency changes around the Workspace." | [managing-dependencies](https://turborepo.dev/docs/crafting-your-repository/managing-dependencies) |
| Root `tsconfig.json` | "Monorepos should avoid root-level `tsconfig.json` files. Each package maintains its own configuration." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| TS Project References | "They introduce both another point of configuration as well as another caching layer to your workspace." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| TS `paths` mapping | "We recommend Node.js subpath imports instead via package.json `imports` field. This approach is more robust." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| Bundlers for internal-only TS libs | "Using `tsc` directly for compilation rather than bundlers, which adds extra complexity to your build process." | [tools/typescript](https://turborepo.dev/docs/guides/tools/typescript) |
| Forgetting `outputs` on cached tasks | "Without this key defined, Turborepo will not cache any files. Hitting cache on subsequent runs will not restore any file outputs." | [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) |
| `--parallel` flag | "Ignores the task dependency graph, losing caching and ordering benefits." (deprecated) | [reference/run](https://turborepo.dev/docs/reference/run) |
| Non-deterministic tasks | "Turborepo assumes that your tasks are deterministic. Different outputs from identical inputs break caching reliability." | [caching](https://turborepo.dev/docs/crafting-your-repository/caching) |
| Vitest root `projects` config | "Any change in any package will result in a cache miss." | [tools/vitest](https://turborepo.dev/docs/guides/tools/vitest) |
| Persistent task without `cache: false` | Implicit: persistent tasks "never exit"; combining with cache is undefined behavior; docs always pair them. | [developing-applications](https://turborepo.dev/docs/crafting-your-repository/developing-applications) |
| Including `.next/cache/**` in build outputs | Docs example actively excludes it: `["outputs": [".next/**", "!.next/cache/**"]]`. | [configuring-tasks](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) |
| Putting `TURBO_TEAM` in secrets | "Use repository variables instead of secrets for `TURBO_TEAM` to keep GitHub Actions from censoring your team name in log output." | [github-actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions) |

---

## 10. Open questions

Items the docs do not resolve and which we will need a local decision for:

1. **Biome at root vs per-package** — Docs recommend root; per-package gives better cache. We default to root, but the moment we measure a real cost (e.g. CI > 30 s on Biome alone), revisit. See §6.1.
2. **`@repo/*` config packages and turbo hashing** — Docs do not describe how config-only packages (e.g. `@repo/typescript-config`) should be hashed into dependent tasks. Our approach: every package's `tsconfig.json` extends from the config package; tsconfig is in package `inputs`; the consumer depends on `@repo/typescript-config` so changes to it invalidate via `package.json` hashing. Confirm at build-time that turbo actually re-hashes when, say, `base.json` changes (likely yes, since it's a git-tracked file in a dep).
3. **Knip caching** — No official guide. Marking `outputs: []` is correct for cache-the-log, but if knip is slow we may want a `--reporter json > knip-report.json` and cache that.
4. **dependency-cruiser as a root task vs per-package** — Same trade-off as Biome. Docs don't address. We default to root; depcruise scans the graph holistically anyway.
5. **Vitest coverage merging** — Docs flag this as manual work. Defer until coverage matters; revisit `nyc merge` or `vitest run --coverage --reporter=json` aggregation.
6. **Compiled vs Just-in-Time decision per package** — Docs describe both but do not give a definitive rule. Our rule (§2.3): Node-consumed = Compiled, bundler-consumed = JIT. Encode this in the generator templates (§7.2) so it is mechanical.
7. **`engines` field in every package** — Docs say root `engines` hashes globally; silent on per-package. Safer default: pin `engines.node` only at the root.
8. **`turbo.json` per package vs single root** — Docs allow both. We start root-only; introduce package-level `turbo.json` only when an app needs framework-specific outputs (Next `.next/**`, Vite `dist/**`) — examples already shown in §5.
9. **`futureFlags.filterUsingTasks`** — Promising for finer-grained CI but still future. Track and adopt when stable.
10. **Remote cache provider** — Not chosen. Options: Vercel (zero-config, vendor lock-in), self-hosted (e.g. `ducktors/turborepo-remote-cache`), none. Decide before we'd benefit (likely once CI > 5 min consistently).
