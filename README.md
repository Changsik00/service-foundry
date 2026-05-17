# service-foundry

> 새 서비스(api / web / worker)를 **30분 안에** 띄울 수 있는, **운영 가능한** Node/TS 모노레포 보일러플레이트.

개인용 보일러플레이트. "기술 데모"가 아니라 "운영 가능한 기본 시스템"이 목표. 실무에서 결국 다 쓰게 되는 것들(env validation, observability, auth, tracing, startup report, service manifest 등)을 미리 깔아둔다 — **YAGNI 면제**.

향후 Python(RAG / ML 추론) 워크로드가 합류할 가능성을 인지하지만 현재 스코프는 Node/TS 단독. 폴리글랏 전략은 [ADR-0007](./docs/adr/0007-polyglot-strategy.md) 참조.

---

## Status

**Phase 1 진행 중** — 모노레포 골격 작성 중. 자세한 상태는 [`ROADMAP.md`](./ROADMAP.md) 참조.

| Phase | 목표 | 상태 |
|---|---|---|
| 1 | 모노레포 골격 (root files, `packages/config/*` 6종) | 진행 중 |
| 2 | shared primitives (`packages/shared/*`) | 대기 |
| 3 | backend (ADR-005 / ADR-006 결정 후) | 블록됨 |
| 4 | apps (api / web-next / web-vite / admin / worker / edge-api) | 대기 |
| 5 | 운영 / 도구 (docker, generators, service manifest) | 대기 |
| 6 | CI / CD | 대기 |

---

## 결정 (ADRs)

확정된 결정은 모두 [`docs/adr/`](./docs/adr/)에 있다. (ADR 본문은 영어로 작성됨 — AI 에이전트 컨텍스트 친화 목적.)

* [ADR-0001](./docs/adr/0001-linting-formatting-strategy.md) — Lint / Format / Dead code / Boundary (Biome, Knip, dependency-cruiser)
* [ADR-0002](./docs/adr/0002-monorepo-foundations.md) — pnpm 11 + catalogs / turborepo / Node 22 LTS / lefthook / changesets / tsx
* [ADR-0003](./docs/adr/0003-package-layout-and-naming.md) — `packages/<category>/<pkg>` + `@repo/*` flat import + `*-config` suffix
* [ADR-0004](./docs/adr/0004-typescript-and-compilation-strategy.md) — TS strict / no project references / tsup(backend) + JIT(shared, frontend)
* [ADR-0005](./docs/adr/0005-backend-framework-and-orm-strategy.md) — Backend framework + ORM (**보류** — Phase 3 spike 후 결정)
* [ADR-0006](./docs/adr/0006-auth-strategy.md) — Auth (**보류** — ADR-0005와 동시 결정)
* [ADR-0007](./docs/adr/0007-polyglot-strategy.md) — Python sibling tree 전략

설계 개요는 [`ARCHITECTURE.md`](./ARCHITECTURE.md). turborepo 사용 룰 요약은 [`docs/turborepo-rules.md`](./docs/turborepo-rules.md).

---

## Quickstart

```bash
# 전제: Node 22 LTS, pnpm 11.1.2 (corepack로 자동 활성화)
fnm use      # .nvmrc 기준 Node 22 자동 활성화 (nvm 쓰면 `nvm use`)
corepack enable

# 설치
pnpm install

# 검사
pnpm lint
pnpm typecheck
pnpm test
```

Turbo 기준 동등:

```bash
pnpm turbo run lint typecheck test
```

> Phase 1 acceptance가 끝나기 전까지 위 명령들은 "골격이 일관되게 그린"임을 증명하는 용도. 실제 사용 가능한 서비스 패키지는 Phase 3 이후 등장.

> ⚠️ `engines.node`는 `>=22.0.0 <23`로 잠겨 있다 (ADR-0002 §3). Node 24+로 `pnpm install`을 돌리면 unsupported engine 경고. `.nvmrc`에 맞춰 fnm/nvm으로 22 활성화할 것.

---

## Layout

```
service-foundry/
├─ apps/                # (Phase 4) api / web-next / web-vite / admin / worker / edge-api
├─ packages/
│  ├─ config/           # *-config 6종 (Phase 1)
│  ├─ shared/           # FE/BE 공유 primitives (Phase 2)
│  ├─ backend/          # node 전용 인프라 (Phase 3)
│  ├─ frontend/         # ui / sdk / auth (Phase 4)
│  └─ testing/          # vitest setup + testcontainers
├─ tooling/             # docker / scripts / generators (Phase 5)
└─ docs/                # ADR + 운영 가이드
```

폴더 그룹은 단순 디렉토리(`package.json` 없음). 패키지 이름은 항상 `@repo/<name>` flat import. 자세한 룰은 [ADR-0003](./docs/adr/0003-package-layout-and-naming.md) 참조.
