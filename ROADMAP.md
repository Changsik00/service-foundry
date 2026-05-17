# service-foundry — Roadmap

Working backlog, vision, and open questions for the boilerplate. Authoritative *decisions* live in `docs/adr/*`. This file tracks what's planned, in flight, and undecided.

---

## 1. Vision

새 서비스(api/web/worker)를 **30분 안에** 띄울 수 있는, **운영 가능한** Node/TS 모노레포 보일러플레이트.

### 원칙

* "기술 데모"가 아니라 "운영 가능한 기본 시스템"
* **YAGNI 면제** — 실무에서 결국 다 쓰게 되는 것들을 미리 깔아둔다
* backend/frontend가 같은 zod schema 공유 (`@repo/shared/contracts`)
* **AI-first** — AI가 매 세션 일관된 결과를 내도록 컨벤션 · boundary · 테스트를 박는다 (`docs/adr/0001-linting-formatting-strategy.md` 참조)

---

## 2. Phases

ADR로 결정된 스택 기반. 의존성 순서대로 진행.

### Phase 1 — 모노레포 골격 (진행 중)

**Root files:**
* `package.json` — `name=service-foundry`, `private=true`, `packageManager=pnpm@11.1.2`, `engines.node>=22`, scripts: `lint` / `typecheck` / `test` / `build` (turbo 위임)
* `pnpm-workspace.yaml` — `apps/*` + `packages/*/*` + catalog (zod / pino / typescript / vitest / biome / tsup / knip)
* `turbo.json` — `lint` / `typecheck` / `test` / `build` 파이프라인, outputs / dependsOn
* `.gitignore`, `.editorconfig`, `.nvmrc` (22), `LICENSE` (MIT)
* `lefthook.yml` — pre-commit: `biome check --apply` + `tsc --noEmit`
* `.changeset/config.json`
* `README.md` — 이름 / 한 줄 설명 / ADR·ROADMAP 링크 / quickstart

**`packages/config/` 6종:**
* `@repo/biome-config`
* `@repo/typescript-config`
* `@repo/vitest-config`
* `@repo/tsup-config`
* `@repo/knip-config`
* `@repo/depcruise-config`

**Acceptance (Phase 1 종료 기준):**
1. `pnpm install` 무경고
2. `turbo run lint` 그린 (Biome via `@repo/biome-config`)
3. `turbo run typecheck` 그린 (`@repo/typescript-config` 상속)
4. `turbo run test` 그린 (Vitest via `@repo/vitest-config`, 빈 placeholder 테스트 1개 OK)
5. 두 번째 `turbo run lint` → 캐시 100% hit
6. `lefthook run pre-commit` 통과
7. dependency-cruiser 룰 시범 실행 (스텁 패키지만 있어 violation 없음 확인)

스텁 패키지: `packages/shared/utils` 한 개로 1~7 검증 (실제 첫 Phase 2 패키지가 될 자리이기도 함).

> **Note**: `turbo run build` acceptance는 Phase 3에서 첫 compiled 패키지(`packages/backend/*` + `@repo/tsup-config`)가 등장할 때 검증. Phase 1의 stub는 JIT(`packages/shared/*`)이라 build 파이프라인은 정의만 해두고 실제 실행은 보류.

### Phase 2 — shared primitives (대기)

* `packages/shared/utils`
* `packages/shared/errors`
* `packages/shared/validation`
* `packages/shared/contracts`
* `packages/shared/auth-contracts` (auth 3-package 중 1번째)
* FE/BE 양쪽에서 import 가능한지 검증

### Phase 3 — backend (gated by ADR-005 / ADR-006)

**블로커:**

