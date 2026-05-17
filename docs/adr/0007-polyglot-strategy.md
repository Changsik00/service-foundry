# ADR-007: Polyglot Strategy

* Status: **Accepted**
* Date: 2026-05-17
* Scope: How service-foundry handles multi-language services (TS now, Python later, possibly others)
* Owners: Platform

---

# 1. Context

The repository was renamed `node-monorepo` → **`service-foundry`** to acknowledge that future workloads (especially RAG / ML inference / scientific compute) are likely to require Python alongside Node/TS services.

Constraints:

* Current scope is Node/TS only (Phase 1–6 in ROADMAP)
* Python services are *expected but not yet specified* (6–12 month horizon)
* TS ecosystem is the strongest current choice for HTTP services, type-shared contracts, AI/agent tooling, and developer experience
* Python remains dominant for RAG, vector DB clients, model inference, and ML notebooks
* The Turborepo + pnpm + catalogs investment (ADR-001 ~ ADR-004) is Node-specific and substantial — discarding it for polyglot from day 1 has real cost

The question this ADR settles: **how do we keep "Node-first design now" without making "Python later" awkward?**

---

# 2. Decision

```txt
Now (Phase 1–6):
  Pure Node/TS monorepo with pnpm + Turborepo.
  No Python. No polyglot orchestrator.

When Python arrives:
  Isolated `python/` sibling subtree with its own workspace
  (uv or poetry), its own test runner, its own boundary tooling.
  NOT mixed into pnpm/turborepo.
  Cross-language orchestration via root `justfile` (or Makefile).

Cross-language communication:
  HTTP (or gRPC) only. No shared types.
  Python services publish OpenAPI; TS generates clients via codegen.
```

TS remains the **primary** language for server-side. Python is reserved for workloads where Python is genuinely dominant.

---

# 3. Structural rules when Python arrives

```
service-foundry/
├─ apps/                    # Node/TS apps
├─ packages/                # Node/TS packages (with category grouping per ADR-003)
├─ python/                  # NEW root for Python world (when added)
│  ├─ apps/                 # Python services (rag, ml-inference, ...)
│  ├─ packages/             # Python libs (if needed)
│  ├─ pyproject.toml        # uv/poetry workspace root
│  └─ uv.lock               # or poetry.lock
├─ tooling/
│  └─ docker/               # shared infra docker-compose
├─ justfile                 # cross-language commands (build:all, test:all, ...)
├─ turbo.json               # Node side only
├─ pnpm-workspace.yaml      # Node side only
└─ package.json
```

### Hard rules

* Python files **never** live inside `apps/*` or `packages/*` (those are pnpm workspace globs)
* `python/` subtree is invisible to pnpm and Turborepo
* Each Python service has its own Dockerfile and CI lane
* No symlinking, no monorepo-wide cache shared across languages
* `justfile` provides operator-friendly cross-language commands but does NOT try to be a build orchestrator

### Justfile sketch (when Python arrives)

```just
# Build everything
build-all:
    pnpm turbo run build
    cd python && uv build --all

# Test everything
test-all:
    pnpm turbo run test
    cd python && uv run pytest

# Lint everything
lint-all:
    pnpm turbo run lint
    cd python && uv run ruff check
```

---

# 4. Inter-language communication

| Concern | Approach |
|---|---|
| API contract | OpenAPI (Python service publishes, TS consumes via codegen — same pattern as our existing backend → frontend SDK flow) |
| Transport | HTTP first, gRPC only if perf or streaming demands it |
| Auth | TS API gateway issues JWT, Python services verify same JWT (shared secret in settings) |
| Observability | Both languages export OTel to the same collector |
| Errors | Each service speaks JSON; consumer maps via its own error layer |
| Types | **No shared types.** Treat Python services as third-party HTTP APIs from the TS perspective. |

---

# 5. What this explicitly rejects

| Rejected approach | Why |
|---|---|
| **moonrepo** as polyglot orchestrator from day 1 | Good tool, but throws away Turborepo digest + pnpm catalogs work; benefit (unified cache) doesn't materialize until 5+ Python services exist |
| **bazel** | Overkill for this scale; high authoring cost |
| **nx** | Node-centric anyway; Python support is shallow plugins |
| **Mixing Python in `apps/*` or `packages/*`** | Breaks pnpm workspace assumptions; pollutes Turborepo task graph |
| **Sharing types across languages** (Pydantic ↔ Zod via codegen) | Possible (datamodel-code-generator etc.) but coupling cost > benefit at this scale; use OpenAPI as the contract instead |
| **Deferring all Python plans without ADR** | The repo rename advertises polyglot intent; not documenting how would leave a contradiction |

---

# 6. Consequences

## Positive

* Node-first design today does not compromise for hypothetical futures
* Python services, when they arrive, are a clean isolated concern
* Each language uses its idiomatic tooling (pnpm + Turborepo for Node; uv + ruff + pytest for Python)
* No "lowest common denominator" orchestrator
* CI parallelism is natural (Node lane + Python lane run independently)

## Negative

* No single cross-language cache key (Python rebuilds don't know about Node changes and vice versa)
* Two CI lanes to maintain
* `justfile` is one more orchestration layer
* If Python services exceed 3 deployments with frequent cross-lang dependency, the isolation may strain — moonrepo migration would then become attractive (see §8)

---

# 7. Alternatives Considered

| Alternative | Rejected because |
|---|---|
| moonrepo from day 1 | Sacrifices Node-first ergonomics for unproven future benefit |
| bazel | Overkill; team-of-thousands tool |
| nx with Python plugins | Plugins shallow; loses Turborepo |
| Single pnpm workspace with Python in subfolder | Doesn't work — pnpm assumes JS package layout |
| Defer all Python planning silently | Rename to "service-foundry" already implies intent; future contributor reads contradiction |
| Embed Python inside Node packages as scripts | Maintenance + tooling nightmare |

---

# 8. Future re-evaluation triggers

Reopen this ADR if:

* Python services exceed **3 distinct deployments** with frequent cross-language dependency churn
* Shared **schema-of-truth across languages** becomes urgent (likely won't — OpenAPI handles most cases)
* moonrepo or equivalent becomes the de facto polyglot standard with mature TS + Python support
* A new language enters scope (Go, Rust) and the isolation pattern shows strain at 3+ language trees
* CI total wall time becomes dominated by lack of cross-language cache awareness

---

# 9. Open questions (to resolve when Python actually arrives)

| Question | When |
|---|---|
| uv vs poetry for Python workspace | When first Python service starts |
| ruff config preset shared across Python packages | Same |
| Python OpenTelemetry exporter wiring | First Python service |
| How Python services consume secrets / config | First Python service (mirror node-settings pattern via env vars?) |
| Whether to maintain a `@repo/<lang>-shared/openapi` contract registry | When 2nd Python service or 2nd TS↔Python integration arrives |
| Docker base image strategy across languages | First Python service |

---

# 10. Related

* [ADR-001](./0001-linting-formatting-strategy.md) — Lint/format (Node-side, Biome)
* [ADR-002](./0002-monorepo-foundations.md) — Locks Node/pnpm/Turborepo (Node side only)
* [ADR-003](./0003-package-layout-and-naming.md) — `apps/*` and `packages/*/*` are Node-only globs
* [ROADMAP.md](../../ROADMAP.md) — Python work is not in any Phase yet; this ADR is the only reference to it
