# Walkthrough: spec-x-frontend-dev-fixes

> phase-04 ship 직후 `pnpm dev` 박음 → 3 app 중 2 fail. 즉시 정정 spec-x.

## 📌 결정

| 이슈 | 해결 |
|---|---|
| **web-vite `@/` alias 미박힘** | `vite.config.ts` 에 `resolve.alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) }` 박음 — tsconfig paths 와 동기 |
| **apps/api dotenv 미자동 로드** | `dev` / `start` script 에 `--env-file-if-exists=.env` 박음 (Node 22+ native, tsx 가 옵션 전달) |
| **`.env` 박는 책임** | 사용자 직접 (Claude Code `.env*` Write 차단) — PR 본문 가이드 |
| spec scope | spec-x (1 PR, 2 file edit, fix 성격) |

## 💬 사용자 협의

| 시점 | 사용자 결정 |
|---|---|
| `pnpm dev` fail 박음 | "이거부터 확인하고 가자" |
| 정정 방향 (지금 / 후속) | A: 지금 정정 |
| Plan Accept | "여기에서 지금 문제 다 해결해봐" — 즉시 진행 |

## 🔁 진행

### T1 — branch 생성
- `git checkout -b spec-x-frontend-dev-fixes`

### T2 — fix commit
- `apps/web-vite/vite.config.ts` resolve.alias 박음
- `apps/api/package.json` dev/start script `--env-file-if-exists=.env`
- `pnpm typecheck` ✓ 20 tasks, `pnpm lint` ✓ 20 tasks
- spec 문서 + queue.md auto-update 동봉
- Commit: `fix(spec-x): vite @/ alias + apps/api dotenv 자동 로드`

### T3 — ship + PR (본 commit)

## 🔍 발견 사항

1. **phase-04 ship 시점 통합 부트 미검증** — agent 가 *test/build/depcruise* + *web-next curl* 만 검증. *3 app 동시 부트* 는 *사용자가 처음 박는 시점* 에 fail 드러남. **교훈**: phase ship 의 *통합 테스트 시나리오* 가 *실 부트 + 실 fetch* 까지 박혀있어야 *진짜 검증*. 후속 phase 답습 패턴.

2. **`vite.config.ts` resolve.alias ↔ tsconfig paths**: vite 가 *tsconfig paths 자동 인식 안 함*. `vite-tsconfig-paths` plugin 또는 *명시 alias* 둘 중 하나 필요. boilerplate 는 *명시 alias* (zero dep). 후속 Vite 패키지 답습.

3. **`tsx --env-file-if-exists`** (Node 22+ native): tsx 가 *Node 옵션 전달* — `--env-file=.env` (파일 없으면 fail) 또는 `--env-file-if-exists=.env` (skip). 후자가 *dev 친화* (강제 fail 회피).

4. **`.env` Write 차단의 한계**: Claude Code 가 `.env*` 패턴 hard-block — 사용자 직접 박아야. PR 본문에 *명령 가이드* 박는 게 유일한 우회. 후속 spec 진입 시 동일.

## 🚧 이월

- **phase ship 검증 강화**: *실 부트 + 실 fetch* 통합 테스트 자동화 — 별 spec 또는 phase-10 (CI) 영역
- **monorepo 공통 env 패턴**: root `.env` 박음 vs *각 app `.env`* — 별 spec
