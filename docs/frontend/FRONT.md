# Frontend Stack Guide (범용)

> **범위**: 스택 사용 패턴 — 다른 프로젝트로 그대로 가져갈 수 있도록 범용으로 작성.
> 이 레포 특화(폴더 규칙·불변규칙·auth 흐름) → [ARCHITECTURE.md](./ARCHITECTURE.md)
> 스택 선택의 "왜" → `docs/adr/` (이 문서는 "어떻게 쓰나"만)
> **버전 주의**: 코드 예시는 패턴 설명용. 정확한 API 는 설치된 버전이 SoT (루트 ARCHITECTURE §0.1).

---

## 1. 스택 개요

| 도구 | 역할 | 핵심 패턴 |
|---|---|---|
| Next.js (App Router) | 프레임워크 | RSC/client 분리 (§2) |
| React 19 | UI | ref-as-prop, `use()`, useActionState |
| Tailwind CSS v4 | 스타일 | CSS-first `@theme inline` (§5) |
| shadcn/ui | 컴포넌트 | 소스 소유 + a11y 위임 (§6) |
| TanStack Query v5 | 서버 상태 | queryOptions (§3) |
| React Hook Form + Zod | 폼 | 스키마 → 타입 추론 (§4) |
| Zustand | 전역 클라이언트 상태 | React 트리 밖 접근 (`getState()`) |

### 상태 도구 선택 기준 (외우는 표)

| 상태 종류 | 도구 |
|---|---|
| API 응답 데이터 | TanStack Query |
| 인증 토큰 (전역·트리 밖 접근) | Zustand (vanilla store) |
| 폼 입력값 | React Hook Form |
| UI 토글·모달 열림 | `useState` |
| 필터·페이지 등 공유 가능한 화면 상태 | URL searchParams |

---

## 2. RSC / Client 분리

App Router 의 핵심 규율 — **경계를 의식적으로 긋는다**.

| | Server Component (기본) | Client Component (`"use client"`) |
|---|---|---|
| 데이터 | 직접 fetch (서버 전용 env 사용 가능) | TanStack Query |
| env | `getEnv()` — 서버 전용 키 포함 | `getPublicEnv()` — `NEXT_PUBLIC_*` 명시 참조만 |
| 적합 | 레이아웃, 정적 콘텐츠, 초기 데이터 | 인터랙션, 폼, 구독·refetch |

### env 의 함정 (실전에서 한 번 터진 것)

브라우저에서 `process.env` 는 통째로 `{}` 다. 번들러는 **`process.env.NEXT_PUBLIC_FOO` 라는 명시적 표현식만** 정적 치환한다.

```ts
// ❌ 클라이언트에서 침묵 실패 — schema.parse(process.env)
// ✅ 키를 하나하나 명시 참조
export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
```

서버/클라이언트 스키마를 분리하고, 서버 전용 키가 클라이언트 스키마에 들어가지 않게 한다.

---

## 3. TanStack Query

### 3.1 queryOptions 패턴 (표준)

쿼리 정의를 컴포넌트 밖 객체로 — key·fn·옵션이 한 곳에, loader/컴포넌트/테스트가 같은 정의를 공유.

```ts
export const memberQueries = {
  list: (orgId: string) => queryOptions({
    queryKey: ["orgs", orgId, "members"],
    queryFn: () => api.members.list(orgId),
    staleTime: 60_000,
  }),
};
```

- queryKey 는 계층형 (`["orgs", orgId, "members"]`) — invalidate 가 prefix 매칭으로 동작.
- 컴포넌트: `useSuspenseQuery(memberQueries.list(orgId))` 권장 — 로딩/에러를 경계(Suspense/ErrorBoundary)가 담당.

### 3.2 Mutation

```ts
useMutation({
  mutationFn: api.members.invite,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orgs", orgId, "members"] }),
  onError: (err) => { /* §4.2 에러 분기표 */ },
});
```

낙관적 업데이트는 되돌리기 쉬운 토글류에만. 생성·삭제는 invalidate 가 기본.

---

## 4. Form — RHF + Zod

### 4.1 스키마 먼저, 타입은 추론

```ts
export const inviteSchema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요 (예: user@example.com)"),
  role: z.enum(["admin", "member"]),
});
export type InviteInput = z.infer<typeof inviteSchema>;
```

- 에러 메시지는 스키마에 — UI 와 분리, 일관성 보장. 메시지 톤은 DESIGN.md §9.
- 서버와 계약 공유가 가능하면 contracts 패키지의 스키마를 import (이중 정의 금지).

### 4.2 에러 분기표 (외우는 표)

