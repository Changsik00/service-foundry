# Implementation Plan: spec-x-frontend-dev-fixes

## 📋 Branch Strategy

- 신규 브랜치: `spec-x-frontend-dev-fixes` (시작: `main`)

## 🛑 사용자 검토 필요

> [!IMPORTANT]
> - [x] `pnpm dev` 부트 실패 즉시 정정 — phase-04 follow-up 의 일부 아님 (별 spec-x)

## 🎯 핵심 전략

| 영역 | 변경 |
|:---:|:---|
| **`apps/web-vite/vite.config.ts`** | `resolve.alias = { "@": fileURLToPath(...) }` 추가 — tsconfig paths 와 동기 |
| **`apps/api/package.json`** | `dev` / `start` script 에 `--env-file-if-exists=.env` 박음 |
| **PR 본문** | 사용자가 `.env` 박을 명령 안내 (`cp env.example .env` × 3 app) |

## 📂 Proposed Changes

### [MODIFY] `apps/web-vite/vite.config.ts`
```ts
import { fileURLToPath, URL } from "node:url";
// ...
resolve: {
  alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
},
```

### [MODIFY] `apps/api/package.json`
```json
"dev": "tsx watch --env-file-if-exists=.env src/main.ts",
"start": "tsx watch --env-file-if-exists=.env src/main.ts"
```

## 🧪 검증

```bash
pnpm typecheck && pnpm lint
# 사용자: cp 명령 × 3 후
pnpm dev    # 3 app 동시 부트 + /health 정상
```

## 📦 Deliverables 체크

- [x] task.md 작성
- [ ] Plan Accept
- [ ] 모든 task 완료
- [ ] walkthrough.md / pr_description.md ship
