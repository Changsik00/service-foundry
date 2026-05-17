# ADR-001: Linting / Formatting / Code Quality Strategy for AI-First Monorepo

* Status: Accepted
* Date: 2026-05-17
* Owners: Platform / Frontend / Backend
* Scope: Monorepo (Frontend + Backend + Shared Packages)

---

# Context

This repository is designed as an AI-first development environment.

Primary characteristics:

* Monorepo architecture
* `pnpm` workspace
* `Turborepo`
* Shared packages between frontend/backend
* Heavy use of AI coding agents

  * Claude Code
  * Codex
  * Cursor
  * Windsurf
* High emphasis on:

  * DX (Developer Experience)
  * Fast iteration
  * Consistent code generation
  * Low maintenance overhead
  * CI speed
  * Architectural consistency

Historically, enterprise linting strategies focused on controlling human mistakes through large rule sets and complex static analysis pipelines.

However, in AI-assisted development, the dominant risks have shifted.

The primary issues are now:

* Dead code generation
* Partial migrations
* Dependency drift
* Architectural boundary violations
* Duplicate abstractions
* Circular imports
* AI-generated over-engineering
* Slow feedback loops

Therefore, the repository requires a tooling strategy optimized for:

* Fast feedback
* Low configuration complexity
* Strong architectural safety
* AI compatibility
* Automated cleanup/detection

rather than traditional enterprise-style style policing.

---

# Decision

The repository will adopt the following strategy:

```txt
Biome
+ TypeScript strict mode
+ Knip
+ dependency-cruiser
+ CI-based architectural validation
```

The repository will NOT adopt a heavily customized ESLint ecosystem unless a future requirement explicitly demands it.

---

# Detailed Decisions

## 1. Formatter + Base Linter

### Decision

Use:

```txt
Biome
```

as the primary formatter and lightweight linter.

### Why

Biome provides:

* Extremely fast execution
* Minimal configuration
* Stable auto-fix behavior
* Consistent formatting
* Excellent AI-agent compatibility
* Reduced dependency complexity
* Reduced plugin maintenance burden

Compared to:

```txt
ESLint + Prettier + multiple plugins
```

Biome significantly reduces:

* Configuration drift
* Plugin conflicts
* Parser incompatibilities
* Auto-fix instability
* AI-generated lint loops

This is especially important in AI-assisted workflows where agents continuously modify files.

### Explicit Non-Goals

The repository will NOT optimize for:

* Large style-rule ecosystems
* Extensive custom AST rules
* Legacy ESLint compatibility
* Highly granular formatting preferences

Style enforcement is considered lower priority than architectural integrity and cleanup automation.

---

# 2. Type Safety

## Decision

Enable strict TypeScript configuration globally.

### Configuration

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Why

TypeScript strict mode provides:

* Strong static guarantees
* Better AI-generated code validation
* Faster issue detection
* Reduced runtime bugs
* More predictable refactoring

Strict typing is considered more valuable than excessive lint rule expansion.

---

# 3. Dead Code Detection

## Decision

Adopt:

```txt
Knip
```

for unused code and dependency analysis.

### Why

AI-generated code frequently introduces:

* Unused utilities
* Unused types
* Orphaned hooks
* Duplicate abstractions
* Partial migrations
* Dead exports

Traditional linting does not sufficiently detect repository-wide dead code accumulation.

Knip is specifically valuable in AI-assisted repositories because it detects:

* Unused files
* Unused exports
* Unused dependencies
* Unused scripts

This reduces long-term repository entropy.

---

# 4. Architectural Boundary Enforcement

## Decision

Adopt:

```txt
dependency-cruiser
```

for dependency graph validation.

### Why

AI agents are effective at local pattern generation but weaker at preserving global architectural constraints.

Common AI-induced issues:

* Layer violations
* Shared package leakage
* Circular dependencies
* Cross-domain imports
* Infra/domain coupling

dependency-cruiser enables explicit architectural rules such as:

```txt
frontend -> backend import forbidden
infra -> domain forbidden
apps cannot bypass shared contracts
circular imports forbidden
```

This protects long-term monorepo maintainability.

---

# 5. CI Philosophy

## Decision

CI pipelines should prioritize:

```txt
Fast feedback
```

over exhaustive style enforcement.

### Why

In AI-first repositories:

* Code generation cost is low
* Cleanup cost is high

Therefore:

* Rapid validation
* Immediate feedback
* Structural integrity
* Dead code detection

are more valuable than:

* Formatting micromanagement
* Naming convention enforcement
* Excessive stylistic lint rules

---

# 6. Explicitly Rejected Approaches

## Rejected: Heavy Enterprise ESLint Stack

Example:

```txt
eslint
@typescript-eslint/*
eslint-plugin-import
eslint-plugin-react
eslint-plugin-unicorn
eslint-plugin-sonarjs
custom AST rules
complex flat config
```

### Reasons for Rejection

* High maintenance cost
* Slower CI
* Plugin fragmentation
* AI auto-fix instability
* Increased configuration complexity
* Higher onboarding burden
* Frequent parser/plugin version conflicts

The cost/benefit ratio is not justified for this repository strategy.

---

# 7. AI-First Engineering Philosophy

This repository assumes:

```txt
AI will generate a large amount of code.
```

Therefore the system is optimized for:

```txt
Detecting bad code quickly
```

rather than:

```txt
Preventing humans from writing bad code manually
```

The architecture prioritizes:

* Cleanup automation
* Boundary enforcement
* Fast iteration
* Predictable tooling
* Repository scalability
* AI workflow stability

over traditional rule-heavy governance models.

---

# Consequences

## Positive

* Faster development cycles
* Better AI integration
* Simpler onboarding
* Lower maintenance burden
* Faster CI
* Cleaner monorepo boundaries
* Better dead-code management
* Reduced lint/config fatigue

## Negative

* Smaller plugin ecosystem than ESLint
* Less granular lint customization
* Reduced legacy compatibility
* Some advanced semantic linting unavailable
* Potential future migration cost if requirements change

---

# Future Re-evaluation Criteria

This ADR should be revisited if:

* The repository requires advanced semantic linting
* Framework-specific ESLint integrations become mandatory
* Security/compliance policies require stricter static analysis
* AI tooling patterns significantly evolve
* Biome ecosystem maturity changes substantially

---

# Final Strategy Summary

```txt
Formatting:
  Biome

Type Safety:
  TypeScript strict mode

Dead Code Detection:
  Knip

Architecture Enforcement:
  dependency-cruiser

CI Philosophy:
  Fast feedback over style micromanagement

Primary Goal:
  AI-friendly scalable monorepo maintenance
```
