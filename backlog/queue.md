# Backlog Queue

> 본 문서는 *대시보드* 입니다. "지금 무엇을 하고 있고, 다음에 무엇을 해야 하는가"를 한눈에 보기 위함.
>
> **자동 갱신 마커**: `active`, `specx`, `done` — 마커 (`<!-- sdd:... -->`) 사이는 sdd가 관리하므로 그대로 두세요.
> **사람 편집 섹션**: `🧊 Icebox`, `📋 대기 Phase` — 자유 메모.

## 📦 진행 중 Phase

<!-- sdd:active:start -->
- **phase-01** — 모노레포 골격 (Monorepo Skeleton) — 2 spec — 다음: (spec 없음)
<!-- sdd:active:end -->

## 📥 spec-x 대기

<!-- sdd:specx:start -->
<!-- sdd:specx:end -->

## 🧊 Icebox

> 아이디어·보류 항목 보관소. 실행 불가. 관련 항목이 쌓이면 Phase로, 단발이면 spec-x로 승격.
> 이 섹션은 sdd가 건드리지 않습니다. 자유롭게 편집하세요.

- [ ] apps/admin 별도 앱 vs apps/web-vite route 결정 (Phase 4)
- [ ] tailwind를 packages/frontend/ui에만 둘지 각 앱에도 설치할지 (Phase 4)
- [ ] Drizzle/Prisma 마이그레이션 공통 wrapper(`pnpm db:migrate`) turbo task 통일 여부 (Phase 3 후반)
- [ ] Integration test orchestration: testcontainers (per-test 격리) vs docker-compose snapshot (전체 환경 미리 부팅) (Phase 5)
- [ ] Hono apps/edge-api scope: 같은 `/api` 모방 / 다른 엔드포인트 / Cloudflare Workers 전용 데모 (Phase 4)
- [ ] commit-time hook 명령 set (Biome only / + typecheck / + affected test) (Phase 1~5 중 결정)
- [ ] 보안 linter (semgrep / socket.dev) 추가 여부 — ADR 후보 (Phase 5 이전)
- [ ] lat.md Phase 2 도입 평가 (지식 그래프 도구)
- [ ] ARCHITECTURE.md 본체 재작성 (Phase 3 직전, ADR-0005 결정 후)

## 📋 대기 Phase

> 다음에 진행할 phase 를 자유롭게 메모합니다 (사람이 직접 편집).
> 자동 갱신되지 않습니다 — Icebox 와 동일한 정책.

- **phase-02** — shared primitives (FE/BE 공유 zod schema + utils + errors + validation + auth-contracts)
- **phase-03** — backend (ADR-0005/0006 결정 후 진입) — settings / logger / http-client / auth / cache / queue / database-prisma / database-drizzle / security / observability
- **phase-04** — apps (api / worker + frontend/ui / sdk / auth + web-next / web-vite / admin / edge-api) — vertical-slice login acceptance
- **phase-05** — 운영 / 도구 (docker-compose / generators / service-manifest / startup-report / typed-config-graph)
- **phase-06** — CI / CD (GitHub Actions + changesets release PR + docker publish + 선택 k8s manifest)

## ✅ 완료

<!-- sdd:done:start -->
없음
- [x] spec-x-roadmap-migration (완료)
<!-- sdd:done:end -->

---

## 📖 사용 방법

| 명령 | 동작 |
|---|---|
| `sdd phase new <slug>` | 새 Phase 생성 → 진행 중으로 등록 |
| `sdd phase new <slug> --base` | Phase base branch 모드로 생성 (opt-in) |
| `sdd spec new <slug>` | 진행 중 Phase에 다음 spec 등록 |
| `sdd plan accept` | spec Plan Accept → 실행 모드 진입 |
| `sdd ship` | spec 완료 처리 → Merged 갱신 + state 초기화 + NEXT 안내 |
| `sdd phase done <N>` | Phase 완료 → 완료 섹션으로 이동 |

자세한 사용법: `agent/constitution.md` §3 Work Type Model, `agent/agent.md`
