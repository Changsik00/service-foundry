---
type: reference
aliases: [스택, 의존성 근거, dependencies, stack rationale]
tags: [service-foundry, reference, platform, dependencies]
---

# Stack — 의존성 도입 근거

> 💡 **한 줄 요약**: pnpm catalog(`pnpm-workspace.yaml`)에 고정된 주요 의존성을 "왜 도입했나"로 정리한다. 대부분 [[index|ADR]] 결정에 근거한다.
> **상위**: [[reference/architecture]] · **소스**: `pnpm-workspace.yaml` catalog + `docs/adr/*`

## runtime / backend

| dep | 도입 이유 | ADR |
|---|---|---|
| `zod` | TS-first 스키마 검증 + `parse → Result` 통합 + drizzle-zod 단일 SoT | [[adr/0010-validation-zod-result-integration\|ADR-0010]] |
| `ts-pattern` | exhaustive 패턴 매칭 — AI 생성 switch 안전성 | — |
| `pino` | 고성능 JSON 로거 (Node 백엔드 표준) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `drizzle-orm` | SQL 가시성 + PostgreSQL 정밀 제어 + drizzle-zod 시너지 (Prisma 불채택) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `pg` | Drizzle PostgreSQL driver | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `jose` | EdDSA(Ed25519) JWT 발급·검증, Node+Edge 호환 | [[adr/0013-session-lifecycle\|ADR-0013]] |
| `argon2` | OWASP 권장 argon2id 패스워드 해싱 | [[adr/0014-auth-security-baseline\|ADR-0014]] |
| `otplib` | TOTP(RFC 6238) MFA 코드 | [[adr/0006-auth-strategy\|ADR-0006]] |
| `bcryptjs` | argon2 미지원 환경 fallback 해싱 | [[adr/0014-auth-security-baseline\|ADR-0014]] |
| `@simplewebauthn/server` | WebAuthn/Passkey 서버 구현 (Auth Engine) | [[adr/0006-auth-strategy\|ADR-0006]] |
| `undici` | Node 22+ 네이티브 고성능 HTTP 클라이언트 | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `@env-kit/node-settings` | 환경 변수 로드·검증 (`@repo/backend-settings`) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |

## backend framework (NestJS)

| dep | 도입 이유 | ADR |
|---|---|---|
| `@nestjs/common` · `@nestjs/core` · `@nestjs/platform-express` | NestJS DI/모듈/HTTP 코어 | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `@nestjs/config` | 환경 설정 모듈 (`@repo/nestjs-settings`) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `@nestjs/testing` | TestingModule — 통합 테스트 DI 격리 | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `@nestjs/throttler` | 엔드포인트 rate limiting | [[adr/0014-auth-security-baseline\|ADR-0014]] |
| `helmet` | HTTP 보안 헤더 | [[adr/0014-auth-security-baseline\|ADR-0014]] |
| `cookie-parser` | httpOnly refresh token cookie 파싱 | [[adr/0013-session-lifecycle\|ADR-0013]] |
| `reflect-metadata` · `rxjs` | NestJS decorator/Observable 필수 | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |

## async / infra

| dep | 도입 이유 | ADR |
|---|---|---|
| `bullmq` | Redis 기반 job queue (이메일/비동기) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `ioredis` | Redis 클라이언트 (denylist + BullMQ) | [[adr/0006-auth-strategy\|ADR-0006]] |
| `@opentelemetry/*` | 분산 트레이싱/메트릭 계측 (자동계측 + OTLP) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `prom-client` | Prometheus 메트릭 노출 (`/metrics`) | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |

## frontend

| dep | 도입 이유 | ADR |
|---|---|---|
| `next` | SSR/App Router — `apps/web` 메인 | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `react` · `react-dom` | UI 렌더링 기반 | — |
| `@tanstack/react-router` · `react-query` | 타입 안전 라우팅 + 서버 상태 캐싱 | — |
| `ky` | fetch 기반 경량 HTTP 클라이언트 (`@repo/frontend-http-client`) | — |
| `tailwindcss` | utility-first CSS (v4) | — |
| `class-variance-authority` · `clsx` · `tailwind-merge` | variant·조건부 클래스 결합 | — |
| `@radix-ui/react-label` · `react-slot` | 접근성 headless UI | — |
| `react-hook-form` · `@hookform/resolvers` | 폼 성능 + zod resolver | [[adr/0010-validation-zod-result-integration\|ADR-0010]] |
| `sonner` | toast 알림 | — |
| `next-themes` | 다크모드 전환 | — |
| `firebase` | Firebase Auth SDK (`@repo/frontend-auth-firebase`) | [[adr/0006-auth-strategy\|ADR-0006]] |
| `@supabase/supabase-js` | Supabase Auth SDK (`@repo/frontend-auth-supabase`) | [[adr/0006-auth-strategy\|ADR-0006]] |

## toolchain

| dep | 도입 이유 | ADR |
|---|---|---|
| `typescript` | strict + NodeNext 타입 시스템 | [[adr/0001-linting-formatting-strategy\|ADR-0001]] · [[adr/0004-typescript-and-compilation-strategy\|ADR-0004]] |
| `tsx` | Node TS 스크립트 런타임 (tooling) | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `drizzle-kit` | Drizzle 마이그레이션 CLI | [[adr/0005-backend-framework-and-orm-strategy\|ADR-0005]] |
| `@biomejs/biome` | formatter + linter (ESLint 대체) | [[adr/0001-linting-formatting-strategy\|ADR-0001]] |
| `vitest` | 단위·통합 테스트 러너 | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `tsup` | 백엔드 패키지 ESM 컴파일 (dts+treeshake) | [[adr/0004-typescript-and-compilation-strategy\|ADR-0004]] |
| `knip` | 미사용 코드·의존성·export 탐지 | [[adr/0001-linting-formatting-strategy\|ADR-0001]] |
| `dependency-cruiser` | 아키텍처 경계 정적 강제 | [[adr/0001-linting-formatting-strategy\|ADR-0001]] · [[adr/0015-framework-adapter-naming-and-layout\|ADR-0015]] |
| `turbo` | 워크스페이스 태스크 그래프·캐싱 | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `lefthook` | pre-commit hook (biome+typecheck, husky 대체) | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `@changesets/cli` | 패키지별 버전 관리 + changelog | [[adr/0002-monorepo-foundations\|ADR-0002]] |
| `@turbo/gen` | `pnpm new` 스캐폴딩 generator | [[adr/0003-package-layout-and-naming\|ADR-0003]] |

## 연결된 개념
- [[reference/architecture]] — 시스템 구조
- [[explainers/platform/monorepo-build-turbo-tsup]] — turbo/tsup 빌드
- [[explainers/platform/config-packages-presets]] — config preset
- [[index]] — 전체 카탈로그

> 소스: `pnpm-workspace.yaml` catalog + `docs/adr/*` (의존성 마이닝 task-03)
