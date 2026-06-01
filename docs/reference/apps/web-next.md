---
type: reference
aliases: ["@apps/web-next", "웹 Next.js", "SSR 프론트엔드"]
tags: [service-foundry, reference, frontend, app]
---

# web-next — Next.js 16 App Router SSR 웹 프론트엔드

> 💡 **한 줄 요약**: Next.js 16 App Router + React 19 기반 SSR 웹 앱. RSC 서버 패치와 TanStack Query 클라이언트 패치를 동시에 시연하며, 로그인 UI와 인증 SDK를 통합한다.
> **위치**: `apps/web-next` · **상위**: [[architecture]]

## 요약

`web-next` 는 service-foundry 의 메인 SSR 웹 애플리케이션이다. Next.js 16 App Router(RSC) 를 기반으로 하며, 서버 컴포넌트에서 직접 `api` 의 `/health` 를 호출해 HTML 을 렌더링하고(zero-bundle), 동시에 `'use client'` 컴포넌트에서 TanStack Query 로 동일 데이터를 클라이언트 사이드로 패치하는 하이브리드 패턴을 보여 준다. 포트: `2027`.

> 📄 **위치**: `apps/web-next` · **포트**: `2027` · **환경**: `API_BASE_URL` (서버→api 호출)

## 책임

- Next.js App Router RSC 렌더링: 서버 컴포넌트에서 `api /health` 호출 후 HTML 생성
- `/login` 페이지: `LoginForm` 클라이언트 컴포넌트 — `frontend-auth-react` SDK 기반 인증
- TanStack Query 클라이언트 패치 하이브리드: RSC + `'use client'` 동시 운용 패턴 시연
- `next-themes` 다크모드, `@repo/frontend-ui` 공유 UI 컴포넌트 렌더링

## 구성 (조립하는 @repo 패키지)

| 패키지 | 역할 |
|---|---|
| [[reference/packages/frontend-auth-react\|frontend-auth-react]] | React 인증 훅·프로바이더 SDK |
| [[reference/packages/frontend-auth-testing\|frontend-auth-testing]] | 인증 테스트 유틸리티 |
| [[reference/packages/frontend-http-client\|frontend-http-client]] | ky 기반 HTTP 클라이언트 |
| [[reference/packages/frontend-ui\|frontend-ui]] | 공유 UI 컴포넌트 (HealthCard·ThemeToggle 등) |
| [[reference/packages/shared-auth-contracts\|auth-contracts]] | 공유 인증 계약 타입 |
| [[reference/packages/shared-errors\|errors]] | AppError 타입 |
| [[reference/packages/shared-utils\|utils]] | 공유 유틸리티 |
| [[reference/packages/config-tailwind-config\|tailwind-config]] | Tailwind v4 preset |

## 주요 라우트

| 경로 | 컴포넌트 | 설명 |
|---|---|---|
| `/` | `src/app/page.tsx` (async RSC) | 홈 — RSC 서버 패치 + 클라이언트 패치 하이브리드 시연 |
| `/login` | `src/app/login/page.tsx` | 로그인 페이지 — LoginForm 클라이언트 컴포넌트 |

## 연결된 개념

- [[explainers/frontend/login-ui-form]] — LoginForm UI 구조 및 폼 검증 흐름
- [[explainers/frontend/http-auth-sdk-inline]] — 프론트엔드 HTTP 클라이언트·인증 SDK 인라인 패턴
- [[explainers/frontend/auth-react-provider-sdk-contract]] — React 인증 프로바이더·SDK 계약
- [[reference/architecture]] — 전체 시스템 구조

> 소스: spec-04-03, spec-08-04, spec-09-02/03 · `apps/web-next/src/`
