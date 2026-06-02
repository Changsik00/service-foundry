# spec-x-frontend-dev-fixes: `pnpm dev` 부트 정정 (Vite alias + apps/api dotenv)

## 📋 메타

| 항목 | 값 |
|---|---|
| **Spec ID** | `spec-x-frontend-dev-fixes` |
| **Phase** | (없음 — spec-x) |
| **Branch** | `spec-x-frontend-dev-fixes` |
| **상태** | Planning |
| **타입** | Fix |
| **작성일** | 2026-05-20 |
| **소유자** | dennis |

## 📋 배경 및 문제 정의

### 현재 상황

phase-04 ship 직후 root `pnpm dev` 박음. 두 가지 문제 발견:

1. **`@apps/web-vite`**: tsconfig 의 `paths: { "@/*": ["./src/*"] }` 박혀있지만 *Vite resolve.alias* 미박힘 → `@/components/health-card.js` / `@/lib/queries.js` 못 찾음. Dev server 부트 실패.

2. **`@apps/api`**: `tsx watch src/main.ts` 가 *.env 자동 로드 안 함* — `NODE_ENV`, `DATABASE_URL`, `HTTP_CLIENT_BASE_URL` 미박힘 → `@env-kit/node-settings` 검증 fail 부트 실패.

### 문제점

- *모든 app 동시 부트* (`pnpm dev`) 시점에 *2 개 app fail* — boilerplate 의 *기본 워크플로* 깨짐
- 사용자가 *직접 env 박을 가이드 부재*
- web-next 는 Next.js 가 *자동 `.env` 로드* — apps/api 는 *tsx 가 안 함*

### 해결 방안 (요약)

1. `vite.config.ts` 에 `resolve.alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) }` 박음 — tsconfig 와 동기
2. `apps/api/package.json` 의 `dev` / `start` script 에 `--env-file-if-exists=.env` 박음 — tsx 가 *.env 자동 로드* (Node.js 22+ native), 파일 없으면 skip
3. 사용자가 *직접 `.env` 박을 명령* — README 또는 PR 본문 안내

## 🎯 요구사항

### Functional Requirements

1. **Vite alias 동기화**: `apps/web-vite/vite.config.ts` 에 `resolve.alias` 박음 — tsconfig 의 `@/*` paths 와 동기
2. **apps/api dotenv 자동 로드**: `dev` / `start` script 에 `--env-file-if-exists=.env` 박음
3. **사용자 가이드**: PR 본문에 `.env` 박을 명령 (`cp env.example .env`) 안내

### Non-Functional Requirements

1. 기존 동작 변경 0 — Vite alias 가 *추가* 만, apps/api script 가 *기존 동작 + .env 옵션*
2. `.env.example` (점 없는 파일) 그대로 — Claude Code 차단 제약 유지

## 🚫 Out of Scope

- env 박는 *자동화 script* (`pnpm setup` 등): 별 spec
- apps/web-next 의 `.env` 자동 박음: Next.js 가 *자동 로드* — 별 작업 없음
- apps/web-vite 의 `.env` 자동 박음: Vite 가 *자동 로드* (`VITE_` prefix) — 별 작업 없음
- monorepo 의 *공통 env* 패턴 (root `.env`): 별 spec

## ✅ Definition of Done

- [ ] `apps/web-vite/vite.config.ts` resolve.alias 추가
- [ ] `apps/api/package.json` dev/start script `--env-file-if-exists=.env` 추가
- [ ] `pnpm typecheck` / `pnpm lint` 그린 (test 영향 없음)
- [ ] PR 본문에 사용자 명령 가이드 박음
- [ ] PR 생성 + 머지
