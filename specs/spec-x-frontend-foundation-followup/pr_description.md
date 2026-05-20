# feat(spec-x): phase-04 follow-up bundle — HealthCard 공통 + TanStack Query (web-next) + Dark mode

> phase-04 의 *논의 가치 이연 3 항목* 묶음. HealthCard 중복 해소 + Next 의 *진짜 RSC↔client hybrid* + dark mode toggle.

## 📋 Summary

phase-04 ship 시점에 사용자 지적 (*"이연 왜 이렇게 많지?"*) → A 채택 (PR 머지 + follow-up). 3 항목 bundle.

### 주요 변경

- [x] **HealthCard 공통 추출** — `@repo/frontend-ui/blocks/health-card.tsx` (loading 분기 포함). web-next/vite 의 복사본 + test 삭제 + import 정정
- [x] **TanStack Query (web-next)** — `'use client'` + `useHealthQuery` + `HealthCardClient`. page.tsx 의 RSC + client hybrid 시연
- [x] **Dark mode** — `next-themes` 도입 (SSR-safe, system 감지). `<ThemeToggle>` UI (`@repo/frontend-ui/blocks/theme-toggle.tsx`)
- [x] **NEXT_PUBLIC_API_BASE_URL** — client-side env 분리 (server-only `API_BASE_URL` 와 함께)
- [x] catalog: `next-themes ^0.4.6`
- [x] vitest.setup: `window.matchMedia` mock (next-themes 호환)

## 🎯 Key Review Points

1. **RSC + client query hybrid (web-next)**: `page.tsx` 가 *server fetch* + `<HealthCardClient>` 가 *client query* — **같은 `/health` 두 번 호출**. App Router 의 진짜 가치 시연.

2. **HealthCard 중복 해소** — `'use client'` directive 박혀있어 *RSC 안에서도 client island 로 자연 사용* + client component 안에서도 사용 가능.

3. **next-themes 표준 패턴** — `defaultTheme="system"` + `enableSystem` + `attribute="class"`. shadcn 공식 권장. flash-of-wrong-theme 자동 방지.

4. **`mounted` state pattern** — SSR ↔ client hydration mismatch 회피 (next-themes 공식 권장).

5. **`NEXT_PUBLIC_` env 분리** — server-only + client 두 영역 분리. dev 시 동일 URL, prod 시 분리 가능 (docker internal vs public).

6. **`@repo/frontend-ui` optional peer** — `next-themes` 박지 않는 호출자도 호환 (`peerDependenciesMeta.optional: true`).

7. **테스트 mock** — `window.matchMedia` jsdom 부재 → setup 박음. 후속 client-lib 패턴 답습.

8. **commit 5개** — catalog → HealthCard 추출 → TanStack Query → ThemeToggle → wire-up. 깔끔 sequence.

## 🧪 Verification

```bash
pnpm install && pnpm lint && pnpm typecheck && pnpm test
pnpm exec depcruise --config packages/config/depcruise-config/base.cjs .
```

**결과**:
- ✅ `pnpm lint`: 20 tasks PASS
- ✅ `pnpm typecheck`: 20 tasks FULL TURBO
- ✅ `pnpm test`: **181 test PASS**
- ✅ `depcruise`: **0 violations** (130 modules / 189 deps)

## 📝 Post-Merge — 사용자가 박을 명령

`.env` 갱신 필요 — `NEXT_PUBLIC_API_BASE_URL` 추가:

```bash
# 옵션 1: env.example 다시 복사
cp apps/web-next/env.example apps/web-next/.env

# 또는 옵션 2: 추가 (기존 .env 유지)
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:2026" >> apps/web-next/.env

# 부트
pnpm dev

# 브라우저:
# - http://localhost:2026/health (api JSON)
# - http://localhost:2027 (web-next: RSC Card + Client Card + ThemeToggle)
# - http://localhost:2028 (web-vite: client query Card + ThemeToggle)
# - ThemeToggle click → light ↔ dark 전환 + localStorage 동기
```

## ✅ DoD

- [x] HealthCard 공통 추출 + barrel export + import 정정
- [x] TanStack Query (web-next) — Provider + http-client + queries + HealthCardClient + page hybrid
- [x] next-themes + ThemeToggle (web-next + web-vite)
- [x] vitest.setup matchMedia mock
- [x] test/lint/typecheck/depcruise 그린
- [ ] walkthrough/pr_description ship commit
- [ ] PR 생성 (base = main)
- [ ] 사용자 알림 + .env 명령 가이드