| 에러 | 표시 위치 | 방법 |
|---|---|---|
| 형식 오류 (Zod) | 필드 아래 인라인 | `<FormMessage />` 자동 |
| 비즈니스 오류 (401 자격증명, 409 중복) | **해당 필드** 아래 인라인 | `form.setError(field, { message })` |
| 서버 장애 (5xx)·네트워크 | Toast | mutation `onError` |
| 권한 (403) | 페이지 전환/안내 | 라우트 가드 |
| 인증 만료 (401 on API) | 로그인 이동 | HTTP client 인터셉터 (전역 1곳) |

원칙: **사용자가 고칠 수 있는 에러는 인라인, 고칠 수 없는 에러는 Toast.**

### 4.3 1~2 필드 폼

RHF 보일러플레이트가 과하면 `useActionState` 허용. 3개 필드부터는 RHF.

---

## 5. Tailwind v4

```css
@import "tailwindcss";

@theme inline {              /* inline 필수 — CSS 변수 참조 유지 (런타임 오버라이드 가능) */
  --color-brand: #2383e2;    /* 선언 즉시 bg-brand, text-brand 유틸 생성 */
}
```

- `@theme` vs `@theme inline`: 런타임 테마 전환(테넌트 슬롯·다크모드)이 필요하면 **inline**. 일반 `@theme` 은 빌드 시 값이 박제된다.
- 임의값 `w-[240px]` 은 일회성만. 두 번 쓰이면 `@theme` 토큰으로 승격.
- 토큰 값의 정본은 디자인 문서 (이 레포: `docs/design/TOKEN.md`).

---

## 6. shadcn/ui

### 6.1 소유 모델

npm 라이브러리가 아니다 — CLI 가 소스를 복사하고 **내가 소유**한다.

```bash
pnpm dlx shadcn@latest add button input dialog
```

- 디자인 토큰에 맞게 자유 수정. 단 재실행 시 덮어씀 — 수정 후 diff 확인 습관.
- variant 확장은 CVA 로 (`buttonVariants` 에 추가).

### 6.2 접근성 — "맡기고, 빈틈만 막는다"

shadcn 밑은 Radix primitives: role·focus trap·키보드 내비·aria 연결이 **이미 정확**하다.

> **원칙: shadcn/Radix 컴포넌트에 `aria-*`/`role` 을 직접 추가하지 않는다.**
> 이중 aria 는 개선이 아니라 해악이다 — 스크린리더 중복 낭독, role 충돌. "접근성을 신경 쓴" 결과물이 접근성을 망가뜨리는 가장 흔한 경로.

shadcn 이 못 지켜주는 빈틈 — **이것만** 챙긴다:

| # | 규칙 | 비고 |
|---|---|---|
| 1 | icon-only 버튼 → `aria-label` 필수 | 보이는 텍스트가 있으면 불필요 (중복 금지) |
| 2 | `DialogTitle` / `SheetTitle` 생략 금지 | 가장 흔한 누락 — Radix 가 콘솔 경고 |
| 3 | 이미지 `alt` — 장식이면 `alt=""`, 정보면 서술 | |
| 4 | FormField **밖**에서 raw `<input>` 쓸 때만 `<label htmlFor>` 직접 연결 | FormField 안은 자동 |
| 5 | `outline: none` 단독 금지 — `:focus-visible` 대체 스타일 필수 | 토큰: 디자인 문서 포커스 링 |
| 6 | 색상 단독으로 상태 전달 금지 — 아이콘/텍스트 병행 | |

이 표가 전부다. 막연한 "접근성 개선" 패스는 돌리지 않는다.

---

## 7. React 19 — 쓰는 것만

| 기능 | 용도 |
|---|---|
| ref as prop | `forwardRef` 불필요 — `function Input({ ref, ...props })` |
| `<Context value>` | `.Provider` 불필요 |
| `use(promise)` | Suspense 하위에서 promise 읽기 |
| `useActionState` | 1~2 필드 단순 폼 (§4.3) |
| `useOptimistic` | 되돌리기 쉬운 토글 |

`useDeferredValue`·`startTransition` 은 측정된 성능 문제가 있을 때만 — 선제 적용 금지.

---

## 8. 다른 프로젝트로 가져갈 때 교체 포인트

| 항목 | 교체 내용 |
|---|---|
| 디자인 토큰 | `@theme inline` + `:root` 값 (이 레포: TOKEN.md 매핑) |
| API base / 인증 방식 | HTTP client 설정 + 인터셉터 |
| 에러 코드 매핑 | §4.2 표의 분기 기준은 유지, 코드만 교체 |
| 폴더·도메인 규칙 | 프로젝트별 ARCHITECTURE.md 로 분리 (이 문서엔 없음 — 의도) |
