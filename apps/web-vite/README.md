# web-vite

> Vite 7 + React + TanStack Router/Query 기반 SPA 앱. 파일 기반 라우팅과 클라이언트 사이드 헬스체크 쿼리를 시연하는 개발 레퍼런스 앱.

## 실행

```bash
# 개발 (포트 2028)
pnpm dev

# 프로덕션 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

환경변수: `VITE_API_BASE_URL` (클라이언트 번들 공개 — public API base)

## 구성

조립하는 핵심 `@repo` 패키지:

- `@repo/frontend-http-client` — ky 기반 HTTP 클라이언트
- `@repo/frontend-ui` — 공유 UI 컴포넌트 (HealthCard·ThemeToggle 등)
- `@repo/errors` — AppError 타입
- `@repo/tailwind-config` — Tailwind v4 글로벌 스타일

## 주요 라우트

| 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `src/routes/index.tsx` | 홈 — `useHealthQuery` 로 api 헬스체크 표시 |

TanStack Router 파일 기반 라우팅: `src/routes/` → `routeTree.gen.ts` 자동 생성

## 자세히

- 레퍼런스: [`docs/reference/apps/web-vite.md`](../../docs/reference/apps/web-vite.md)
