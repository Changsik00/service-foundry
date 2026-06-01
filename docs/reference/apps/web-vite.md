---
type: reference
aliases: ["@apps/web-vite", "웹 Vite SPA", "Vite 프론트엔드"]
tags: [service-foundry, reference, frontend, app]
---

# web-vite — Vite SPA 프론트엔드 데모

> 💡 **한 줄 요약**: Vite 8 + React + TanStack Router/Query 기반 SPA 앱. 파일 기반 라우팅과 클라이언트 사이드 헬스체크 쿼리를 시연하는 개발 레퍼런스 앱이다.
> **위치**: `apps/web-vite` · **상위**: [[architecture]]

## 요약

`web-vite` 는 service-foundry 의 SPA 데모 프론트엔드이다. Vite 를 번들러로, TanStack Router 를 파일 기반 클라이언트 라우터로, TanStack Query 를 서버 상태 관리로 사용한다. 루트 라우트(`/`)에서 `useHealthQuery` 로 `api /health` 를 조회해 `HealthCard` 컴포넌트에 렌더링하는 단순 구조를 가지며, `next-themes` 다크모드를 포함한다. 포트: `2028`.

> 📄 **위치**: `apps/web-vite` · **포트**: `2028` · **라우터**: TanStack Router (파일 기반, `routeTree.gen.ts` 자동 생성)

## 책임

- TanStack Router 파일 기반 라우팅 패턴 시연 (`src/routes/` → `routeTree.gen.ts` 자동 생성)
- TanStack Query 로 `api /health` 클라이언트 사이드 조회 (`useHealthQuery`) 시연
- `@repo/frontend-ui` 공유 컴포넌트(HealthCard·ThemeToggle) 렌더링
- `next-themes` 다크모드 및 `@repo/frontend-http-client` HTTP 클라이언트 통합

## 구성 (조립하는 @repo 패키지)

| 패키지 | 역할 |
|---|---|
| [[reference/packages/frontend-http-client\|frontend-http-client]] | ky 기반 HTTP 클라이언트 |
| [[reference/packages/frontend-ui\|frontend-ui]] | 공유 UI 컴포넌트 (HealthCard·ThemeToggle 등) |
| [[reference/packages/shared-errors\|errors]] | AppError 타입 |
| [[reference/packages/config-tailwind-config\|tailwind-config]] | Tailwind v4 preset |

## 주요 라우트

| 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `src/routes/index.tsx` | 홈 — `useHealthQuery` 로 api 헬스체크 표시 |

## 연결된 개념

- [[reference/architecture]] — 전체 시스템 구조
- [[reference/stack]] — Vite·TanStack 도입 근거

> 소스: spec-04-04, spec-x-frontend-dev-fixes, spec-x-frontend-foundation-followup · `apps/web-vite/src/`