* ADR-005 spike 실행 → backend framework + ORM 결정 (Task #6)
* ADR-006 auth 결정 (ADR-005와 함께)
* `docs/conventions/backend-module-layout.md` 작성 (Task #7)

해제 후:

* `packages/backend/settings` (node-settings wrap)
* `packages/backend/logger`
* `packages/backend/http-client`
* `packages/backend/auth` (auth 3-package 중 2번째)
* `packages/backend/cache`
* `packages/backend/queue`
* `packages/backend/database-prisma`
* `packages/backend/database-drizzle`
* `packages/backend/security`
* `packages/backend/observability`

### Phase 4 — apps (대기)

* `apps/api` (모든 backend package 통합 reference)
* `apps/worker`
* `packages/frontend/ui` (shadcn + tailwind)
* `packages/frontend/sdk` (zod → OpenAPI → codegen)
* `packages/frontend/auth` (auth 3-package 중 3번째)
* `apps/web-next` (App Router + tanstack-query)
* `apps/web-vite` (Vite + tanstack-router + tanstack-query)
* `apps/admin` (web-vite와 같은 스택, 별도 layout — 분리 여부 §4.2 참조)
* `apps/edge-api` (Hono — edge / serverless 예제)
* **Acceptance**: `docs/features/0001-login.md` vertical-slice가 작동 (FE 폼 → API → Postgres → JWT → protected route → logout)

### Phase 5 — 운영 / 도구 (대기)

* `tooling/docker/`: docker-compose (postgres + redis + prometheus + grafana + tempo + loki)
* `tooling/generators/`: plop 기반 `pnpm new package`, `pnpm new app`
* `tooling/scripts/`: startup report, service manifest, etc.
* §3 차별화 기능 본격화

### Phase 6 — CI / CD (대기)

* GitHub Actions: lint + typecheck + test + build (turbo affected)
* changesets 자동 release PR
* docker publish
* optional: k8s manifest 예제

---

## 3. 차별화 포인트 — "운영 친화"

대부분 보일러플레이트가 "앱 생성"까지만 다루는 데 비해 이 repo는 운영 영역을 흡수.

| 항목 | 상태 | 비고 |
|---|---|---|
| `.env.example` 자동 생성 | ✓ node-settings로 커버 | dogfooding |
| K8s manifest drift 검출 | ✓ node-settings로 커버 | dogfooding |
| Strict env validation (boot 시 실패) | ✓ node-settings로 커버 | dogfooding |
| **service manifest** (각 app의 `service.yaml`: port/expose/depends) | 예정 (Phase 5) | 자체 구현 |
| **startup report** (boot 시 masked config dump) | 예정 (Phase 5) | 자체 구현 |
| **typed config graph** (config 의존 그래프 시각화) | 예정 (Phase 5+) | 자체 구현 |
| **dependency-cruiser boundary 강제** | 예정 (Phase 1) | ADR-001 |
| **ADR-driven 결정 (AI가 traceable)** | 진행 중 | `docs/adr/0001~0007` |
| **lat.md 도입** (지식 그래프) | Phase 2 평가 | Task #5 |

---

## 4. Open Questions

### 4.1 Active blockers (Phase 3 진입 전 결정 필요)

* [ ] **ADR-005 spike 실행** → NestJS+Drizzle vs Fastify+Drizzle 최종 결정 (Task #6)
* [ ] **ADR-006 auth 결정** (ADR-005와 동시) → @nestjs/passport vs better-auth 등
* [ ] `docs/conventions/backend-module-layout.md` 작성 (ADR-005 결정 직후, Task #7)

### 4.2 Pending decisions

* [ ] `apps/admin` 별도 앱 vs `apps/web-vite` 안의 route
* [ ] tailwind를 `packages/frontend/ui`에만 두고 앱이 거기서만 사용 vs 각 앱에도 설치
* [ ] Drizzle/Prisma 마이그레이션을 각자 폴더에 두되 공통 wrapper 명령(`pnpm db:migrate`)을 turbo task로 통일할지
* [ ] Integration test orchestration: testcontainers (per-test 격리) vs docker-compose snapshot (전체 환경 미리 부팅)
* [ ] Hono `apps/edge-api`의 scope: 같은 `/api` 모방 vs 다른 엔드포인트 vs Cloudflare Workers 전용 데모
* [ ] commit-time hook이 돌릴 정확한 명령 set (Biome only? + typecheck? + affected test?)
* [ ] 보안 linter (semgrep / socket.dev) 추가 여부 — ADR 후보 (Phase 5 이전 결정)
* [ ] lat.md Phase 2 도입 평가 (Task #5)
* [ ] ARCHITECTURE.md 본체 재작성 (Phase 3 직전, ADR-005 결정 후)

### 4.3 Resolved (참고용 기록)

| 결정 | 출처 |
|---|---|
| npm scope: `@repo/*` | ADR-003 |
| 도구 설정 패키지: `*-config` suffix | ADR-003 |
| 폴더 구조: `packages/<category>/<pkg>` | ADR-003 |
| env/config 통합: `packages/backend/settings` (node-settings wrap) | locked stack memory |
| 내부 버전 도구: changesets | ADR-002 |
| commit-time hook: lefthook | ADR-002 |
| Node 버전: 22 LTS | ADR-002 |
| pnpm 11 + catalogs | ADR-002 |
| Lint/Format: Biome | ADR-001 |
| Dead code: Knip | ADR-001 |
| Boundary 강제: dependency-cruiser | ADR-001 |
| TS 전략: no root tsconfig, no project references, no paths, strict | ADR-004 |
| Backend 빌드: tsup (compiled), frontend/shared = JIT | ADR-004 |
| Database: PostgreSQL | ADR-005 §3 |
| Auth 3-package split (shared / backend / frontend) | ADR-003 §6 |
| Token strategy: JWT access + refresh (Redis denylist) | ADR-006 |
| Password hashing: argon2 | ADR-006 |

---

## 5. 참고 자산

* `Project/Nextpay/aiagent-monorepo/packages/config-*` — config 패키지 패턴 레퍼런스 (네이밍은 우리는 suffix로 정정)
* `Changsik00/node-settings` — env / config / runtime 자산. `@repo/backend/settings`로 dogfooding
* `1st1/lat.md` — 코드베이스 지식 그래프 도구. Phase 2 도입 평가 예정

---

## 6. 상태 표기

* `[ ]` 대기 (pending)
* `◐` 진행 중 (in progress)
* `✓` 완료 (resolved)
* `—` 해당 없음
