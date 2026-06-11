# Frontend Architecture — apps/web

> **범위**: `apps/web` (멀티테넌트 SaaS 콘솔 — ADR-0025) 의 구조 규칙.
> 범용 스택 패턴 → [FRONT.md](./FRONT.md) / 디자인 → [../design/DESIGN.md](../design/DESIGN.md)
> 스택·테넌시·인증의 "왜" → ADR-0005/0006/0022/0023/0025 (이 문서는 구조의 "어떻게"만)

---

## 0. Quick Reference

```
새 화면       → src/app/<route>/page.tsx (RSC 기본, 인터랙션만 client)
새 도메인 기능 → src/features/<name>/ 생성 → index.ts 로만 노출
API 연결      → packages/contracts 스키마 → features/<name>/api.ts → queries.ts → 컴포넌트
상태          → 서버 데이터: TanStack Query / 토큰: @repo/frontend-auth-store / 폼: RHF
에러          → FRONT.md §4.2 분기표
```

---

## 1. 레이어 모델

```
src/app/                Next App Router — URL·레이아웃·가드. 조합만, 비즈니스 로직 없음
  └─ src/features/      도메인 모듈 (auth, orgs, members, …) — UI + 쿼리 + 스키마
       └─ src/lib/      앱 전역 horizontal — http client 조립, env, 공용 유틸
            └─ @repo/*  워크스페이스 패키지 — frontend-auth-store, frontend-http-client, ui, contracts
```

의존 방향은 위 → 아래만. 아래가 위를 import 하면 위반.

## 2. 폴더 구조 (목표 규칙)

> 현재 `src/lib/` 에 auth 파일 6개가 평면으로 쌓여 있다 — 이 규칙이 정리 기준이다 (개편 실행: spec-x-auth-screens).

```
src/
├── app/                        # 라우트 — 조합·가드만
│   ├── (auth)/                 # 비로그인 그룹: login, signup, invite/[token]
│   ├── (console)/              # 로그인 그룹: 사이드바 레이아웃 + 도메인 페이지
│   │   ├── layout.tsx          # AppShell + 인증 가드
│   │   └── orgs/ …
│   └── layout.tsx              # 루트: Providers, 폰트, 전역 토스터
├── features/
│   ├── auth/                   # LoginForm, SignupForm, schema, useLogin …
│   └── orgs/                   # TenantSwitcher, MemberTable, queries …
│       └── index.ts            # public API — re-export 만
├── components/                 # 도메인 모름: AppShell, Sidebar (shadcn ui 는 @repo/frontend-ui)
├── lib/                        # http-client 조립, supabase-auth wiring
└── env.ts                      # getEnv()/getPublicEnv() (FRONT.md §2)
```

**배치 판단**: 다른 feature 에서도 쓰는가? → Yes: `@repo/frontend-ui` 또는 `components/` / No, 도메인 데이터를 아는가? → `features/<domain>/`.

## 3. 불변규칙 (Invariants)

| # | 규칙 | 위반 예 |
|---|---|---|
| 1 | `features/A` 는 `features/B` 내부를 직접 import 금지 | orgs 에서 `features/auth/useLogin` import — 공유가 필요하면 패키지로 승격 |
| 2 | `features/*` 는 `index.ts` 로만 외부 노출 | `app/` 에서 `features/orgs/MemberTable` 직접 import |
| 3 | `app/` 라우트 파일에 비즈니스 로직·직접 fetch 금지 | page.tsx 안 `fetch()` |
| 4 | 토큰 접근은 `@repo/frontend-auth-store` 경유만 | 컴포넌트에서 `localStorage.getItem("…auth-token")` |
| 5 | API 호출은 `@repo/frontend-http-client` 인스턴스 경유만 | 컴포넌트에서 raw `fetch` |
| 6 | env 직접 접근 금지 — `env.ts` 의 `getEnv()`/`getPublicEnv()` 만 | `process.env.NEXT_PUBLIC_…` 산재 |
| 7 | 하드코딩 hex 금지 — TOKEN.md 토큰만 (소셜 브랜드 컬러 예외) | `text-[#888888]` |
| 8 | 서버 전용 env 를 client 파일에서 import 금지 | `"use client"` 파일에서 `getEnv()` |

## 4. 인증 아키텍처 (이 레포의 실배선)

> 패턴의 정본: ADR-0006(Consistent Wrapped SDK)·ADR-0023(권위 모드). 여기는 web 관점 요약.

```
Supabase SDK ──connectSupabaseAuth()──▶ @repo/frontend-auth-store (AuthStatus 3-state)
                                              │ 역주입 (auth: AuthSource)
                                              ▼
                                   @repo/frontend-http-client
                                   unknown → waitUntilSettled(5s)
                                   authenticated → Bearer 자동 주입
                                   unauthenticated + requiresAuth → AppError(401) 즉시
                                   401 수신 → refresh() → 재시도 1회
                                              ▼
                                   apps/api (JWKS 검증 → guard → RLS)
```

- 화면은 토큰을 모른다 — `httpClient.get("/orgs", { requiresAuth: true })` 가 전부.
- 인증 만료 전역 처리(로그인 이동)는 http-client 인터셉터 1곳.
- active org 전환: 전환 API → 토큰 재발급(`active_org` 클레임) → 콘솔 쿼리 전체 invalidate.

## 5. 라우트 가드

| 그룹 | 가드 |
|---|---|
| `(auth)` | 로그인 상태면 콘솔로 redirect |
| `(console)` | 미로그인이면 `/login?redirect=<path>` / 복수 조직 + active 없음 → `/orgs` |
| `/invite/[token]` | 공개 — 내부에서 로그인 여부 분기 (DESIGN.md §6.4) |

가드는 그룹 `layout.tsx` 1곳 — 페이지마다 중복 작성 금지.

## 6. 쿡북

**새 도메인 기능 (예: 청구)**
```
1. features/billing/schema.ts     # contracts 재사용 우선, 없을 때만 로컬 Zod
2. features/billing/api.ts        # http-client 경유 호출 함수
3. features/billing/queries.ts    # queryOptions (key: ["orgs", orgId, "billing", …])
4. features/billing/BillingPage.tsx + index.ts
5. app/(console)/billing/page.tsx # 조합만
6. DESIGN.md §8 Audit Checklist 자가검증
```

**shadcn 컴포넌트 추가**: `@repo/frontend-ui` 에 추가 (`pnpm dlx shadcn@latest add …`) → TOKEN.md §6 오버라이드 적용 → 앱은 `@repo/frontend-ui` 에서 import.

**e2e**: `apps/web/e2e/` (Playwright, 루트 `.env` 로드). API+web 동시 기동 full-stack — `pnpm --filter @apps/web test:e2e`. 보안·격리 시나리오는 mock 우회 금지, 실 HTTP 경로 필수.
