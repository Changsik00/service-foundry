# web-next

> Next.js 16 App Router + React 19 기반 SSR 웹 앱. RSC 서버 패치와 TanStack Query 클라이언트 패치를 동시에 시연하며, 로그인 UI와 인증 SDK를 통합한다.

## 실행

```bash
# 개발 (포트 2027)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 시작
pnpm start
```

환경변수: `API_BASE_URL` (서버 컴포넌트 → api 호출, server-only)

## 구성

조립하는 핵심 `@repo` 패키지:

- `@repo/frontend-auth-react` — React 인증 훅·프로바이더 SDK
- `@repo/frontend-http-client` — ky 기반 HTTP 클라이언트
- `@repo/frontend-ui` — 공유 UI 컴포넌트 (HealthCard·ThemeToggle 등)
- `@repo/auth-contracts` — 공유 인증 계약 타입
- `@repo/errors` — AppError 타입
- `@repo/tailwind-config` — Tailwind v4 글로벌 스타일

## 주요 라우트

| 경로 | 설명 |
|---|---|
| `/` | 홈 — RSC 서버 패치 + TanStack Query 클라이언트 패치 하이브리드 시연 |
| `/login` | 로그인 페이지 — `LoginForm` 클라이언트 컴포넌트 (`frontend-auth-react` 기반) |

## 자세히

- 레퍼런스: [`docs/reference/apps/web-next.md`](../../docs/reference/apps/web-next.md)
- 동작 원리: [`docs/explainers/frontend/login-ui-form.md`](../../docs/explainers/frontend/login-ui-form.md)
