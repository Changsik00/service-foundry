# fix(spec-x): `pnpm dev` 부트 정정 (Vite `@/` alias + apps/api dotenv)

> phase-04 ship 직후 `pnpm dev` 부트 시 2 app fail 발견 → 즉시 정정 spec-x. 2 file 변경 + .env 박을 사용자 가이드.

## 📋 Summary

### 문제

`pnpm dev` 부트 시:

1. **`@apps/web-vite`** — `[plugin:vite:import-analysis] Failed to resolve import "@/components/health-card.js"`
   - 원인: tsconfig 의 `paths: { "@/*": ["./src/*"] }` 박혀있지만 *Vite resolve.alias* 미박힘
2. **`@apps/api`** — `NodeSettingsError: env validation failed (NODE_ENV / DATABASE_URL / HTTP_CLIENT_BASE_URL)`
   - 원인: `tsx watch` 가 `.env` 자동 로드 안 함

### 해결

| 파일 | 변경 |
|---|---|
| `apps/web-vite/vite.config.ts` | `resolve.alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) }` |
| `apps/api/package.json` | `dev` / `start` script 에 `--env-file-if-exists=.env` (Node 22+ native) |

## 🎯 Key Review Points

1. **Vite resolve.alias 명시** — `vite-tsconfig-paths` plugin 대신 *명시 alias* (zero dep). 후속 Vite 패키지 답습.

2. **`--env-file-if-exists`** — Node.js 22+ 의 *조건부 dotenv*. 파일 없으면 skip (강제 fail 회피).

3. **`.env` Write 권한 제약**: Claude Code 가 `.env*` Write 차단 — 사용자 직접 박는 명령 본 PR 본문 안내.

4. **phase-04 ship 시점 미검증**: agent 의 phase ship 검증 (test/build/depcruise + web-next curl) 이 *실 통합 부트* 안 박음 — 사용자가 *처음 박는 시점* 에 fail 발견. walkthrough §발견 사항 #1 *교훈* 박음.

## 🧪 Verification

```bash
pnpm typecheck   # ✓ 20 tasks
pnpm lint        # ✓ 20 tasks
```

머지 후 사용자가 박을 명령 (3 app `.env` 박음):
```bash
cp apps/api/env.example apps/api/.env
cp apps/web-next/env.example apps/web-next/.env
cp apps/web-vite/env.example apps/web-vite/.env

# 재부트
pnpm dev

# 브라우저 확인:
# - http://localhost:3000/health  → apps/api JSON
# - http://localhost:3001         → web-next RSC Card
# - http://localhost:3002         → web-vite client query Card
```

## 📝 Post-Merge

- [ ] Merge → `main` (spec-x — 일반 모드)
- [ ] `sdd specx done frontend-dev-fixes` 자동 호출 (sdd ship 가 처리)
- [ ] 사용자가 `.env` 3 개 박은 후 `pnpm dev` 재시도

## ✅ Definition of Done

- [x] `vite.config.ts` resolve.alias 추가
- [x] `apps/api/package.json` dev/start `--env-file-if-exists=.env`
- [x] `pnpm typecheck` / `pnpm lint` 그린
- [x] walkthrough.md / pr_description.md ship
- [ ] PR 생성 (base = `main`)
- [ ] 사용자 알림 + `.env` 명령 가이드
